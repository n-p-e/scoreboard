import { tsr } from "@ts-rest/serverless/fetch"
import { CookieMap } from "bun"
import { appApiContract } from "~/api-contract/contract"
import { AppPlatformContext } from "~/server/server-types"
import { userLogin } from "~/users/users-store"

export const usersRouter = tsr
  .platformContext<AppPlatformContext>()
  .router(appApiContract.users, {
    login: async ({ body }, { responseHeaders }) => {
      const res = await userLogin(body)

      const cookies = new CookieMap()
      cookies.set("auth_token", res.token, {
        secure: import.meta.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 8 * 24 * 3600,
        sameSite: "strict",
        path: "/",
      })
      // set response header
      cookies
        .toSetCookieHeaders()
        .forEach((value) => responseHeaders.set("set-cookie", value))

      return {
        status: 200,
        body: res,
      }
    },

    logout: async (_req, { responseHeaders }) => {
      responseHeaders.set("set-cookie", "auth_token=; Max-Age=0; Path=/")
      return {
        status: 200,
        body: {
          status: "success",
        },
      }
    },

    queryLoginStatus: async (_req, { authStatus }) => {
      return {
        status: 200,
        body: {
          data: authStatus ?? { loggedIn: false },
        },
      }
    },
  })
