import * as z from "zod/mini"

export type PlayerRawScore = {
  name: string
  points: number | null
  adjustedFinalScore?: number | null
}

export type FinalScore = {
  name: string
  points: number | null
  rank: number
  umaPoints: number
  finalScore: number
}

export type MatchResultSubmission = {
  leagueId: string
  matchResult: PlayerRawScore[]
}

export const StandingsItemZ = z.object({
  matchId: z.string(),
  leagueId: z.string(),
  standings: z.array(
    z.object({
      name: z.string(),
      points: z.nullable(z.number()),
      rank: z.number(),
      umaPoints: z.number(),
      finalScore: z.number(),
    })
  ),
  confirmed: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type StandingsItem = z.infer<typeof StandingsItemZ>

export type PlayerData = {
  id: string
  name: string
  lastActive: Date
  createdAt: Date
  updatedAt: Date
}

export const LeaderboardItemZ = z.object({
  playerName: z.string(),
  playerNameLower: z.string(),
  standing: z.number(),
  averagePoints: z.number(),
  averageRank: z.number(),
  numGames: z.number(),
})
export type LeaderboardItem = z.infer<typeof LeaderboardItemZ>

export const LeaderboardResultZ = z.object({
  leagueId: z.string(),
  leaderboard: z.array(LeaderboardItemZ),
})
export type LeaderboardResult = z.infer<typeof LeaderboardResultZ>

export const SubmitMatchResultRequestZ = z.object({
  data: z.object({
    leagueId: z.string().check(z.minLength(1)),
    matchResult: z.array(
      z.object({
        name: z.string().check(z.minLength(1, "Player name is empty")),
        points: z.number(),
        adjustedFinalScore: z.union([z.number(), z.undefined(), z.null()]),
      })
    ),
  }),
})
export type SubmitMatchResultRequest = z.infer<typeof SubmitMatchResultRequestZ>
