import type { FastifyPluginAsync } from "fastify";

import { authMiddleware } from "../../shared/auth/auth-middleware";
import { WithdrawalsController } from "./withdrawals.controller";

const controller = new WithdrawalsController();

export const withdrawalsRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", { preHandler: authMiddleware }, controller.create.bind(controller));
};
