import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { UnauthorizedError } from "./auth-services";

export class UserAlreadyExistsError extends Error {
  constructor() {
    super("User already exists");
    this.name = "UserAlreadyExistsError";
  }
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Registers a new user.
 * Rejects an email that is already registered, hashes the password with
 * bcrypt, and stores the user in the database.
 *
 * @throws {UserAlreadyExistsError} if the email is already registered.
 */
export async function registerUser(input: RegisterUserInput): Promise<void> {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existing) {
    throw new UserAlreadyExistsError();
  }

  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  try {
    await db.insert(users).values({
      name: input.name,
      email: input.email,
      password: hashedPassword,
    });
  } catch (error) {
    // Handles race condition: unique violation (Postgres code 23505)
    if (isUniqueViolation(error)) {
      throw new UserAlreadyExistsError();
    }
    throw error;
  }
}

/**
 * Gets the profile of the user who owns the given session token.
 * Looks up the session by token, then the user of that session. Only safe
 * fields are returned (the password hash is never included).
 *
 * @throws {UnauthorizedError} if the token has no session or the user no longer exists.
 */
export async function getProfileByToken(token: string): Promise<UserProfile> {
  const session = await db.query.sessions.findFirst({
    columns: { userId: true },
    where: eq(sessions.token, token),
  });

  if (!session) {
    throw new UnauthorizedError();
  }

  const user = await db.query.users.findFirst({
    columns: { id: true, name: true, email: true, createdAt: true },
    where: eq(users.id, session.userId),
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

/**
 * Checks whether an error is a PostgreSQL unique constraint violation
 * (error code 23505). Used to turn a duplicate-email insert error into
 * a `UserAlreadyExistsError`.
 */
function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
