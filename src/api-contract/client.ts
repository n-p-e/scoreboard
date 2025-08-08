import { initClient } from "@ts-rest/core"
import { appApiContract } from "~/api-contract/contract"

const appApiClient = initClient(appApiContract, {
  baseUrl: "",
  baseHeaders: {},
  credentials: "include",
})

// No need to do this, tanstack patches fetch for us
// https://github.com/TanStack/router/blob/v1.130.16/packages/start-server-core/src/createStartHandler.ts#L80

// if (import.meta.env.SSR) {
//   appApiClient = (await import("./client-ssr")).serverApiClient
// }

export { appApiClient }
