import type { FastifyPluginAsync } from "fastify";

import { authMiddleware } from "../../shared/auth/auth-middleware";
import { TransactionsController } from "./transactions.controller";

const controller = new TransactionsController();

export const transactionsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: authMiddleware }, controller.list.bind(controller));
};
