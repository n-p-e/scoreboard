import { HttpStatusError } from "~/error/http-error"

export function permissionDenied(): never {
  throw new HttpStatusError(
    400,
    "You do not have permission for this operation",
    {
      tag: "error_permission_denied",
    }
  )
}
