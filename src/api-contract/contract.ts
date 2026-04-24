import * as z from "zod/mini"
import { LeagueDataZ } from "~/league/league-schema"
import {
  LeaderboardResultZ,
  StandingsItemZ,
  SubmitMatchResultRequestZ,
} from "~/riichi/riichi-schema"
import { AuthStatusResultZ, UserLoginZ } from "~/users/users-schema"
import { createContract, endpoint } from "./contract-dsl"

// --- Users Contract ---
export const usersContract = createContract({ prefix: "/auth" }).routes({
  login: endpoint.post("/login", {
    reqBody: UserLoginZ,
    resBody: z.object({ token: z.string() }),
  }),

  logout: endpoint.post("/logout", {
    reqBody: z.unknown(),
    resBody: z.object({ status: z.literal("success") }),
  }),

  queryLoginStatus: endpoint.get("/profile", {
    resBody: z.object({ data: AuthStatusResultZ }),
  }),
})

// --- Leagues Contract ---
export const leaguesContract = createContract({ prefix: "" }).routes({
  listLeagues: endpoint.get("/leagues", {
    resBody: z.object({ leagues: z.array(LeagueDataZ) }),
  }),
})

// --- Riichi Contract ---
export const riichiContract = createContract({ prefix: "/riichi" }).routes({
  listMatches: endpoint.get("/leagues/:league/match", {
    // Note: If your system needs query params, you can wrap them in reqBody
    resBody: z.object({ data: z.array(StandingsItemZ) }),
  }),

  updateMatch: endpoint.put("/leagues/:league/match/:match", {
    reqBody: z.object({ data: StandingsItemZ }),
    resBody: z.object({ data: StandingsItemZ }),
  }),

  listPlayers: endpoint.get("/players", {
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
    resBody: z.object({ data: LeaderboardResultZ }),
  }),

  submitStandings: endpoint.post("/match-standing", {
    reqBody: SubmitMatchResultRequestZ,
    resBody: z.object({ status: z.literal("success") }),
  }),

  patchStandings: endpoint.patch("/leagues/:leagueId/match/:matchId", {
    reqBody: z.object({ confirmed: z.boolean() }),
    resBody: z.object({ status: z.literal("success") }),
  }),

  deleteStandings: endpoint.delete("/leagues/:leagueId/match/:matchId", {
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
