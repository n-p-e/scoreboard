import "~/server/server-only"

import { initClient } from "@ts-rest/core"
import { appApiContract } from "~/api-contract/contract"
import { serverEnv } from "~/env.server"

// Route the api requests to itself
export const serverApiClient = initClient(appApiContract, {
  baseUrl: serverEnv.apiBaseUrl.replace(/\/api\/?$/, ""),
})
