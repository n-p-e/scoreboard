import { Hono } from "hono"
import { listLeagues } from "~/league/league-store"
import { requiresAdminPrivilege } from "~/server/auth-middleware"
import { HonoEnv } from "~/server/server-types"

export const leaguesHandler = new Hono<HonoEnv>().get(
  "/leagues",
  requiresAdminPrivilege,
  async (c) => {
    c.json({
      leagues: await listLeagues({}),
    })
  }
)
