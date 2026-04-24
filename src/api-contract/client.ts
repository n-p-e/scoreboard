import { apiContract } from "~/api-contract/contract"
import { createClient, Fetcher } from "./contract-dsl"

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
})

export { appApiClient }
