import { fetchRequestHandler, tsr } from "@ts-rest/serverless/fetch"
import { appApiContract } from "~/api-contract/contract"
import { leaguesRouter } from "~/league/leagues-handler"
import { riichiRouter } from "~/riichi/riichi-handler"
import { tsRestErrorHandler } from "~/server/error-handler"
import { AppPlatformContext, RequestExt } from "~/server/server-types"
import { usersRouter } from "~/users/users-handler"
import { getRequestAuthStatus } from "~/users/users-store"

const router = tsr
  .platformContext<AppPlatformContext>()
  .router(appApiContract, {
    users: usersRouter,
    leagues: leaguesRouter,
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
            request.authStatus = (ctx as AppPlatformContext).authStatus =
              await getRequestAuthStatus(request)
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
