import { Elysia, t } from "elysia";
import { UnauthorizedError } from "../services/auth-services";
import {
  getProfileByToken,
  registerUser,
  UserAlreadyExistsError,
} from "../services/users-services";
import { extractBearerToken } from "../utils/bearer-token";

const messageResponse = t.Object({ message: t.String() });

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
      detail: {
        tags: ["Users"],
        summary: "Register a new user",
        description:
          "Creates a new user. The password is stored as a bcrypt hash. Returns 409 if the email is already registered.",
      },
      response: {
        200: messageResponse,
        409: messageResponse,
      },
    },
  )
  .get(
    "/profile",
    async ({ headers, set }) => {
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
    },
    {
      detail: {
        tags: ["Users"],
        summary: "Get the profile of the logged-in user",
        description:
          "Returns the user that owns the session token. The password is never returned.",
        security: [{ bearerAuth: [] }],
      },
      response: {
        200: t.Object({
          data: t.Object({
            id: t.String(),
            name: t.String(),
            email: t.String(),
            createdAt: t.String(),
          }),
        }),
        401: messageResponse,
      },
    },
  );
