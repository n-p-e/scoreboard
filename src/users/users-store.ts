import "~/server/server-only"

import { Buffer } from "node:buffer"
import { password as BunPassword, CookieMap } from "bun"
import { and, eq, type InferSelectModel, isNull } from "drizzle-orm"
import * as jose from "jose"
import { db, type Transaction } from "~/db/connection"
import { rolesTable, usersTable } from "~/db/schema"
import { serverEnv } from "~/env.server"
import { HttpStatusError } from "~/error/http-error"
import { getLogger } from "~/logger"
import {
  type AuthStatus,
  type AuthToken,
  AuthTokenZ,
  type ChangePassword,
  type User,
  type UserLogin,
  UserLoginZ,
  UserZ,
} from "~/users/users-schema"
import { uuidCompactToNormal } from "~/utils/schema-util"

const logger = getLogger("users-store")

export const AuthTokenName = "auth_token"

const secret = new Uint8Array(
  Buffer.from(serverEnv.tokenSignSecret, "base64url").buffer
)
const alg = "HS256"

export async function userLogin(params: UserLogin) {
  const { user, roles } = await queryUserRoles(params)

  const token = await new jose.SignJWT({
    username: user.username,
    roles,
  })
    .setProtectedHeader({ alg })
    .setSubject(`app.user/${user.uid}`)
    .setIssuedAt(new Date())
    .sign(secret)
  return { token, user, roles }
}

export async function getRequestAuthStatus(
  request: Request
): Promise<AuthStatus> {
  const authorizationHeader = request.headers.get("Authorization")
  let token: string | undefined
  const authTokenCookie = new CookieMap(
    request.headers.get("Cookie") ?? undefined
  ).get(AuthTokenName)
  if (authTokenCookie != null) {
    token = authTokenCookie
  }
  if (authorizationHeader?.startsWith("Bearer ")) {
    token = authorizationHeader.substring("Bearer ".length)
  }

  return parseAuthToken(token)
}

export async function parseAuthTokenCookie(cookie: string | null | undefined) {
  if (cookie == null) return { ok: false }

  const cookieMap = new CookieMap(cookie)
  return await parseAuthTokenInner(cookieMap.get(AuthTokenName))
}

/**
 * Parse the auth token from HTTP Cookie header
 */
export async function parseAuthTokenInner(
  token: string | null | undefined
): Promise<
  | { ok: false }
  | {
      ok: true
      tokenBody: AuthToken
      header: jose.JWTHeaderParameters
    }
> {
  if (token == null) return { ok: false }

  try {
    const parseResult = await jose.jwtVerify(token ?? "", secret)
    // console.log({ parseResult })
    return {
      ok: true,
      tokenBody: AuthTokenZ.parse(parseResult.payload),
      header: parseResult.protectedHeader,
    }
  } catch (_e) {
    return { ok: false }
  }
}

export async function parseAuthToken(
  token: string | null | undefined
): Promise<AuthStatus> {
  const parseResult = await parseAuthTokenInner(token)
  if (parseResult.ok) {
    return {
      loggedIn: true,
      user: {
        username: parseResult.tokenBody.username,
        uid: parseResult.tokenBody.sub.replace(/^app\.user\//, ""),
      },
      roles: parseResult.tokenBody.roles,
    }
  } else {
    return { loggedIn: false }
  }
}

export async function queryUserRoles(
  params:
    | {
        username: string
        isAuthed?: boolean
        password: string
      }
    | {
        username: string
        isAuthed: true
      }
): Promise<{
  user: User
  roles: string[]
}> {
  // const foundUser = await db.query.usersTable.findFirst({
  //   where: eq(usersTable.username, params.username),
  // })

  const queryUsersRoles = await db
    .select()
    .from(usersTable)
    .leftJoin(rolesTable, eq(usersTable.id, rolesTable.user_id))
    .where(
      and(
        isNull(usersTable.deleted_at),
        eq(usersTable.username, params.username)
      )
    )
    .limit(1)

  if (
    queryUsersRoles.length <= 0 ||
    (!params.isAuthed &&
      !(await passwordMatches(
        queryUsersRoles[0].users.password_hash,
        params.password
      )))
  ) {
    throw new HttpStatusError(400, "The log-in details are incorrect", {
      tag: "login-failed",
    })
  }

  return {
    user: toUserModel(queryUsersRoles[0].users),
    roles: queryUsersRoles
      .map((row) => row.user_roles?.role)
      .filter((role) => role != null),
  }
}

export async function createUser(params: UserLogin, tx?: Transaction) {
  return await (tx ?? db).transaction(async (tx) => {
    const res = await tx
      .insert(usersTable)
      .values({
        username: params.username,
        password_hash: await hashPassword(params.password),
      })
      .returning()

    if (res.length === 0) {
      throw new HttpStatusError(400, "Could not create user", {
        tag: "user-create-failed",
      })
    }
    return toUserModel(res[0])
  })
}

export async function changePassword({
  username,
  oldPassword,
  newPassword,
}: ChangePassword) {
  logger.info({
    msg: "changePassword",
    username,
  })

  const { user } = await userLogin(
    UserLoginZ.parse({ username, password: oldPassword })
  )
  const res = await db
    .update(usersTable)
    .set({
      password_hash: await hashPassword(newPassword),
    })
    .where(eq(usersTable.id, uuidCompactToNormal(user.uid)))
    .returning()

  if (res.length !== 1) {
    logger.warn({
      msg: "changePassword: incorrect number of rows updated",
      updateCount: res.length,
    })
  }
}

async function passwordMatches(
  hash: string | null,
  password: string
): Promise<boolean> {
  if (hash == null) return false
  return BunPassword.verify(password, hash)
}

async function hashPassword(password: string): Promise<string> {
  return await BunPassword.hash(password, { algorithm: "argon2id" })
}

function toUserModel(u: InferSelectModel<typeof usersTable>): User {
  // Parse to format the uuid representation
  return UserZ.parse({
    uid: u.id,
    username: u.username,
  } satisfies User)
}
