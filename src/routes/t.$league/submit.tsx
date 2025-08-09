import { createFileRoute } from "@tanstack/solid-router"
import { createServerFn } from "@tanstack/solid-start"
import { Show } from "solid-js"
import * as z from "zod/mini"
import { Loading } from "~/components/loading"
import { findLeague } from "~/league/league-store"
import { RiichiResultSubmission } from "~/riichi/submit"
import { LeagueDescription } from "~/riichi/submit-page-notes"

const loader = createServerFn()
  .validator(z.object({ leagueId: z.string() }))
  .handler(async ({ data }) => {
    return { league: await findLeague(data.leagueId) }
  })

export const Route = createFileRoute("/t/$league/submit")({
  loader: async (ctx) =>
    loader({
      data: { leagueId: ctx.params.league },
    }),
  head: () => ({
    meta: [
      {
        title: "Submit Match Result – Riichi Scoreboard",
      },
    ],
  }),
  component: SubmitPage,
  pendingComponent: Loading,
})

function SubmitPage() {
  const data = Route.useLoaderData()

  return (
    <main class="max-w-md w-full mx-auto my-2 px-4">
      <h2 class="py-2 text-lg font-semibold">Submit Match Result</h2>

      <Show when={data().league != null} fallback={<p>League not found</p>}>
        <p class="">{data().league?.displayName}</p>
        <LeagueDescription />
        <div class="my-4">
          <RiichiResultSubmission league={data().league!} />
        </div>
      </Show>
    </main>
  )
}
