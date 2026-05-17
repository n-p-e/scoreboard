import { createMiddleware } from "hono/factory"

import { AuthStatus } from "~/users/users-schema"
import { getRequestAuthStatus } from "~/users/users-store"

export const authMiddleware = createMiddleware<{
  Variables: {
    auth: AuthStatus
  }
}>(async (c, next) => {
  c.set("auth", await getRequestAuthStatus(c.req.raw))
  await next()
})

export const requiresAdminPrivilege = createMiddleware<{
  Variables: {
    auth: AuthStatus
  }
}>(async (c, next) => {
  if (!c.var.auth.loggedIn || !c.var.auth.roles.includes("admin")) {
    c.status(403)
    return c.json({
      status: "FORBIDDEN",
      message: "This operation is not allowed",
    })
  }

  await next()
})
