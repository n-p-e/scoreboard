import "~/server/server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

export const db = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL!,
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
