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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
