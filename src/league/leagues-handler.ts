import { Hono } from "hono"
import * as z from "zod/mini"
import { apiContract } from "~/api-contract/contract"
import {
  listLeagues,
  patchLeague,
  queryLeagueStats,
} from "~/league/league-store"
import { requiresAdminPrivilege } from "~/server/auth-middleware"
import { HonoEnv } from "~/server/server-types"
import {
  jsonValidator,
  paramValidator,
  queryValidator,
} from "~/server/validator"
import { PatchLeagueRequestZ } from "./league-schema"

const contractDef = apiContract.definitions.leagues.definitions

export const leaguesHandler = new Hono<HonoEnv>()
  .get("/leagues", requiresAdminPrivilege, async (c) => {
    return c.json({
      leagues: await listLeagues({}),
    })
  })
  .get(
    "/leagues/:league/stats",
    // requiresAdminPrivilege,
    paramValidator(
      contractDef.leagueStats.pathParams
    ),
    queryValidator(
      contractDef.leagueStats.queryParams
    ),
    async (c) => {
      const { league } = c.req.valid("param")
      const { period, timezone, start, end } = c.req.valid("query")

      return c.json(
        await queryLeagueStats({
          leagueId: league,
          period: period ?? "week",
          timezone,
          start,
          end,
        })
      )
    }
  )
  .patch(
    "/leagues/:league",
    requiresAdminPrivilege,
    paramValidator(
      z.object({
        league: z.string(),
      })
    ),
    jsonValidator(PatchLeagueRequestZ),
    async (c) => {
      const { league } = c.req.valid("param")
      const patch = c.req.valid("json")
      const result = await patchLeague({
        auth: c.var.auth,
        leagueId: league,
        patch,
      })
      return c.json({ result })
    }
  )
