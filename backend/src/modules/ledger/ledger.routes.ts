import { FastifyPluginAsync } from "fastify";

export const ledgerRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => ({ module: "ledger" }));
};
