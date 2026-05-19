import { createIsomorphicFn } from "@tanstack/solid-start"
import { getRequest } from "@tanstack/solid-start/server"
import { CookieMap } from "bun"

export const cookieName = "user-timezone-pref"

export const timezonePref = createIsomorphicFn()
  .client(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return timezone
  })
  .server(() => {
    const cookies = new CookieMap(getRequest().headers.get("cookie") || "")
    const res = cookies.get(cookieName)
    return res || null
  })
