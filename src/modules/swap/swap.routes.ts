import type { FastifyPluginAsync } from "fastify";

import { authMiddleware } from "../../shared/auth/auth-middleware";
import { SwapController } from "./swap.controller";

const controller = new SwapController();

export const swapRoutes: FastifyPluginAsync = async (app) => {
  app.post("/quote", controller.quote.bind(controller));
  app.post("/execute", { preHandler: authMiddleware }, controller.execute.bind(controller));
};
