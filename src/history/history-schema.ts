import * as z from "zod/mini"
import {
  StandingsItemZ,
  SubmitMatchResultRequestZ,
} from "~/riichi/riichi-schema"

export const SubmitMatchRecordZ = z.object({
  action: z.literal("createMatchRecord"),
  reportedMatch: SubmitMatchResultRequestZ.shape.data,
  standingsItem: StandingsItemZ,
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

export const ConfirmMatchRecordZ = z.object({
  action: z.literal("setMatchRecordConfirm"),
  confirmation: z.boolean(),
})

export const HistoryRecordZ = z.union([
  SubmitMatchRecordZ,
  EditMatchRecordZ,
  DeleteMatchRecordZ,
  ConfirmMatchRecordZ,
])
export type HistoryRecord = z.infer<typeof HistoryRecordZ>
