import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { authRoutes } from "./routes/auth-routes";
import { healthRoutes } from "./routes/health";
import { usersRoutes } from "./routes/users-routes";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia()
  .use(
    openapi({
      path: "/swagger",
      provider: "swagger-ui",
      documentation: {
        info: {
          title: "Belajar Vibe Coding API",
          version: "1.0.0",
          description:
            "REST API for user registration, login, profile, and logout. Protected endpoints use a session token sent as a Bearer token.",
        },
        tags: [
          { name: "Health", description: "Server and database status" },
          { name: "Users", description: "User registration and profile" },
          { name: "Auth", description: "Login and logout" },
        ],
        components: {
          securitySchemes: {
            bearerAuth: { type: "http", scheme: "bearer" },
          },
        },
      },
    }),
  )
  .use(healthRoutes)
  .use(usersRoutes)
  .use(authRoutes)
  .listen(port);

console.log(
  `Server is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
