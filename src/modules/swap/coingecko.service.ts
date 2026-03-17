import { Token } from "@prisma/client";
import { createClient } from "redis";
import { z } from "zod";

import { env } from "../../config/env";
import { AppError } from "../../shared/errors/app-error";

const coingeckoPriceSchema = z.object({
  bitcoin: z.object({
    brl: z.number().positive()
  }),
  ethereum: z.object({
    brl: z.number().positive()
  }),
  tether: z.object({
    brl: z.number().positive()
  })
});

const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether"
} as const;

type TokenPriceMap = Record<Token, number>;

const tokenPriceMapSchema = z.object({
  BRL: z.number().positive(),
  BTC: z.number().positive(),
  ETH: z.number().positive(),
  USDT: z.number().positive()
});

const COINGECKO_PRICES_CACHE_KEY = "coingecko:prices:brl";
const COINGECKO_PRICES_CACHE_TTL_SECONDS = 60;

type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;
let redisConnectionPromise: Promise<RedisClient | null> | null = null;

async function getRedisClient(): Promise<RedisClient | null> {
  if (!env.REDIS_URL) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisConnectionPromise) {
    return redisConnectionPromise;
  }

  const client = createClient({
    url: env.REDIS_URL
  });

  client.on("error", () => {
    // Redis is only an optimization here, so runtime errors are ignored.
  });

  redisConnectionPromise = client
    .connect()
    .then(() => {
      redisClient = client;
      redisConnectionPromise = null;
      return client;
    })
    .catch(async () => {
      redisConnectionPromise = null;

      try {
        await client.disconnect();
      } catch {
        // Ignore cleanup failures and fall back to direct CoinGecko calls.
      }

      return null;
    });

  return redisConnectionPromise;
}

export class CoinGeckoService {
  readonly baseUrl = env.COINGECKO_API_URL.replace(/\/$/, "");

  async getTokenPricesInBrl(): Promise<TokenPriceMap> {
    const cachedPrices = await this.getCachedTokenPricesInBrl();

    if (cachedPrices) {
      return cachedPrices;
    }

    const query = new URLSearchParams({
      ids: Object.values(COINGECKO_IDS).join(","),
      vs_currencies: "brl",
      precision: "full"
    });

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/simple/price?${query.toString()}`);
    } catch {
      throw new AppError("Failed to reach CoinGecko", 502);
    }

    if (!response.ok) {
      throw new AppError("CoinGecko quote request failed", 502);
    }

    const json = await response.json();
    const parsed = coingeckoPriceSchema.safeParse(json);

    if (!parsed.success) {
      throw new AppError("Invalid quote data received from CoinGecko", 502);
    }

    const prices = parsed.data;

    // The app supports BRL as fiat and BTC/ETH/USDT as assets.
    // We normalize every asset to BRL first, then derive any pair quote from that base.
    const tokenPrices = {
      BRL: 1,
      BTC: prices.bitcoin.brl,
      ETH: prices.ethereum.brl,
      USDT: prices.tether.brl
    };

    await this.cacheTokenPricesInBrl(tokenPrices);

    return tokenPrices;
  }

  private async getCachedTokenPricesInBrl(): Promise<TokenPriceMap | null> {
    try {
      const client = await getRedisClient();

      if (!client) {
        return null;
      }

      const cachedPrices = await client.get(COINGECKO_PRICES_CACHE_KEY);

      if (!cachedPrices) {
        return null;
      }

      const parsed = tokenPriceMapSchema.safeParse(JSON.parse(cachedPrices));

      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private async cacheTokenPricesInBrl(prices: TokenPriceMap): Promise<void> {
    try {
      const client = await getRedisClient();

      if (!client) {
        return;
      }

      await client.set(COINGECKO_PRICES_CACHE_KEY, JSON.stringify(prices), {
        EX: COINGECKO_PRICES_CACHE_TTL_SECONDS
      });
    } catch {
      // Ignore Redis failures and preserve the existing CoinGecko flow.
    }
  }
}
