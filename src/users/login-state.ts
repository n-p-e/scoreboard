import { createServerFn } from "@tanstack/solid-start"
import { getWebRequest } from "@tanstack/solid-start/server"
import { createResource } from "solid-js"
import { isServer } from "solid-js/web"
import { appApiClient } from "~/api-contract/client"
import type { AuthStatusResult } from "~/users/users-schema"
import { getRequestAuthStatus } from "~/users/users-store"

const loginState = createServerFn().handler(async () => {
  const request = getWebRequest()
  return await getRequestAuthStatus(request)
})

export const queryLoginState = () => {
  return createResource(async (): Promise<AuthStatusResult> => {
    // TODO: handle server side state
    if (isServer) return await loginState()

    const res = await appApiClient.users.queryLoginStatus()
    if (res.status === 200) {
      return res.body.data
    }
    return { loggedIn: false }
  })
}
