import * as z from "zod/mini"

export const LeagueDataZ = z.object({
  leagueId: z.string(),
  displayName: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  status: z.nullish(z.string()),
})
export type LeagueData = z.infer<typeof LeagueDataZ>

export const LeaguePlayerGamesZ = z.object({
  playerName: z.string(),
  playerNameLower: z.string(),
  games: z.number(),
})
export type LeaguePlayerGames = z.infer<typeof LeaguePlayerGamesZ>

export const StatsPeriodZ = z.enum(["day", "week"])
export type StatsPeriod = z.infer<typeof StatsPeriodZ>

export const LeagueStatsItemZ = z.object({
  startDate: z.string(),
  endDate: z.string(),
  players: z.array(LeaguePlayerGamesZ),
})
export type LeagueStatsItem = z.infer<typeof LeagueStatsItemZ>

export const LeagueStatsZ = z.object({
  leagueId: z.string(),
  period: StatsPeriodZ,
  items: z.array(LeagueStatsItemZ),
})
export type LeagueStats = z.infer<typeof LeagueStatsZ>

export const PatchLeagueRequestZ = z.object({
  // undefined => no change
  enabled: z.optional(z.boolean()),
})
export type PatchLeagueRequest = z.infer<typeof PatchLeagueRequestZ>
