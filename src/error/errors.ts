import { HttpStatusError } from "~/error/http-error"

export function permissionDenied() {
  throw new HttpStatusError(
    400,
    "You do not have permission for this operation",
    {
      tag: "error_permission_denied",
    }
  )
}
