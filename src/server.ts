// src/server.ts
// This is the entry point for the SSR build
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/solid-start/server"
import { createApiHandler } from "~/server/api-handler"
import { createRouter } from "./router"

const apiHandler = createApiHandler()

export default createStartHandler({
  createRouter,
})(async (ctx) => {
  if (new URL(ctx.request.url).pathname.startsWith("/api/")) {
    return apiHandler({ request: ctx.request })
  }

  return defaultStreamHandler(ctx)
})
