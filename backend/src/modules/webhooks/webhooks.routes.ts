import { FastifyPluginAsync } from "fastify";

export const webhookRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ module: "webhooks" }));
};
