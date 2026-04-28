import * as z from "zod/mini"
import {
  StandingsItemZ,
  SubmitMatchResultRequestZ,
} from "~/riichi/riichi-schema"

export const SubmitMatchRecordZ = z.object({
  action: z.literal("createMatchRecord"),
  reportedMatch: SubmitMatchResultRequestZ.shape.data,
  standings: StandingsItemZ.shape.standings,
})
export type SubmitMatchRecord = z.infer<typeof SubmitMatchRecordZ>

export const EditMatchRecordZ = z.object({
  action: z.literal("updateMatchRecord"),
  before: StandingsItemZ,
  after: StandingsItemZ,
})

export const DeleteMatchRecordZ = z.object({
  action: z.literal("deleteMatchRecord"),
  before: StandingsItemZ,
})

export const HistoryRecordZ = z.union([
  SubmitMatchRecordZ,
  EditMatchRecordZ,
  DeleteMatchRecordZ,
])
export type HistoryRecord = z.infer<typeof HistoryRecordZ>
