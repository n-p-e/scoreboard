import "~/server/server-only"

import { getWebRequest } from "@tanstack/solid-start/server"
import { initClient, tsRestFetchApi } from "@ts-rest/core"
import { appApiContract } from "~/api-contract/contract"

// Route the api requests to local
// tanstack patches fetch for urls starting with "/"
// https://github.com/TanStack/router/blob/v1.130.16/packages/start-server-core/src/createStartHandler.ts#L80
export const serverApiClient = initClient(appApiContract, {
  // baseUrl: serverEnv.apiBaseUrl.replace(/\/api\/?$/, ""),
  baseUrl: "",
  validateResponse: true,
  api: async (req) => {
    // copy headers from server request context to preserve auth status
    const originalHeaders = getWebRequest().headers
    // console.log({ originalHeaders })
    const headers = { ...req.headers }
    if (originalHeaders?.get("authorization")) {
      headers.authorization = originalHeaders.get("authorization")!
    }
    if (originalHeaders?.get("cookie")) {
      headers.cookie = originalHeaders.get("cookie")!
    }

    return await tsRestFetchApi({
      ...req,
      headers,
    })
  },
})
