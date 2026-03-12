import type { FastifyPluginAsync } from "fastify";

import { authMiddleware } from "../../shared/auth/auth-middleware";
import { WalletController } from "./wallet.controller";

const controller = new WalletController();

export const walletRoutes: FastifyPluginAsync = async (app) => {
  app.get("/balances", { preHandler: authMiddleware }, controller.getBalances.bind(controller));
};
