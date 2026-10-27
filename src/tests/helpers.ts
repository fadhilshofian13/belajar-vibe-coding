import { eq, inArray } from "drizzle-orm";
import { Elysia } from "elysia";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { authRoutes } from "../routes/auth-routes";
import { healthRoutes } from "../routes/health";
import { usersRoutes } from "../routes/users-routes";

export const app = new Elysia()
  .use(healthRoutes)
  .use(usersRoutes)
  .use(authRoutes);

export const DEFAULT_PASSWORD = "password";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createdEmails = new Set<string>();

export function uniqueEmail(): string {
  const email = `test-${crypto.randomUUID()}@example.com`;
  createdEmails.add(email);

  return email;
}

export async function cleanupTestData(): Promise<void> {
  if (createdEmails.size === 0) {
    return;
  }

  await db.delete(users).where(inArray(users.email, [...createdEmails]));
  createdEmails.clear();
}

type RequestOptions = {
  token?: string;
  headers?: Record<string, string>;
  json?: unknown;
  body?: string;
};

export function request(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers };

  if (options.token !== undefined) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body = options.body;

  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  return app.handle(
    new Request(`http://localhost${path}`, { method, headers, body }),
  );
}

export async function registerUser(
  overrides: { name?: string; email?: string; password?: string } = {},
) {
  const user = {
    name: overrides.name ?? "Test User",
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? DEFAULT_PASSWORD,
  };

  const response = await request("POST", "/api/v1/users", { json: user });

  if (response.status !== 200) {
    throw new Error(`Failed to register test user: ${response.status}`);
  }

  return user;
}

export async function loginUser(
  email: string,
  password: string = DEFAULT_PASSWORD,
): Promise<string> {
  const response = await request("POST", "/api/v1/login", {
    json: { email, password },
  });

  if (response.status !== 200) {
    throw new Error(`Failed to log in test user: ${response.status}`);
  }

  const body = (await response.json()) as { data: string };

  return body.data;
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function countUsersByEmail(email: string): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));

  return rows.length;
}

export async function countAllUsers(): Promise<number> {
  return db.$count(users);
}

export async function findSessionByToken(token: string) {
  return db.query.sessions.findFirst({ where: eq(sessions.token, token) });
}

export async function countSessionsForEmail(email: string): Promise<number> {
  const user = await findUserByEmail(email);

  if (!user) {
    return 0;
  }

  return db.$count(sessions, eq(sessions.userId, user.id));
}
