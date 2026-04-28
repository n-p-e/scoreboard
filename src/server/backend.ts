import { getRequestIP } from "@tanstack/solid-start/server"
import { Hono } from "hono"
import { leaguesHandler } from "~/league/leagues-handler"
import { riichiHandler } from "~/riichi/riichi-handler"
import { usersHandler } from "~/users/users-handler"
import { authMiddleware } from "./auth-middleware"
import { backendErrorHandler, notFoundHandler } from "./error-handler"
import { HonoEnv } from "./server-types"

const apiApp = new Hono<HonoEnv>()
  .use("*", authMiddleware)
  .use("*", async (c, next) => {
    c.set("sourceIp", getRequestIP({ xForwardedFor: true }))
    await next()
  })
  .onError(backendErrorHandler)
  .notFound(notFoundHandler)
  .get("/healthcheck", async (c) =>
    c.json({ status: "success", clientIp: c.var.sourceIp })
  )
  .route("/", usersHandler)
  .route("/", leaguesHandler)
  .route("/", riichiHandler)

const backendApp = new Hono<HonoEnv>().route("/api", apiApp)

export { backendApp }
