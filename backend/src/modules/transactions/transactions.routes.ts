import { FastifyPluginAsync } from "fastify";

export const transactionsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ module: "transactions" }));
};
