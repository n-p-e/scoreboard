import { tsr } from "@ts-rest/serverless/fetch"
import { appApiContract } from "~/api-contract/contract"
import { listLeagues } from "~/league/league-store"
import { AppPlatformContext } from "~/server/server-types"

export const leaguesRouter = tsr
  .platformContext<AppPlatformContext>()
  .router(appApiContract.leagues, {
    listLeagues: async () => {
      return {
        status: 200,
        body: { leagues: await listLeagues({}) },
      }
    },
  })
