import { createFileRoute } from "@tanstack/solid-router"
import {
  createEffect,
  createResource,
  createSignal,
  Index,
  Show,
  Suspense,
} from "solid-js"
import { createStore } from "solid-js/store"
import { appApiClient } from "~/api-contract/client"
import { Button } from "~/components/button"
import { Input } from "~/components/input"
import { calculateMatchStandings } from "~/riichi/scores"

export const Route = createFileRoute("/t/$league/match/$matchId/edit")({
  component: EditMatchPage,
})

function EditMatchForm() {
  const params = Route.useParams()
  const navigate = Route.useNavigate()

  const [match] = createResource(async () => {
    const res = await appApiClient.riichi.listMatches({
      params: { league: params().league },
      query: {
        matchId: params().matchId,
        limit: 1,
      },
    })

    if (res.status === 200) {
      return res.body.data[0] ?? null
    }
    return null
  })

  const [initialised, setInitialised] = createSignal(false)
  const [formData, setFormData] = createStore(match()!)

  const [adjustFinalScores] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  createEffect(() => {
    if (!initialised() && match()) {
      setInitialised(true)
      setFormData(match()!)
    }
  })

  const recalculateFinalScores = () => {
    const scores = formData.standings
    setFormData("standings", calculateMatchStandings(scores))
  }

  return (
    <main class="max-w-sm mx-auto px-2 py-2 sm:px-0">
      <h1 class="font-semibold my-2">Edit match standings</h1>
      <Show when={match()}>
        <form
          class="flex flex-col"
          onSubmit={async (e) => {
            e.preventDefault()

            const res = await appApiClient.riichi.updateMatch({
              params: { league: formData.leagueId, match: formData.matchId },
              body: { data: formData },
            })
            if (res.status === 200) {
              navigate({
                to: "/t/$league/matches",
                params: {
                  league: params().league,
                },
              })
            } else {
              setError("An error has occured")
            }
          }}
        >
          <Index each={formData.standings}>
            {(item, index) => {
              return (
                <div class="flex flex-col gap-2 py-2">
                  <Input
                    value={item().name}
                    onInput={(e) => {
                      setFormData("standings", index, "name", e.target.value)
                    }}
                  />
                  <div class="flex flex-row gap-2">
                    <Input
                      class="w-full"
                      value={item().points ?? 0}
                      onInput={(e) => {
                        setFormData(
                          "standings",
                          index,
                          "points",
                          parseInt(e.target.value, 10)
                        )
                      }}
                    />

                    <Input
                      class="w-full"
                      disabled={!adjustFinalScores()}
                      value={((item().finalScore ?? 0) / 10).toFixed(1)}
                      onChange={(e) => {
                        setFormData(
                          "standings",
                          index,
                          "finalScore",
                          Number(e.target.value) * 10
                        )
                      }}
                    />
                  </div>
                </div>
              )
            }}
          </Index>

          <Show when={error() != null}>
            <div class="text-red-400">{error()}</div>
          </Show>

          <div class="w-full flex flex-col py-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => recalculateFinalScores()}
            >
              Recalculate final scores
            </Button>

            <Button type="submit">Apply changes</Button>
          </div>
        </form>
      </Show>
    </main>
  )
}

export default function EditMatchPage() {
  return (
    <Suspense fallback={<div>Loading</div>}>
      <EditMatchForm />
    </Suspense>
  )
}
