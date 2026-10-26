import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth-routes";
import { healthRoutes } from "./routes/health";
import { usersRoutes } from "./routes/users-routes";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  .use(healthRoutes)
  .use(usersRoutes)
  .use(authRoutes)
  .listen(port);

console.log(
  `Server is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
