import { Token } from "@prisma/client";
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

export class CoinGeckoService {
  readonly baseUrl = env.COINGECKO_API_URL.replace(/\/$/, "");

  async getTokenPricesInBrl(): Promise<TokenPriceMap> {
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
    return {
      BRL: 1,
      BTC: prices.bitcoin.brl,
      ETH: prices.ethereum.brl,
      USDT: prices.tether.brl
    };
  }
}
