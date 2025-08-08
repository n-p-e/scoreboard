import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch"
import { CookieMap } from "bun"
import { appApiContract } from "~/api-contract/contract"
import { riichiRouter } from "~/riichi/riichi-handler"
import { tsRestErrorHandler } from "~/server/error-handler"
import { AppPlatformContext, RequestExt } from "~/server/server-types"
import { usersRouter } from "~/users/users-handler"
import { AuthTokenName, queryLoggedInStatus } from "~/users/users-store"

const router = tsr
  .platformContext<AppPlatformContext>()
  .router(appApiContract, {
    users: usersRouter,
    riichi: riichiRouter,

    healthcheck: async () => {
      return {
        status: 200,
        body: {
          status: "success",
        },
      }
    },
  })

export const createApiHandler = () => {
  return async (c: { request: Request }) => {
    return await fetchRequestHandler({
      request: c.request,
      // request: new Request(c.req.url, c.req.raw),
      contract: appApiContract,
      router,
      options: {
        errorHandler: tsRestErrorHandler,
        requestMiddleware: [
          tsr.middleware<RequestExt>(async (request, ctx) => {
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
            request.authStatus = (ctx as AppPlatformContext).authStatus =
              await queryLoggedInStatus(token)
          }),
        ],
      },
      platformContext: {
        ...c,
        authStatus: { loggedIn: false },
      } satisfies AppPlatformContext,
    })
  }
}
