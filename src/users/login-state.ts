import { createResource } from "solid-js"
import { isServer } from "solid-js/web"
import { appApiClient } from "~/api-contract/client"
import type { AuthStatusResult } from "~/users/users-schema"

export const getLoginState = () => {
  return createResource(async (): Promise<AuthStatusResult> => {
    // TODO: handle server side state
    if (isServer) return { loggedIn: false }

    const res = await appApiClient.users.queryLoginStatus()
    if (res.status === 200) {
      return res.body.data
    }
    return { loggedIn: false }
  })
}
