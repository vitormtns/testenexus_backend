import { env } from "./config/env";
import { buildApp } from "./app";

async function start(): Promise<void> {
  try {
    const app = await buildApp();

    await app.listen({
      port: env.PORT,
      host: "0.0.0.0"
    });

    app.log.info(`HTTP server listening on port ${env.PORT}`);
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void start();
