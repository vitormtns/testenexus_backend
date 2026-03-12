import type { FastifyPluginAsync } from "fastify";

import { authMiddleware } from "../../shared/auth/auth-middleware";
import { AuthController } from "./auth.controller";

const controller = new AuthController();

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/register", controller.register.bind(controller));
  app.post("/login", controller.login.bind(controller));
  app.post("/refresh", controller.refresh.bind(controller));
  app.get("/me", { preHandler: authMiddleware }, controller.me.bind(controller));
};
