import { AuthStatusResult } from "~/users/users-schema"

export interface RequestExt {
  authStatus?: AuthStatusResult
}
export interface AppPlatformContext {
  request: Request
  authStatus: AuthStatusResult
}
