import type { FastifyPluginAsync } from "fastify";

import { authMiddleware } from "../../shared/auth/auth-middleware";
import { LedgerController } from "./ledger.controller";

const controller = new LedgerController();

export const ledgerRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: authMiddleware }, controller.list.bind(controller));
};
