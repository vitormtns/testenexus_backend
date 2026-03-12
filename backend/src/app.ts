import Fastify from "fastify";
import sensible from "@fastify/sensible";

import { errorHandler } from "./shared/errors/error-handler";
import { authRoutes } from "./modules/auth/auth.routes";
import { walletRoutes } from "./modules/wallet/wallet.routes";
import { webhookRoutes } from "./modules/webhooks/webhooks.routes";
import { swapRoutes } from "./modules/swap/swap.routes";
import { withdrawalsRoutes } from "./modules/withdrawals/withdrawals.routes";
import { ledgerRoutes } from "./modules/ledger/ledger.routes";
import { transactionsRoutes } from "./modules/transactions/transactions.routes";

export async function buildApp() {
  const app = Fastify();

  await app.register(sensible);

  app.setErrorHandler(errorHandler);

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(walletRoutes, { prefix: "/wallet" });
  await app.register(webhookRoutes, { prefix: "/webhooks" });
  await app.register(swapRoutes, { prefix: "/swap" });
  await app.register(withdrawalsRoutes, { prefix: "/withdrawals" });
  await app.register(ledgerRoutes, { prefix: "/ledger" });
  await app.register(transactionsRoutes, { prefix: "/transactions" });

  return app;
}
