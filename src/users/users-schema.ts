import * as z from "zod/mini"
import { uuidString } from "~/utils/schema-util"

export const UserZ = z.object({
  uid: uuidString(),
  username: z.string(),
})
export type UserModel = z.infer<typeof UserZ>

export const UserLoginZ = z
  .object({
    username: z.string().check(z.minLength(1, "Username cannot be empty")),
    password: z
      .string()
      .check(
        z.minLength(6, "Password should be 6-60 characters long"),
        z.maxLength(60, "Password should be 6-60 characters long")
      ),
  })
  .brand<"UserLogin">()
export type UserLogin = z.infer<typeof UserLoginZ>

export const AuthTokenZ = z.object({
  username: z.string(),
  roles: z._default(z.array(z.string()), () => []),
  sub: z.string().check(z.refine((s) => s.startsWith("app.user/"))),
  iat: z.number(),
})
export type AuthToken = z.infer<typeof AuthTokenZ>

export const AuthStatusResultZ = z.union([
  z.object({
    loggedIn: z.literal(false),
  }),
  z.object({
    loggedIn: z.literal(true),
    user: UserZ,
    roles: z.array(z.string()),
  }),
])
export type AuthStatusResult = z.infer<typeof AuthStatusResultZ>
