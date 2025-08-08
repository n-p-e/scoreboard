import { tsr } from "@ts-rest/serverless/fetch"
import { appApiContract } from "~/api-contract/contract"
import { HttpStatusError } from "~/error/http-error"
import { listLeagues } from "~/league/league-store"
import { AppPlatformContext } from "~/server/server-types"

export const leaguesRouter = tsr
  .platformContext<AppPlatformContext>()
  .router(appApiContract.leagues, {
    listLeagues: async (_req, ctx) => {
      if (!ctx.authStatus.loggedIn || !ctx.authStatus.roles.includes("admin"))
        throw new HttpStatusError(403, "Not logged in")

      return {
        status: 200,
        body: { leagues: await listLeagues({}) },
      }
    },
  })
