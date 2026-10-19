import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia().use(healthRoutes).listen(port);

console.log(
  `Server is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
