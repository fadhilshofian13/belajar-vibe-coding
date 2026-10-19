import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export class UserAlreadyExistsError extends Error {
  constructor() {
    super("User already exists");
    this.name = "UserAlreadyExistsError";
  }
}

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

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
