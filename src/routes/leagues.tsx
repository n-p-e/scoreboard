import { createFileRoute, redirect, useRouter } from "@tanstack/solid-router"
import { For } from "solid-js"
import { appApiClient } from "~/api-contract/client"
import { Button } from "~/components/button"
import { Link } from "~/components/Link"
import { Loading } from "~/components/loading"
import { fetchLoginState } from "~/users/login-state"

export const Route = createFileRoute("/leagues")({
  loader: async (ctx) => {
    if (!(await fetchLoginState()).loggedIn) {
      throw redirect({ to: "/login" })
    }

    const resp = await appApiClient.leagues.listLeagues({
      fetchOptions: {
        signal: ctx.abortController.signal,
      },
    })
    if (resp.status === 200) {
      return { leagues: resp.body.leagues }
    }

    throw new Error("An error has occured")
  },
  component: LeaguesPage,
  pendingComponent: Loading,
})

function LeaguesPage() {
  const data = Route.useLoaderData()
  const router = useRouter()

  return (
    <main class="max-w-sm mx-auto">
      <h1 class="my-4 text-xl font-semibold">Manage leagues</h1>
      <ul class="flex flex-col gap-2 p-4">
        <For each={data().leagues}>
          {(item) => {
            const enabled = item.status !== "disabled"
            return (
              <li class="flex items-center justify-between text-blue-300 hover:text-blue-200 border border-gray-700 bg-gray-900/50 p-3 transition-all hover:border-gray-500">
                {/* League Info & Link */}
                <Link
                  to="/t/$league/leaderboard"
                  params={{ league: item.leagueId }}
                  class="flex flex-col gap-1 w-full"
                >
                  <span class="text-lg font-medium  transition-colors">
                    {item.displayName}
                  </span>

                  {/* Status Badge */}
                  <div class="flex items-center gap-2">
                    <span
                      class={`h-2 w-2 rounded-full ${enabled ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span class="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                      {enabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                </Link>

                {/* Action Button */}
                <Button
                  class="w-24"
                  onClick={() => {
                    appApiClient.leagues
                      .patchLeague({
                        body: { enabled: !enabled },
                        params: { league: item.leagueId },
                      })
                      .then(() => router.navigate({ to: ".", replace: true }))
                  }}
                >
                  {enabled ? "Disable" : "Enable"}
                </Button>
              </li>
            )
          }}
        </For>
      </ul>
    </main>
  )
}
