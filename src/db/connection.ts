import "~/server/server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import { serverEnv } from "~/env.server"
import * as schema from "./schema"

export const db = drizzle({
  connection: {
    connectionString: serverEnv.databaseUrl,
  },
  schema,
})

type DrizzleTxCallback = Parameters<typeof db.transaction>[0]

/**
 * Type of db transaction with schema info
 * ```
 * db.transaction(async (tx) => {})
 * ```
 * type of tx: Transaction
 */
export type Transaction = Parameters<DrizzleTxCallback>[0]
