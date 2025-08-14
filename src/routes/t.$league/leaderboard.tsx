import { createFileRoute } from "@tanstack/solid-router"
import { createServerFn } from "@tanstack/solid-start"
import { For, Suspense } from "solid-js"
import * as z from "zod/mini"
import { Loading } from "~/components/loading"
import { queryLeaderboard } from "~/riichi/riichi-store"

const loader = createServerFn()
  .validator(z.object({ leagueId: z.string() }))
  .handler(async ({ data }) => {
    const res = await queryLeaderboard({
      leagueId: data.leagueId,
      limit: 50,
    })
    return res
  })

export const Route = createFileRoute("/t/$league/leaderboard")({
  loader: async (ctx) => {
    return await loader({ data: { leagueId: ctx.params.league } })
  },
  pendingComponent: Loading,
  head: async () => ({
    meta: [
      {
        title: "Leaderboard – Riichi Scoreboard",
      },
    ],
  }),
  component: LeaderboardPage,
})

function LeaderboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Leaderboard />
    </Suspense>
  )
}

function Leaderboard() {
  const data = Route.useLoaderData()

  return (
    <main class="max-w-lg w-full mx-auto py-4 px-2 text-xs xs:text-base overflow-x-auto">
      <table class="table-auto w-full">
        <thead>
          <tr class="*:py-2 *:px-0.5 bg-gray-800">
            <th class="text-center border border-gray-700"></th>
            <th class="text-center border border-gray-700">Name</th>
            <th class="text-center border border-gray-700">Standing</th>
            <th class="text-center border border-gray-700">Avg. Points</th>
            <th class="text-center border border-gray-700">Avg. Rank</th>
            <th class="text-center border border-gray-700">Games</th>
          </tr>
        </thead>
        <tbody class="*:even:bg-gray-900">
          <For each={data().leaderboard}>
            {(item, index) => (
              <tr class="*:py-2 *:px-0.5">
                <td class="text-center border-x border-gray-700">
                  <span class="px-2">{index() + 1}</span>
                </td>
                <td class="text-center border-x border-gray-700">
                  <span class="font-semibold">{item.playerName}</span>
                </td>
                <td class="text-center border-x border-gray-700">
                  {(item.standing / 10).toFixed(1)}
                </td>
                <td class="text-center border-x border-gray-700">
                  {Math.round(item.averagePoints * 100).toLocaleString(
                    "en-AU",
                    {
                      maximumFractionDigits: 0,
                    }
                  )}
                </td>
                <td class="text-center border-x border-gray-700">
                  {(item.averageRank + 1).toFixed(2)}
                </td>
                <td class="text-center border-x border-gray-700">
                  {item.numGames}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </main>
  )
}
