import { createFileRoute, notFound } from "@tanstack/solid-router"
import { createServerFn } from "@tanstack/solid-start"
import { format } from "date-fns"
import { For, Match, Show, Suspense, Switch } from "solid-js"
import { appApiClient } from "~/api-contract/client.js"
import { Button } from "~/components/button.js"
import { Link } from "~/components/Link.js"
import { findLeague } from "~/league/league-store"
import { listMatches } from "~/riichi/riichi-store"
import { getLoginState } from "~/users/login-state.js"

const loader = createServerFn()
  .validator((data: { leagueId: string }) => data)
  .handler(async ({ data }) => {
    const leagueId = data.leagueId
    const league = await findLeague(leagueId)
    if (league == null) throw notFound()
    const matches = await listMatches({ leagueId: league.leagueId })
    return { league, matches }
  })

export const Route = createFileRoute("/t/$league/matches")({
  head: () => ({
    meta: [{ title: "Recent Matches – Riichi Scoreboard" }],
  }),
  loader: async (ctx) => loader({ data: { leagueId: ctx.params.league } }),
  component: MatchesPage,
})

function MatchesPage() {
  return (
    <Suspense>
      <MatchesPageContent />
    </Suspense>
  )
}

function MatchesPageContent() {
  const data = Route.useLoaderData()
  const [loginState] = getLoginState()

  return (
    <main class="max-w-md w-full mx-auto pt-2">
      <h1 class="p-2 text-lg font-semibold">
        Recent Matches:{" "}
        <span class="font-normal">{data().league.displayName ?? ""}</span>
      </h1>
      <ul class="flex flex-col p-4 gap-4">
        <For each={data().matches}>
          {(item) => (
            <li class="flex flex-col w-full border border-gray-500 bg-slate-900 p-4">
              <div class="flex w-full justify-between pb-4 text-gray-200">
                <span>Match: {formatMatchDate(item.createdAt)}</span>
              </div>
              <div class="flex flex-row flex-wrap w-full gap-4">
                <For each={item.standings}>
                  {(player, _index) => (
                    <div
                      class="flex flex-col"
                      style={{
                        // Set to 50% of the parent's gap
                        "flex-basis": "calc(50% - var(--spacing) * 2)",
                      }}
                    >
                      <div class="font-semibold">{player.name}</div>
                      <div class="flex flex-row w-full items-center justify-between">
                        <div class="">
                          {player.points}
                          <span class="text-sm ps-0.5">00</span>
                        </div>
                        <div class="font-mono text-sm">
                          {(player.finalScore / 10).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>

              <Show when={loginState()?.loggedIn}>
                <div class="flex w-full items-center justify-between mt-4">
                  <div class="flex">
                    <span class="text-sm">
                      <Switch>
                        <Match when={item.confirmed}>Confirmed</Match>
                        <Match when={!item.confirmed}>{null}</Match>
                      </Switch>
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <Link
                      to={"/t/$league/match/$matchId/edit"}
                      params={{
                        league: item.leagueId,
                        matchId: item.matchId,
                      }}
                    >
                      <Button>Edit</Button>
                    </Link>
                    <Button
                      type="button"
                      onClick={async () => {
                        const resp = await appApiClient.riichi.patchStandings({
                          params: {
                            leagueId: data().league.leagueId,
                            matchId: item.matchId,
                          },
                          body: {
                            // toggle confirm
                            confirmed: !item.confirmed,
                          },
                        })
                        if (resp.status === 200) {
                          window.location.reload()
                        }
                      }}
                    >
                      <span class="min-w-14">
                        {item.confirmed ? "Undo" : "Confirm"}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        // TODO: better error state
                        const resp = await appApiClient.riichi.deleteStandings({
                          params: {
                            leagueId: data().league.leagueId,
                            matchId: item.matchId,
                          },
                        })
                        if (resp.status === 200) {
                          window.location.reload()
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Show>
            </li>
          )}
        </For>
      </ul>
    </main>
  )
}

function formatMatchDate(date: Date): string {
  return format(date, "d/L/y HH:mm")
}
