import { env } from "./config/env";
import { buildApp } from "./app";

async function bootstrap() {
  const app = await buildApp();

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
