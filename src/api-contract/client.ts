import { initClient } from "@ts-rest/core"
import { appApiContract } from "~/api-contract/contract"

let appApiClient = initClient(appApiContract, {
  baseUrl: "",
  baseHeaders: {},
  credentials: "include",
})

if (import.meta.env.SSR) {
  appApiClient = (await import("./client-ssr")).serverApiClient
}

export { appApiClient }
