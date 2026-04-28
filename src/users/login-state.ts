import { createIsomorphicFn } from "@tanstack/solid-start"
import { getRequest } from "@tanstack/solid-start/server"
import { createResource } from "solid-js"
import { appApiClient } from "~/api-contract/client"
import type { AuthStatus } from "~/users/users-schema"
import { getRequestAuthStatus } from "./users-store"

export const fetchLoginState = createIsomorphicFn()
  .client(async (): Promise<AuthStatus> => {
    const res = await appApiClient.users.queryLoginStatus()
    if (res.status === 200) {
      return res.body
    }
    return { loggedIn: false }
  })
  .server(async () => {
    const request = getRequest()
    return await getRequestAuthStatus(request)
  })

export const queryLoginState = () => {
  return createResource(fetchLoginState)
}
