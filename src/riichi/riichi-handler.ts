import { tsr } from "@ts-rest/serverless/fetch"
import { appApiContract } from "~/api-contract/contract"
import {
  deleteStanding,
  listMatches,
  listPlayers,
  patchStanding,
  queryLeaderboard,
  submitRiichi,
  updateMatch,
} from "~/riichi/riichi-store"
import { AppPlatformContext } from "~/server/server-types"

export const riichiRouter = tsr
  .platformContext<AppPlatformContext>()
  .router(appApiContract.riichi, {
    listMatches: async ({ params, query }) => {
      return {
        status: 200,
        body: {
          data: await listMatches({
            leagueId: params.league,
            matchId: query.matchId,
            limit: query.limit,
          }),
        },
      }
    },

    updateMatch: async ({ params, body }) => {
      return {
        status: 200,
        body: {
          data: await updateMatch({
            ...body.data,
            ...params,
          }),
        },
      }
    },

    listPlayers: async () => {
      return {
        status: 200,
        body: {
          data: {
            players: await listPlayers({}),
          },
        },
      }
    },
    listLeaderboard: async ({ params: { leagueId }, query: { limit } }) => {
      return {
        status: 200,
        body: {
          data: await queryLeaderboard({ leagueId, limit: Number(limit) }),
        },
      }
    },
    submitStandings: async ({ body }) => {
      return {
        status: 200,
        body: {
          status: "success",
          data: await submitRiichi(body.data),
        },
      }
    },
    patchStandings: async ({ params, body }, c) => {
      await patchStanding({
        ...params,
        patchArgs: body,
        auth: c.authStatus,
      })

      return {
        status: 200,
        body: {
          status: "success",
        },
      }
    },
    deleteStandings: async ({ params }, c) => {
      await deleteStanding({ ...params, user: c.authStatus })
      return {
        status: 200,
        body: {
          status: "success",
        },
      }
    },
  })
