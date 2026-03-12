import { FastifyPluginAsync } from "fastify";

export const withdrawalsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ module: "withdrawals" }));
};
