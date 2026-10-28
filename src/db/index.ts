import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { attachDatabasePool } from "@vercel/functions";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url && process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is required.");
const pool = url ? new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 20_000, connectionTimeoutMillis: 10_000 }) : null;
if (pool) attachDatabasePool(pool);

export const db = pool ? drizzle(pool, { schema }) : null;
