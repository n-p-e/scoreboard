import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import * as z from "zod/mini"
import { listLeagues, queryLeagueStats } from "~/league/league-store"
import { requiresAdminPrivilege } from "~/server/auth-middleware"
import { HonoEnv } from "~/server/server-types"

export const leaguesHandler = new Hono<HonoEnv>()
  .get("/leagues", requiresAdminPrivilege, async (c) => {
    return c.json({
      leagues: await listLeagues({}),
    })
  })
  .get(
    "/leagues/:leagueId/stats",
    // requiresAdminPrivilege,
    zValidator(
      "param",
      z.object({
        leagueId: z.string(),
      })
    ),
    zValidator(
      "query",
      z.object({
        period: z.optional(z.enum(["day", "week"])),
        timezone: z.optional(z.string()),
        start: z.optional(z.string()),
        end: z.optional(z.string()),
      })
    ),
    async (c) => {
      const { period, timezone, start, end } = c.req.valid("query")

      return c.json(
        await queryLeagueStats({
          ...c.req.valid("param"),
          period: period ?? "week",
          timezone,
          start,
          end,
        })
      )
    }
  )
