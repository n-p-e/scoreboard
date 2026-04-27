import { Transaction } from "~/db/connection"
import { historyTable } from "~/db/schema"
import { uuidCompactToNormal } from "~/utils/schema-util"
import { HistoryRecord } from "./history-schema"

export async function recordHistoryItem(
  tx: Transaction,
  {
    sourceUser,
    record,
  }: {
    sourceUser: string
    record: HistoryRecord
  }
) {
  await tx.insert(historyTable).values({
    source_user: uuidCompactToNormal(sourceUser),
    action: record.action,
    data: record,
  })
}
