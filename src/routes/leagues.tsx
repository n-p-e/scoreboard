import { createFileRoute } from "@tanstack/solid-router"
import { For } from "solid-js"
import { appApiClient } from "~/api-contract/client"
import { Link } from "~/components/Link"

export const Route = createFileRoute("/leagues")({
  loader: async (ctx) => {
    const resp = await appApiClient.leagues.listLeagues({fetchOptions: {
      signal: ctx.abortController.signal,
    }})
    if (resp.status === 200) {
      return { leagues: resp.body.leagues }
    }

    throw new Error("An error has occured")
  },
  component: LeaguesPage,
})

export default function LeaguesPage() {
  const data = Route.useLoaderData()

  return (
    <main class="max-w-sm mx-auto">
      <h1 class="my-4 text-xl font-semibold">Manage leagues</h1>
      <ul class="flex flex-col gap-2 p-4">
        <For each={data().leagues}>
          {(item) => (
            <li class="flex w-full">
              <Link
                class="flex w-full border-1 p-2 border-gray-700 transition-colors  duration-initial hover:bg-gray-800"
                to="/t/$league/leaderboard"
                params={{ league: item.leagueId }}
              >
                {item.displayName}
              </Link>
            </li>
          )}
        </For>
      </ul>
    </main>
  )
}
