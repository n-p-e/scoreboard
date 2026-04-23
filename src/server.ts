// src/server.ts
import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback,
} from "@tanstack/solid-start/server"
import { createServerEntry } from "@tanstack/solid-start/server-entry"
import { createApiHandler } from "./server/api-handler"

const apiHandler = createApiHandler()
const customHandler = defineHandlerCallback((ctx) => {
  // add custom logic here
  if (new URL(ctx.request.url).pathname.startsWith("/api/")) {
    return apiHandler({ request: ctx.request })
  }
  return defaultStreamHandler(ctx)
})

const fetch = createStartHandler(customHandler)

export default createServerEntry({
  fetch,
})
