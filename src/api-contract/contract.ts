import { initContract } from "@ts-rest/core"
import * as z from "zod/mini"
import {
  LeaderboardResultZ,
  StandingsItemZ,
  SubmitMatchResultRequestZ,
} from "~/riichi/riichi-schema"
import { AuthStatusResultZ, UserLoginZ } from "~/users/users-schema"
import { integerRange } from "~/utils/schema-util"

const c = initContract()

const usersContract = c.router({
  login: {
    method: "POST",
    path: "/login",
    body: UserLoginZ,
    responses: {
      200: z.object({
        token: z.string(),
      }),
    },
  },

  logout: {
    method: "POST",
    path: "/logout",
    body: z.unknown(),
    responses: {
      200: z.object({
        status: z.literal("success"),
      }),
    },
  },

  queryLoginStatus: {
    method: "GET",
    path: "/profile",
    responses: {
      200: z.object({
        data: AuthStatusResultZ,
      }),
    },
  },
})

const riichiContract = c.router({
  listMatches: {
    method: "GET",
    path: "/league/:league/match",
    query: z.object({
      matchId: z.optional(z.string()),
      limit: z.optional(z.coerce.number()),
    }),
    responses: {
      200: z.object({
        data: z.array(StandingsItemZ),
      }),
    },
  },

  updateMatch: {
    method: "PUT",
    path: "/league/:league/match/:match",
    body: z.object({
      data: StandingsItemZ,
    }),
    responses: {
      200: z.object({
        data: StandingsItemZ,
      }),
    },
  },

  listPlayers: {
    method: "GET",
    path: "/players",
    query: z.object({
      limit: z.optional(integerRange(0, 100)),
    }),
    responses: {
      200: z.object({
        data: z.object({
          players: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              lastActive: z.date(),
              createdAt: z.date(),
              updatedAt: z.date(),
            })
          ),
        }),
      }),
    },
  },

  listLeaderboard: {
    method: "GET",
    path: "/leaderboard/:leagueId",
    pathParams: z.object({
      leagueId: z.string(),
    }),
    query: z.object({
      limit: z.optional(integerRange(0, 100)),
    }),
    responses: {
      200: z.object({
        data: LeaderboardResultZ,
      }),
    },
  },

  submitStandings: {
    method: "POST",
    path: "/match-standing",
    body: SubmitMatchResultRequestZ,
    responses: {
      200: z.object({ status: z.literal("success") }),
    },
  },

  patchStandings: {
    method: "PATCH",
    path: "/league/:leagueId/match/:matchId",
    body: z.object({
      confirmed: z.boolean(),
    }),
    responses: {
      200: z.object({ status: z.literal("success") }),
    },
  },

  deleteStandings: {
    method: "DELETE",
    path: "/league/:leagueId/match/:matchId",
    responses: {
      200: z.object({ status: z.literal("success") }),
    },
  },
})

export const appApiContract = c.router(
  {
    users: usersContract,
    riichi: riichiContract,

    healthcheck: {
      method: "GET",
      path: "/healthcheck",
      responses: {
        200: z.object({ status: z.literal("success") }),
      },
    },
  },
  {
    pathPrefix: "/api",
  }
)
