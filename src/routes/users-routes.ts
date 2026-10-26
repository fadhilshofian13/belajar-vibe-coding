import { Elysia, t } from "elysia";
import {
  getProfileByToken,
  registerUser,
  UnauthorizedError,
  UserAlreadyExistsError,
} from "../services/users-services";

export const usersRoutes = new Elysia({ prefix: "/api/v1/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        await registerUser(body);

        return { message: "User created successfully" };
      } catch (error) {
        if (error instanceof UserAlreadyExistsError) {
          set.status = 409;
          return { message: "User already exists" };
        }

        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 1 }),
      }),
    },
  )
  .get("/profile", async ({ headers, set }) => {
    const token = extractBearerToken(headers.authorization);

    if (!token) {
      set.status = 401;
      return { message: "Unauthorized" };
    }

    try {
      const profile = await getProfileByToken(token);

      return { data: profile };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        set.status = 401;
        return { message: "Unauthorized" };
      }

      throw error;
    }
  });

function extractBearerToken(header: string | undefined): string | null {
  const match = header?.match(/^Bearer\s+(\S+)$/i);

  return match?.[1] ?? null;
}
