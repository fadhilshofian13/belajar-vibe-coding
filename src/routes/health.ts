import { Elysia, t } from "elysia";
import { sql } from "drizzle-orm";
import { db } from "../db";

const healthResponse = t.Object({
  status: t.String(),
  database: t.String(),
});

export const healthRoutes = new Elysia().get(
  "/health",
  async ({ set }) => {
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
  },
  {
    detail: {
      tags: ["Health"],
      summary: "Check server and database status",
      description:
        "Returns 200 when the database is reachable, or 503 when it is not.",
    },
    response: {
      200: healthResponse,
      503: healthResponse,
    },
  },
);
