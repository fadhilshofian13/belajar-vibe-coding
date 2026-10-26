import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email or password is incorrect");
    this.name = "InvalidCredentialsError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type LoginInput = {
  email: string;
  password: string;
};

export async function login(input: LoginInput): Promise<string> {
  const user = await db.query.users.findFirst({
    columns: { id: true, password: true },
    where: eq(users.email, input.email),
  });

  if (!user) {
    throw new InvalidCredentialsError();
  }

  const isPasswordValid = await Bun.password.verify(
    input.password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const token = crypto.randomUUID();

  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return token;
}

export async function logout(token: string): Promise<void> {
  const deleted = await db
    .delete(sessions)
    .where(eq(sessions.token, token))
    .returning({ id: sessions.id });

  if (deleted.length === 0) {
    throw new UnauthorizedError();
  }
}
