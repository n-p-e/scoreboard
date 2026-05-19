import { createClient, Fetcher } from "@nptr/contract-dsl"

import { apiContract } from "~/api-contract/contract"
import { AppErrorInfo } from "~/error/app-error"
import { HttpStatusError } from "~/error/http-error"

const fetcher: Fetcher = import.meta.env.SSR
  ? async (input, init) => {
      const url = typeof input === "string" ? input : input.toString()
      const isFullUrl = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)

      if (isFullUrl) {
        return fetch(input, init)
      }

      const { ssrLocalFetch } = await import("./client-ssr")
      return ssrLocalFetch(input, init)
    }
  : fetch

const appApiClient = createClient({
  contract: apiContract,
  baseUrl: "/",
  fetcher,
  onError: async (response) => {
    let errorData: AppErrorInfo
    try {
      errorData = await response.json()
    } catch {
      errorData = {
        tag: "parse-error",
        message: response.statusText || "Unexpected response format",
      }
    }
    throw new HttpStatusError(
      response.status,
      String(errorData.message ?? "unknown error"),
      errorData
    )
  },
})

export { appApiClient }
