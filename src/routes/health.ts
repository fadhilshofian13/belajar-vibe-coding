import { Elysia } from "elysia";
import { sql } from "drizzle-orm";
import { db } from "../db";

export const healthRoutes = new Elysia().get("/health", async ({ set }) => {
  try {
    await db.execute(sql`SELECT 1`);

    return {
      status: "ok",
      database: "connected",
    };
  } catch {
    set.status = 503;

    return {
      status: "error",
      database: "disconnected",
    };
  }
});
