import { permissionDenied } from "~/error/errors"
import type { AuthStatusResult } from "~/users/users-schema"

export function checkAuth(authStatus: AuthStatusResult) {
  if (!authStatus.loggedIn) {
    permissionDenied()
  }
  return authStatus
}

export function checkAdminRole(authStatus: AuthStatusResult) {
  if (!authStatus.loggedIn || !authStatus.roles.includes("admin")) {
    permissionDenied()
  }
  return authStatus
}
