import { FastifyPluginAsync } from "fastify";

export const walletRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ module: "wallet" }));
};
