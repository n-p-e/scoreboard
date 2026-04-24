import { createFileRoute, notFound, useNavigate } from "@tanstack/solid-router"
import { createServerFn } from "@tanstack/solid-start"
import { format, parseISO } from "date-fns"
import { For, Suspense } from "solid-js"
import * as z from "zod/mini"
import { Loading } from "~/components/loading"
import { findLeague, queryLeagueStats } from "~/league/league-store"

const summarySearchSchema = z.object({
  period: z.optional(z.enum(["day", "week"])),
})

const loader = createServerFn()
  .inputValidator(
    z.object({
      leagueId: z.string(),
      period: z.enum(["day", "week"]),
    })
  )
  .handler(async ({ data }) => {
    const league = await findLeague(data.leagueId)
    if (league == null) throw notFound()
    const stats = await queryLeagueStats({
      leagueId: data.leagueId,
      period: data.period,
    })

    return {
      league,
      stats,
    }
  })

export const Route = createFileRoute("/t/$league/stats")({
  validateSearch: summarySearchSchema,
  loaderDeps: ({ search }) => ({
    period: search.period ?? "week",
  }),
  loader: async (ctx) =>
    loader({
      data: {
        leagueId: ctx.params.league,
        period: ctx.deps.period,
      },
    }),
  pendingComponent: Loading,
  head: () => ({
    meta: [{ title: "Stats – Riichi Scoreboard" }],
  }),
  component: SummaryPage,
})

function SummaryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SummaryPageContent />
    </Suspense>
  )
}

function SummaryPageContent() {
  const data = Route.useLoaderData()
  const search = Route.useSearch()
  const params = Route.useParams()
  const navigate = useNavigate()
  const period = () => search().period ?? "week"

  return (
    <main class="max-w-md w-full mx-auto pt-2 px-2">
      <div class="px-2 pb-4">
        <h1 class="text-lg inline-flex space-x-2">
          <span class="bg-gray-300 text-black py-1 px-2 font-semibold">
            Stats
          </span>
          <span class="font-normal p-1">
            {data().league?.displayName ?? ""}
          </span>
        </h1>
      </div>

      <div class="px-2 pb-4">
        <fieldset class="inline-flex w-full items-stretch border border-gray-700 overflow-hidden">
          <legend class="sr-only">Summary period</legend>
          <PeriodOption
            label="Daily"
            checked={period() === "day"}
            onSelect={() =>
              navigate({
                to: "/t/$league/stats",
                params: { league: params().league },
                search: (prev) => ({ ...prev, period: "day" }),
              })
            }
          />
          <PeriodOption
            label="Weekly"
            checked={period() === "week"}
            onSelect={() =>
              navigate({
                to: "/t/$league/stats",
                params: { league: params().league },
                search: (prev) => ({ ...prev, period: "week" }),
              })
            }
          />
        </fieldset>
      </div>

      <ul class="flex flex-col gap-4 px-2 pb-4">
        <For each={data().stats.items}>
          {(item) => (
            <li class="border border-gray-500 bg-slate-900 p-4">
              <div class="flex items-center justify-between pb-4">
                <h2 class="font-semibold">{formatPeriodLabel(item)}</h2>
                <span class="text-sm text-gray-400">
                  {item.players.reduce((acc, player) => acc + player.games, 0)}{" "}
                  games
                </span>
              </div>

              <div class="flex flex-col gap-2">
                <For each={item.players}>
                  {(player, index) => (
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3 overflow-hidden">
                        <span class="text-sm text-gray-400 w-5 text-right">
                          {index() + 1}
                        </span>
                        <span class="font-semibold truncate">
                          {player.playerName}
                        </span>
                      </div>
                      <span class="font-mono">{player.games}</span>
                    </div>
                  )}
                </For>
              </div>
            </li>
          )}
        </For>
        <For each={data().stats.items.length === 0 ? [null] : []}>
          {() => (
            <li class="border border-gray-500 bg-slate-900 p-4 text-gray-300">
              No games found for this period.
            </li>
          )}
        </For>
      </ul>
    </main>
  )
}

function PeriodOption(props: {
  label: string
  checked: boolean
  onSelect: () => void
}) {
  return (
    <label
      classList={{
        "px-2 py-1 flex-1 text-sm text-center cursor-pointer transition-colors": true,
        "bg-slate-700 text-white": props.checked,
        "bg-slate-950 text-gray-300 hover:bg-slate-800": !props.checked,
      }}
    >
      <input
        type="radio"
        name="stats-period"
        checked={props.checked}
        onChange={() => props.onSelect()}
        class="sr-only"
      />
      {props.label}
    </label>
  )
}

function formatPeriodLabel(item: { startDate: string; endDate: string }) {
  if (item.startDate === item.endDate) {
    return format(parseISO(item.startDate), "d LLL yyyy")
  }

  return `${format(parseISO(item.startDate), "d LLL")} – ${format(
    parseISO(item.endDate),
    "d LLL yyyy"
  )}`
}
