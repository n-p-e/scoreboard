import {
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from "@tanstack/solid-router"
import { createServerFn } from "@tanstack/solid-start"
import {
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Suspense,
  Switch,
} from "solid-js"
import { NoHydration } from "solid-js/web"
import * as z from "zod/mini"

import { appApiClient } from "~/api-contract/client.js"
import { Button } from "~/components/button.js"
import { Link, LinkButton } from "~/components/Link.js"
import { Loading } from "~/components/loading"
import { findLeague } from "~/league/league-store"
import { listMatches } from "~/riichi/riichi-store"
import { timezonePref } from "~/ui-utils/timezone-preference"
import { queryLoginState } from "~/users/login-state.js"

const loader = createServerFn()
  .inputValidator(
    z.object({
      leagueId: z.string(),
      before: z.optional(z.string()),
      after: z.optional(z.string()),
    })
  )
  .handler(async ({ data }) => {
    // await new Promise((resolve) => setTimeout(resolve, 500))
    const { leagueId, before, after } = data
    const league = await findLeague(leagueId)
    if (league == null) throw notFound()
    const {
      data: matches,
      prev,
      next,
      hasMore,
    } = await listMatches({ leagueId: league.leagueId, before, after })
    return { league, matches, prev, next, hasMore }
  })

export const Route = createFileRoute("/t/$league/matches")({
  validateSearch: z.object({
    before: z.optional(z.string()),
    after: z.optional(z.string()),
  }),
  loaderDeps: ({ search }) => search,
  head: () => ({
    meta: [{ title: "Recent Matches – Riichi Scoreboard" }],
  }),
  loader: async (ctx) =>
    loader({
      data: {
        leagueId: ctx.params.league,
        before: ctx.deps.before,
        after: ctx.deps.after,
      },
    }),
  component: MatchesPage,
  pendingComponent: Loading,
  preload: false,
})

function MatchesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MatchesPageContent />
    </Suspense>
  )
}

function MatchesPageContent() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const navigate = useNavigate()
  const [loginState] = queryLoginState()

  return (
    <main class="max-w-md w-full mx-auto pt-2">
      <h1 class="p-2 text-lg font-semibold">
        Recent Matches:{" "}
        <span class="font-normal">{data().league.displayName ?? ""}</span>
      </h1>
      <Pagination />
      <ul class="flex flex-col p-4 gap-4" data-testid="matches-list">
        <For each={data().matches}>
          {(item) => (
            <li class="flex flex-col w-full border border-gray-500 bg-slate-900 p-4">
              <div class="flex w-full justify-between pb-4 text-gray-200">
                <span>
                  Match: <DateDisplay date={item.createdAt} />
                </span>
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
                          <Show
                            when={
                              player.points! + player.umaPoints - 250 !==
                              player.finalScore
                            }
                          >
                            <span class="ps-1 text-xs text-red-400">
                              (
                              {(player.finalScore -
                                (player.points! + player.umaPoints - 250)) /
                                10}
                              )
                            </span>
                          </Show>
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
                          router.invalidate({})
                          await navigate({ to: ".", replace: true })
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
                          router.invalidate({})
                          await navigate({ to: ".", replace: true })
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

        <Pagination />
      </ul>
    </main>
  )
}

const Pagination = () => {
  const data = Route.useLoaderData()
  const search = Route.useSearch()

  return (
    <div class="flex space-x-2 w-full justify-center">
      <Link
        to="/t/$league/matches"
        params={{ league: data().league.leagueId }}
        search={{}}
        resetScroll
        reloadDocument
      >
        <Button>First</Button>
      </Link>

      <LinkButton
        to="/t/$league/matches"
        params={{ league: data().league.leagueId }}
        search={{ before: data().prev ?? undefined }}
        disabled={
          (search().before && !data().hasMore) ||
          (!search().before && !search().after)
        }
        resetScroll
      >
        Previous
      </LinkButton>

      <LinkButton
        to="/t/$league/matches"
        params={{ league: data().league.leagueId }}
        search={{ after: data().next ?? undefined }}
        disabled={!search().before && !data().hasMore}
        resetScroll
      >
        Next
      </LinkButton>
    </div>
  )
}

const DateDisplay = (props: { date: Date }) => {
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  return (
    <span>
      <Show
        when={mounted()}
        fallback={<FallbackDateDisplay date={props.date} />}
      >
        {formatMatchDate(props.date)}
      </Show>
    </span>
  )
}

const FallbackDateDisplay = (props: { date: Date }) => {
  const timezone = timezonePref()

  return (
    <NoHydration>
      {timezone
        ? formatMatchDate(props.date, timezone)
        : props.date.toISOString()}
    </NoHydration>
  )
}

function formatMatchDate(date: Date, timezone?: string): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const result = formatter.format(date)
  return result
}
