import "~/server/server-only"

import { ExtractTablesWithRelations } from "drizzle-orm"
import { drizzle, NodePgQueryResultHKT } from "drizzle-orm/node-postgres"
import { PgTransaction } from "drizzle-orm/pg-core"
import { serverEnv } from "~/env.server"
import * as schema from "./schema"

export const db = drizzle({
  connection: {
    connectionString: serverEnv.databaseUrl,
  },
  schema,
})

export type Schema = typeof schema
export type Database = typeof db
/**
 * Type of db transaction with schema info
 * ```
 * db.transaction(async (tx) => {})
 * ```
 * type of tx: Transaction
 */
export type Transaction = PgTransaction<
  NodePgQueryResultHKT, // Replace with your driver's HKT (e.g., PostgresJsQueryResultHKT)
  Schema,
  ExtractTablesWithRelations<Schema>
>
