import { Elysia, t } from "elysia";
import {
  InvalidCredentialsError,
  login,
  logout,
  UnauthorizedError,
} from "../services/auth-services";
import { extractBearerToken } from "../utils/bearer-token";

const messageResponse = t.Object({ message: t.String() });

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
      detail: {
        tags: ["Auth"],
        summary: "Log in and get a session token",
        description:
          "Creates a new session and returns its token in `data`. Send the token as `Authorization: Bearer <token>` to protected endpoints.",
      },
      response: {
        200: t.Object({ message: t.String(), data: t.String() }),
        401: messageResponse,
      },
    },
  )
  .delete(
    "/logout",
    async ({ headers, set }) => {
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
    },
    {
      detail: {
        tags: ["Auth"],
        summary: "Log out and delete the current session",
        description:
          "Deletes only the session of the given token. Other sessions of the same user stay valid.",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: messageResponse,
        401: messageResponse,
      },
    },
  );
