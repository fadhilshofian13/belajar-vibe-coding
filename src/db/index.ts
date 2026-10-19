import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getDbCredentials } from "./env";
import * as schema from "./schema";

const credentials = getDbCredentials();

const client = postgres({
  host: credentials.host,
  user: credentials.user,
  password: credentials.password,
  database: credentials.database,
  port: credentials.port,
});

export const db = drizzle(client, { schema });
export { client };
