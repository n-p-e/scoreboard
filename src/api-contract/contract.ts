import { initContract } from "@ts-rest/core"
import * as z from "zod/mini"
import { LeagueDataZ } from "~/league/league-schema"
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

const leaguesContract = c.router({
  listLeagues: {
    method: "GET",
    path: "/leagues",
    responses: {
      200: z.object({
        leagues: z.array(LeagueDataZ),
      }),
    },
  },
})

const riichiContract = c.router({
  listMatches: {
    method: "GET",
    path: "/leagues/:league/match",
    query: z.object({
      matchId: z.optional(z.string()),
      limit: z.optional(integerRange(1, 1000)),
    }),
    responses: {
      200: z.object({
        data: z.array(StandingsItemZ),
      }),
    },
  },

  updateMatch: {
    method: "PUT",
    path: "/leagues/:league/match/:match",
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
      search: z.optional(z.string()),
      limit: z.optional(integerRange(0, 100)),
    }),
    responses: {
      200: z.object({
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
    },
  },

  listLeaderboard: {
    method: "GET",
    path: "/leaderboard/:leagueId",
    pathParams: z.object({
      leagueId: z.string(),
    }),
    query: z.object({
      limit: z.optional(integerRange(0, 200)),
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
    path: "/leagues/:leagueId/match/:matchId",
    body: z.object({
      confirmed: z.boolean(),
    }),
    responses: {
      200: z.object({ status: z.literal("success") }),
    },
  },

  deleteStandings: {
    method: "DELETE",
    path: "/leagues/:leagueId/match/:matchId",
    responses: {
      200: z.object({ status: z.literal("success") }),
    },
  },
})

export const appApiContract = c.router(
  {
    users: usersContract,
    leagues: leaguesContract,
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
    commonResponses: {
      400: z.object({
        tag: z.string(),
        message: z.string(),
        info: z.object({}),
      }),
    },
  }
)
