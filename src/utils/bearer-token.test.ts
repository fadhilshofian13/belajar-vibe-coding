import { describe, expect, test } from "bun:test";
import { extractBearerToken } from "./bearer-token";

describe("extractBearerToken", () => {
  test("returns the token from a valid Bearer header", () => {
    expect(extractBearerToken("Bearer abc-123")).toBe("abc-123");
  });

  test("accepts the scheme case-insensitively", () => {
    expect(extractBearerToken("bearer abc-123")).toBe("abc-123");
  });

  test("returns null when the header is missing", () => {
    expect(extractBearerToken(undefined)).toBeNull();
  });

  test("returns null when the Bearer scheme is missing", () => {
    expect(extractBearerToken("abc-123")).toBeNull();
  });

  test("returns null when the token is missing", () => {
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
  });

  test("returns null for other schemes", () => {
    expect(extractBearerToken("Basic abc-123")).toBeNull();
  });

  test("returns null when the header contains extra parts", () => {
    expect(extractBearerToken("Bearer abc 123")).toBeNull();
  });
});
