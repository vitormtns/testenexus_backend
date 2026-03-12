import { FastifyPluginAsync } from "fastify";

export const swapRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ module: "swap" }));
};
