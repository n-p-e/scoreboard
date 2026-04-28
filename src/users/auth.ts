import { permissionDenied } from "~/error/errors"
import type { AuthStatus } from "~/users/users-schema"

export function checkAuth(authStatus?: AuthStatus) {
  if (!authStatus?.loggedIn) {
    permissionDenied()
  }
  return authStatus
}

export function checkAdminRole(authStatus?: AuthStatus) {
  if (!authStatus?.loggedIn || !authStatus.roles.includes("admin")) {
    permissionDenied()
  }
  return authStatus
}
