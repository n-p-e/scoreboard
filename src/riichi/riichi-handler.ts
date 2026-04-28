import { Hono } from "hono"
import * as z from "zod/mini"
import {
  deleteStanding,
  listMatches,
  listPlayers,
  patchStanding,
  queryLeaderboard,
  submitRiichi,
  updateMatch,
} from "~/riichi/riichi-store"
import { requiresAdminPrivilege } from "~/server/auth-middleware"
import { HonoEnv } from "~/server/server-types"
import {
  jsonValidator,
  paramValidator,
  queryValidator,
} from "~/server/validator"
import { integerRange } from "~/utils/schema-util"
import { StandingsItemZ, SubmitMatchResultRequestZ } from "./riichi-schema"
import { checkAuth } from "~/users/auth"

const listMatchesQuerySchema = z.object({
  matchId: z.optional(z.string()),
  limit: z.optional(integerRange(1, 1000)),
})

const updateMatchBodySchema = z.object({
  data: StandingsItemZ,
})

const listPlayersQuerySchema = z.object({
  search: z.optional(z.string()),
  limit: z.optional(integerRange(0, 100)),
})

const listLeaderboardParamsSchema = z.object({
  leagueId: z.string(),
})

const listLeaderboardQuerySchema = z.object({
  limit: z.optional(integerRange(0, 200)),
})

const patchStandingsBodySchema = z.object({
  confirmed: z.boolean(),
})

export const riichiHandler = new Hono<HonoEnv>()
  .get(
    "/leagues/:league/match",
    queryValidator(listMatchesQuerySchema),
    async (c) => {
      const query = c.req.valid("query")
      return c.json({
        data: await listMatches({
          leagueId: c.req.param("league"),
          matchId: query.matchId,
          limit: query.limit,
        }),
      })
    }
  )
  .put(
    "/leagues/:league/match/:match",
    requiresAdminPrivilege,
    jsonValidator(updateMatchBodySchema),
    async (c) => {
      const body = c.req.valid("json")
      return c.json({
        data: await updateMatch({
          ...body.data,
          leagueId: c.req.param("league"),
          matchId: c.req.param("match"),
          auth: c.var.auth,
        }),
      })
    }
  )
  .get("/players", queryValidator(listPlayersQuerySchema), async (c) => {
    const query = c.req.valid("query")
    return c.json({
      data: {
        players: await listPlayers({
          nameSearch: query.search,
          limit: query.limit,
        }),
      },
    })
  })
  .get(
    "/leaderboard/:leagueId",
    paramValidator(listLeaderboardParamsSchema),
    queryValidator(listLeaderboardQuerySchema),
    async (c) => {
      const params = c.req.valid("param")
      const query = c.req.valid("query")
      return c.json({
        data: await queryLeaderboard({
          leagueId: params.leagueId,
          limit: Number(query.limit),
        }),
      })
    }
  )
  .post(
    "/match-standing",
    jsonValidator(SubmitMatchResultRequestZ),
    async (c) => {
      const body = c.req.valid("json")
      await submitRiichi(body.data)
      return c.json({
        status: "success",
      })
    }
  )
  .patch(
    "/leagues/:leagueId/match/:matchId",
    jsonValidator(patchStandingsBodySchema),
    async (c) => {
      await patchStanding({
        ...c.req.param(),
        patchArgs: c.req.valid("json"),
        auth: checkAuth(c.var.auth),
      })

      return c.json({
        status: "success",
      })
    }
  )
  .delete("/leagues/:leagueId/match/:matchId", async (c) => {
    await deleteStanding({
      ...c.req.param(),
      auth: checkAuth(c.var.auth),
    })

    return c.json({
      status: "success",
    })
  })
