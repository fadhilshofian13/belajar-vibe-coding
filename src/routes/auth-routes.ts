import { Elysia, t } from "elysia";
import { InvalidCredentialsError, login } from "../services/auth-services";

export const authRoutes = new Elysia({ prefix: "/api/v1" }).post(
  "/login",
  async ({ body, set }) => {
    try {
      const token = await login(body);

      return { message: "Login successful", data: token };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        set.status = 401;
        return { message: "Email or password is incorrect" };
      }

      throw error;
    }
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 1 }),
    }),
  },
);
