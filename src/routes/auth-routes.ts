import { Elysia, t } from "elysia";
import {
  InvalidCredentialsError,
  login,
  logout,
  UnauthorizedError,
} from "../services/auth-services";
import { extractBearerToken } from "../utils/bearer-token";

export const authRoutes = new Elysia({ prefix: "/api/v1" })
  .post(
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
  )
  .delete("/logout", async ({ headers, set }) => {
    const token = extractBearerToken(headers.authorization);

    if (!token) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    try {
      await logout(token);

      return { message: "Logout successful" };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      throw error;
    }
  });
