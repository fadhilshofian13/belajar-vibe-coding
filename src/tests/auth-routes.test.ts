import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanupTestData,
  countSessionsForEmail,
  DEFAULT_PASSWORD,
  findSessionByToken,
  findUserByEmail,
  loginUser,
  registerUser,
  request,
  uniqueEmail,
  UUID_PATTERN,
} from "./helpers";

afterEach(cleanupTestData);

const UNAUTHORIZED = { message: "Unauthorized" };
const INVALID_CREDENTIALS = { message: "Email or password is incorrect" };

describe("POST /api/v1/login", () => {
  describe("positive cases", () => {
    test("returns a uuid token for valid credentials", async () => {
      const { email } = await registerUser();

      const response = await request("POST", "/api/v1/login", {
        json: { email, password: DEFAULT_PASSWORD },
      });
      const body = (await response.json()) as { message: string; data: string };

      expect(response.status).toBe(200);
      expect(body.message).toBe("Login successful");
      expect(body.data).toMatch(UUID_PATTERN);
    });

    test("stores a session with the returned token and the user id", async () => {
      const { email } = await registerUser();
      const user = await findUserByEmail(email);

      const token = await loginUser(email);
      const session = await findSessionByToken(token);

      expect(session).toBeDefined();
      expect(session?.userId).toBe(user?.id);
      expect(await countSessionsForEmail(email)).toBe(1);
    });

    test("creates a new token and session on each login", async () => {
      const { email } = await registerUser();

      const firstToken = await loginUser(email);
      const secondToken = await loginUser(email);

      expect(firstToken).not.toBe(secondToken);
      expect(await countSessionsForEmail(email)).toBe(2);
    });

    test("does not create sessions for other users", async () => {
      const first = await registerUser();
      const second = await registerUser();

      await loginUser(first.email);

      expect(await countSessionsForEmail(first.email)).toBe(1);
      expect(await countSessionsForEmail(second.email)).toBe(0);
    });
  });

  describe("negative cases", () => {
    test("returns 401 for a wrong password", async () => {
      const { email } = await registerUser();

      const response = await request("POST", "/api/v1/login", {
        json: { email, password: "wrong-password" },
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(INVALID_CREDENTIALS);
      expect(await countSessionsForEmail(email)).toBe(0);
    });

    test("treats the password as case-sensitive", async () => {
      const { email } = await registerUser();

      const response = await request("POST", "/api/v1/login", {
        json: { email, password: DEFAULT_PASSWORD.toUpperCase() },
      });

      expect(response.status).toBe(401);
      expect(await countSessionsForEmail(email)).toBe(0);
    });

    test("returns the same response for an unknown email as for a wrong password", async () => {
      const { email } = await registerUser();

      const wrongPassword = await request("POST", "/api/v1/login", {
        json: { email, password: "wrong-password" },
      });
      const unknownEmail = await request("POST", "/api/v1/login", {
        json: { email: uniqueEmail(), password: DEFAULT_PASSWORD },
      });

      expect(unknownEmail.status).toBe(401);
      expect(unknownEmail.status).toBe(wrongPassword.status);
      expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
    });

    const invalidBodies: [string, Record<string, unknown>][] = [
      ["an invalid email", { email: "not-an-email" }],
      ["an empty password", { password: "" }],
      ["a missing email", { email: undefined }],
      ["a missing password", { password: undefined }],
    ];

    test.each(invalidBodies)("rejects %s with 422", async (_, fields) => {
      const { email } = await registerUser();

      const response = await request("POST", "/api/v1/login", {
        json: { email, password: DEFAULT_PASSWORD, ...fields },
      });

      expect(response.status).toBe(422);
      expect(await countSessionsForEmail(email)).toBe(0);
    });

    test("rejects an empty body", async () => {
      const response = await request("POST", "/api/v1/login", {
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });

    test("rejects a body that is not JSON", async () => {
      const response = await request("POST", "/api/v1/login", {
        headers: { "Content-Type": "application/json" },
        body: "not json",
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.status).toBeLessThan(500);
    });
  });
});

describe("DELETE /api/v1/logout", () => {
  describe("positive cases", () => {
    test("logs out with a valid token", async () => {
      const { email } = await registerUser();
      const token = await loginUser(email);

      const response = await request("DELETE", "/api/v1/logout", { token });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ message: "Logout successful" });
      expect(await findSessionByToken(token)).toBeUndefined();
    });

    test("keeps the other sessions of the same user", async () => {
      const { email } = await registerUser();
      const firstToken = await loginUser(email);
      const secondToken = await loginUser(email);

      await request("DELETE", "/api/v1/logout", { token: firstToken });

      expect(await findSessionByToken(secondToken)).toBeDefined();

      const profile = await request("GET", "/api/v1/users/profile", {
        token: secondToken,
      });
      expect(profile.status).toBe(200);
    });

    test("keeps the sessions of other users", async () => {
      const first = await registerUser();
      const second = await registerUser();
      const firstToken = await loginUser(first.email);
      const secondToken = await loginUser(second.email);

      await request("DELETE", "/api/v1/logout", { token: firstToken });

      expect(await findSessionByToken(secondToken)).toBeDefined();
    });

    test("invalidates the token for the profile endpoint", async () => {
      const { email } = await registerUser();
      const token = await loginUser(email);

      await request("DELETE", "/api/v1/logout", { token });
      const profile = await request("GET", "/api/v1/users/profile", { token });

      expect(profile.status).toBe(401);
    });

    test("allows logging in again after logout", async () => {
      const { email } = await registerUser();
      const oldToken = await loginUser(email);
      await request("DELETE", "/api/v1/logout", { token: oldToken });

      const newToken = await loginUser(email);
      const profile = await request("GET", "/api/v1/users/profile", {
        token: newToken,
      });

      expect(newToken).not.toBe(oldToken);
      expect(profile.status).toBe(200);
    });
  });

  describe("negative cases", () => {
    test("returns 401 when the same token logs out twice", async () => {
      const { email } = await registerUser();
      const token = await loginUser(email);

      await request("DELETE", "/api/v1/logout", { token });
      const response = await request("DELETE", "/api/v1/logout", { token });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(UNAUTHORIZED);
    });

    const invalidHeaders: [string, (token: string) => Record<string, string>][] =
      [
        ["a missing Authorization header", () => ({})],
        ["a token without the Bearer scheme", (token) => ({ Authorization: token })],
        ["Bearer without a token", () => ({ Authorization: "Bearer" })],
        ["an unknown token", () => ({ Authorization: `Bearer ${crypto.randomUUID()}` })],
      ];

    test.each(invalidHeaders)(
      "returns 401 for %s without deleting any session",
      async (_, buildHeaders) => {
        const { email } = await registerUser();
        const token = await loginUser(email);

        const response = await request("DELETE", "/api/v1/logout", {
          headers: buildHeaders(token),
        });

        expect(response.status).toBe(401);
        expect(await response.json()).toEqual(UNAUTHORIZED);
        expect(await findSessionByToken(token)).toBeDefined();
      },
    );
  });
});

describe("register, login, profile, and logout flow", () => {
  test("runs the full authentication flow end to end", async () => {
    const email = uniqueEmail();

    const register = await request("POST", "/api/v1/users", {
      json: { name: "Flow User", email, password: DEFAULT_PASSWORD },
    });
    expect(register.status).toBe(200);

    const token = await loginUser(email);

    const profile = await request("GET", "/api/v1/users/profile", { token });
    expect(profile.status).toBe(200);

    const logout = await request("DELETE", "/api/v1/logout", { token });
    expect(logout.status).toBe(200);

    const profileAfterLogout = await request("GET", "/api/v1/users/profile", {
      token,
    });
    expect(profileAfterLogout.status).toBe(401);
  });
});
