import * as z from "zod/mini"
import { PatchLeagueRequestZ } from "~/league/league-schema"
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
export type EditMatchRecord = z.infer<typeof EditMatchRecordZ>

export const DeleteMatchRecordZ = z.object({
  action: z.literal("deleteMatchRecord"),
  before: StandingsItemZ,
})
export type DeleteMatchRecord = z.infer<typeof DeleteMatchRecordZ>

export const UpdateLeagueHistoryZ = z.object({
  action: z.literal("updateLeague"),
  patch: PatchLeagueRequestZ,
})
export type UpdateLeagueHistory = z.infer<typeof UpdateLeagueHistoryZ>

export const HistoryRecordZ = z.union([
  SubmitMatchRecordZ,
  EditMatchRecordZ,
  DeleteMatchRecordZ,
  UpdateLeagueHistoryZ,
])
export type HistoryRecord = z.infer<typeof HistoryRecordZ>
