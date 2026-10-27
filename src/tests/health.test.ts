import { describe, expect, spyOn, test } from "bun:test";
import { db } from "../db";
import { request } from "./helpers";

describe("GET /health", () => {
  test("returns ok when the database is reachable", async () => {
    const response = await request("GET", "/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      database: "connected",
    });
  });

  test("returns 503 when the database is unreachable", async () => {
    const execute = spyOn(db, "execute").mockRejectedValueOnce(
      new Error("database is down"),
    );

    try {
      const response = await request("GET", "/health");

      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({
        status: "error",
        database: "disconnected",
      });
    } finally {
      execute.mockRestore();
    }
  });

  test("does not serve other methods", async () => {
    const response = await request("POST", "/health");

    expect(response.status).toBe(404);
  });
});
