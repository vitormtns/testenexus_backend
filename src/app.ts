import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify, { type FastifyInstance } from "fastify";

import { env } from "./config/env";
import { authRoutes } from "./modules/auth/auth.routes";
import { ledgerRoutes } from "./modules/ledger/ledger.routes";
import { swapRoutes } from "./modules/swap/swap.routes";
import { transactionsRoutes } from "./modules/transactions/transactions.routes";
import { walletRoutes } from "./modules/wallet/wallet.routes";
import { webhooksRoutes } from "./modules/webhooks/webhooks.routes";
import { withdrawalsRoutes } from "./modules/withdrawals/withdrawals.routes";
import { errorHandler } from "./shared/errors/error-handler";
import type { HealthResponse } from "./shared/http/types";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true
  });

  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET
  });

  app.get<{ Reply: HealthResponse }>("/health", async () => {
    return { status: "ok" };
  });

  app.setErrorHandler(errorHandler);

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(walletRoutes, { prefix: "/wallet" });
  await app.register(webhooksRoutes, { prefix: "/webhooks" });
  await app.register(swapRoutes, { prefix: "/swap" });
  await app.register(withdrawalsRoutes, { prefix: "/withdrawals" });
  await app.register(ledgerRoutes, { prefix: "/ledger" });
  await app.register(transactionsRoutes, { prefix: "/transactions" });

  return app;
}
