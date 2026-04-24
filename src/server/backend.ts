import { Hono } from "hono"
import { leaguesHandler } from "~/league/leagues-handler"
import { riichiHandler } from "~/riichi/riichi-handler"
import { usersHandler } from "~/users/users-handler"
import { authMiddleware } from "./auth-middleware"
import { HonoEnv } from "./server-types"

const backendApp = new Hono<HonoEnv>()
  .use(authMiddleware)
  .route("/", usersHandler)
  .route("/", leaguesHandler)
  .route("/", riichiHandler)

export { backendApp }
