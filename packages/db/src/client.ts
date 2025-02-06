import { getDbUrl } from "./functions";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export const queryClient = postgres(getDbUrl() as string, {
  max: 20,
  idle_timeout: 20,
  ssl: process.env.NODE_ENV === "production" ? "require" : undefined,
});

export const db = drizzle(queryClient, { schema, casing: "snake_case" });
export { schema };
