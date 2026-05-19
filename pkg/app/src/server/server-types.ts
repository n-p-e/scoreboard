import { AuthStatus } from "~/users/users-schema"

interface HonoVariables {
  auth?: AuthStatus
  sourceIp?: string
}

export interface HonoEnv {
  Variables: HonoVariables
}
