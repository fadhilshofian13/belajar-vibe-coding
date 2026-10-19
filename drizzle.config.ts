import { defineConfig } from "drizzle-kit";
import { getDbCredentials } from "./src/db/env";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: getDbCredentials(),
});
