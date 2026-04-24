import * as z from "zod/mini"
import { LeagueDataZ, LeagueStatsZ } from "~/league/league-schema"
import {
  LeaderboardResultZ,
  StandingsItemZ,
  SubmitMatchResultRequestZ,
} from "~/riichi/riichi-schema"
import {
  AuthStatusResultZ,
  ChangePasswordZ,
  UserLoginZ,
} from "~/users/users-schema"
import { integerRange } from "~/utils/schema-util"
import { createContract, endpoint } from "./contract-dsl"

// --- Users Contract ---
export const usersContract = createContract({ prefix: "" }).routes({
  login: endpoint.post("/login", {
    reqBody: UserLoginZ,
    resBody: z.object({ token: z.string() }),
  }),

  logout: endpoint.post("/logout", {
    reqBody: z.unknown(),
    resBody: z.object({ status: z.literal("success") }),
  }),

  queryLoginStatus: endpoint.get("/profile", {
    resBody: AuthStatusResultZ,
  }),

  changePassword: endpoint.post("/user/change-password", {
    reqBody: ChangePasswordZ,
    resBody: z.object(),
  }),
})

// --- Leagues Contract ---
export const leaguesContract = createContract({ prefix: "" }).routes({
  listLeagues: endpoint.get("/leagues", {
    resBody: z.object({ leagues: z.array(LeagueDataZ) }),
  }),
  dailySummary: endpoint.get("/leagues/:leagueId/stats", {
    pathParams: z.object({
      leagueId: z.string(),
    }),
    queryParams: z.object({
      period: z.optional(z.enum(["day", "week"])),
      timezone: z.optional(z.string()),
      start: z.optional(z.string()),
      end: z.optional(z.string()),
    }),
    resBody: LeagueStatsZ,
  }),
})

// --- Riichi Contract ---
export const riichiContract = createContract({ prefix: "" }).routes({
  listMatches: endpoint.get("/leagues/:league/match", {
    queryParams: z.object({
      matchId: z.optional(z.string()),
      limit: z.optional(integerRange(1, 1000)),
    }),
    pathParams: z.object({
      league: z.string(),
    }),
    resBody: z.object({ data: z.array(StandingsItemZ) }),
  }),

  updateMatch: endpoint.put("/leagues/:league/match/:match", {
    pathParams: z.object({
      league: z.string(),
      match: z.string(),
    }),
    reqBody: z.object({ data: StandingsItemZ }),
    resBody: z.object({ data: StandingsItemZ }),
  }),

  listPlayers: endpoint.get("/players", {
    queryParams: z.object({
      search: z.optional(z.string()),
      limit: z.optional(integerRange(0, 100)),
    }),
    resBody: z.object({
      data: z.object({
        players: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            lastActive: z.coerce.date(),
            createdAt: z.coerce.date(),
            updatedAt: z.coerce.date(),
          })
        ),
      }),
    }),
  }),

  listLeaderboard: endpoint.get("/leaderboard/:leagueId", {
    pathParams: z.object({
      leagueId: z.string(),
    }),
    resBody: z.object({ data: LeaderboardResultZ }),
  }),

  submitStandings: endpoint.post("/match-standing", {
    reqBody: SubmitMatchResultRequestZ,
    resBody: z.object({ status: z.literal("success") }),
  }),

  patchStandings: endpoint.patch("/leagues/:leagueId/match/:matchId", {
    pathParams: z.object({
      leagueId: z.string(),
      matchId: z.string(),
    }),
    reqBody: z.object({ confirmed: z.boolean() }),
    resBody: z.object({ status: z.literal("success") }),
  }),

  deleteStandings: endpoint.delete("/leagues/:leagueId/match/:matchId", {
    pathParams: z.object({
      leagueId: z.string(),
      matchId: z.string(),
    }),
    resBody: z.object({ status: z.literal("success") }),
  }),
})

// --- Master Contract ---
export const apiContract = createContract({ prefix: "/api" }).routes({
  users: usersContract,
  leagues: leaguesContract,
  riichi: riichiContract,

  healthcheck: endpoint.get("/healthcheck", {
    resBody: z.object({ status: z.literal("success") }),
  }),
})
