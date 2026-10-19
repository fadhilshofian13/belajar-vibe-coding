import { Elysia, t } from "elysia";
import {
  registerUser,
  UserAlreadyExistsError,
} from "../services/users-services";

export const usersRoutes = new Elysia({ prefix: "/api/v1/users" }).post(
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
);
