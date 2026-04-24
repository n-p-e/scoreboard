import { Hono } from "hono"
import { leaguesHandler } from "~/league/leagues-handler"
import { riichiHandler } from "~/riichi/riichi-handler"
import { usersHandler } from "~/users/users-handler"
import { authMiddleware } from "./auth-middleware"
import { HonoEnv } from "./server-types"

const apiApp = new Hono<HonoEnv>()
  .use("*", authMiddleware)
  .get("/healthcheck", async (c) => c.json({ status: "success" }))
  .route("/", usersHandler)
  .route("/", leaguesHandler)
  .route("/", riichiHandler)

const backendApp = new Hono<HonoEnv>().route("/api", apiApp)

export { backendApp }
