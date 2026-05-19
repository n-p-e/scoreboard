/** biome-ignore-all lint/suspicious/noExplicitAny: generic wrapper */
import { PgTransaction } from "drizzle-orm/pg-core"

import { Database, db, Transaction } from "./connection"

type DB = Database
type TX = Transaction

export function createTransactionHelper(db: DB) {
  return <TArgs extends any[], TRet>(
    callback: (tx: TX, ...args: TArgs) => Promise<TRet>
  ) => {
    async function wrapped(tx: TX, ...args: TArgs): Promise<TRet>
    async function wrapped(...args: TArgs): Promise<TRet>
    async function wrapped(...args: any[]): Promise<TRet> {
      // Check if the first argument is a Drizzle transaction object
      // We check for the presence of the 'transaction' method or internal markers
      const isTx = args[0] && args[0] instanceof PgTransaction

      if (isTx) {
        const [tx, ...rest] = args
        return callback(tx as TX, ...(rest as TArgs))
      }

      // No transaction provided, create a new one
      return await db.transaction(async (newTx) => {
        return callback(newTx as TX, ...(args as TArgs))
      })
    }

    return wrapped
  }
}

export const withTxn = createTransactionHelper(db)
