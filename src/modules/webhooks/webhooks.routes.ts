import type { FastifyPluginAsync } from "fastify";

import { WebhooksController } from "./webhooks.controller";

const controller = new WebhooksController();

export const webhooksRoutes: FastifyPluginAsync = async (app) => {
  app.post("/deposit", controller.deposit.bind(controller));
};
