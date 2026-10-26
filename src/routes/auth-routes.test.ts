import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { client, db } from "../db";
import { sessions, users } from "../db/schema";
import { authRoutes } from "./auth-routes";
import { usersRoutes } from "./users-routes";

const app = new Elysia().use(usersRoutes).use(authRoutes);

const email = `logout-test-${crypto.randomUUID()}@example.com`;
const password = "password";

function request(method: string, path: string, init: RequestInit = {}) {
  return app.handle(
    new Request(`http://localhost${path}`, { method, ...init }),
  );
}

function withToken(token: string): RequestInit {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function loginToken(): Promise<string> {
  const response = await request("POST", "/api/v1/login", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = (await response.json()) as { data: string };

  return body.data;
}

async function sessionExists(token: string): Promise<boolean> {
  const session = await db.query.sessions.findFirst({
    columns: { id: true },
    where: eq(sessions.token, token),
  });

  return session !== undefined;
}

beforeAll(async () => {
  const response = await request("POST", "/api/v1/users", {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Logout Test", email, password }),
  });

  expect(response.status).toBe(200);
});

afterAll(async () => {
  await db.delete(users).where(eq(users.email, email));
  await client.end();
});

describe("DELETE /api/v1/logout", () => {
  test("deletes only the session of the given token", async () => {
    const first = await loginToken();
    const second = await loginToken();

    const response = await request("DELETE", "/api/v1/logout", withToken(first));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Logout successful" });
    expect(await sessionExists(first)).toBe(false);
    expect(await sessionExists(second)).toBe(true);

    const oldProfile = await request(
      "GET",
      "/api/v1/users/profile",
      withToken(first),
    );
    expect(oldProfile.status).toBe(401);

    const otherProfile = await request(
      "GET",
      "/api/v1/users/profile",
      withToken(second),
    );
    expect(otherProfile.status).toBe(200);
  });

  test("returns 401 when the same token logs out twice", async () => {
    const token = await loginToken();

    await request("DELETE", "/api/v1/logout", withToken(token));
    const response = await request("DELETE", "/api/v1/logout", withToken(token));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized" });
  });

  test.each([
    ["missing header", {}],
    ["unknown token", withToken(crypto.randomUUID())],
    ["missing Bearer scheme", { headers: { Authorization: "abc-123" } }],
    ["missing token", { headers: { Authorization: "Bearer" } }],
  ] as const)("returns 401 for %s", async (_, init) => {
    const response = await request("DELETE", "/api/v1/logout", init);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized" });
  });
});
