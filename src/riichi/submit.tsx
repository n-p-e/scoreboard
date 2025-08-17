import { Combobox, useListCollection } from "@ark-ui/solid/combobox"
import { useNavigate } from "@tanstack/solid-router"
import { IoAddSharp, IoTriangleSharp } from "solid-icons/io"
import {
  type ComponentProps,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  Show,
  Switch,
  untrack,
} from "solid-js"
import { appApiClient } from "~/api-contract/client"
import { Button } from "~/components/button"
import type { LeagueData } from "~/league/league-schema"
import { calculateMatchStandings } from "~/riichi/scores"
import { createAsyncAction } from "~/ui-utils/action"
import { createDebouncedGetter } from "~/ui-utils/debounce"
import { arraySet, sum } from "~/utils/arrays"
import type { PlayerRawScore, SubmitMatchResultRequest } from "./riichi-schema"

const playerNums = [0, 1, 2, 3]
const defaultTotalScore = 100_000

export const RiichiResultSubmission = (props: { league: LeagueData }) => {
  const navigate = useNavigate()
  const [results, setResults] = createSignal<(number | null)[]>(
    playerNums.map(() => null)
  )
  const [names, setNames] = createSignal<string[]>(playerNums.map(() => ""))
  const finalScores = createMemo(() =>
    calculateMatchStandings(
      playerNums.map(
        (player) =>
          ({
            name: names()[player],
            points: results()[player],
          }) satisfies PlayerRawScore
      )
    )
  )
  const [adjustFinalScores, setAdjustFinalScores] = createSignal(false)
  // const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (e) => {
  //   e.preventDefault()
  //   e.currentTarget.reset()
  //   setResults(playerNums.map(() => null))
  // }

  let formRef!: HTMLFormElement

  // createEffect(() => {
  //   if (submitAction.result === true) {
  //     formRef.reset()
  //     submitAction.clear()
  //   }
  // })

  const submitAction = createAsyncAction(
    async (leagueId: string, formData: FormData) => {
      const shouldAdjust = formData.get(`adjust_final_scores`) === "true"

      const data: SubmitMatchResultRequest["data"] = {
        leagueId,
        matchResult: playerNums.map((player) => {
          const adjustedFinalScoreField = formData.get(
            `adjusted_final_score_player_${player}`
          )
          let adjustedFinalScore: number | null = null
          if (shouldAdjust && adjustedFinalScoreField != null) {
            adjustedFinalScore = Number(adjustedFinalScoreField) * 10
          }

          return {
            name: formData.get(`name_player_${player}`) as string,
            points: Number(formData.get(`score_player_${player}`)),
            adjustedFinalScore,
          }
        }),
      }
      const res = await appApiClient.riichi.submitStandings({
        body: { data },
      })

      if (res.status !== 200) {
        throw Error("An error has occured") // TODO: proper messages
      }

      await navigate({
        to: "/t/$league/matches",
        params: {
          league: props.league.leagueId,
        },
      })
      // return true
    }
  )

  // createEffect(() => console.log(props.league.leagueId))

  const totalScore = () => sum(finalScores().map((x) => (x.points ?? 0) * 100))

  return (
    <form
      ref={formRef}
      class="flex flex-col items-center w-full max-w-sm mx-auto gap-4"
      onSubmit={(ev) => {
        ev.preventDefault()
        submitAction.run(props.league.leagueId, new FormData(ev.currentTarget))
      }}
    >
      <input
        hidden
        name="adjust_final_scores"
        value={String(adjustFinalScores())}
      />
      <For each={playerNums}>
        {(player) => (
          <FormRow
            index={player}
            points={results()[player]}
            rank={finalScores()[player].rank}
            standing={(finalScores()[player].finalScore / 10).toFixed(1)}
            adjustFinalScores={adjustFinalScores()}
            onNameChange={(v) => {
              setNames((n) => arraySet(n, player, v))
            }}
            onPointsChange={(v) => {
              if (v.length > 0 && !Number.isNaN(Number(v))) {
                setResults(arraySet(results(), player, Number(v)))
              } else {
                setResults(arraySet(results(), player, null))
              }
            }}
          />
        )}
      </For>

      <Switch>
        <Match when={adjustFinalScores()}>
          <div class="flex w-full p-2">
            <Button
              variant="outline"
              type="button"
              class="inline-flex flex-wrap h-auto w-full"
              onClick={() => setAdjustFinalScores(false)}
            >
              <span>Reset final scores</span>
            </Button>
          </div>
        </Match>
        <Match when={!adjustFinalScores()}>
          <div class="flex w-full py-2">
            <Button
              variant="outline"
              type="button"
              class="inline-flex flex-wrap h-auto w-full"
              onClick={() => setAdjustFinalScores(true)}
            >
              <span>Adjust final scores</span>
              <span>(chombo penalty, etc.)</span>
            </Button>
          </div>
        </Match>
      </Switch>
      <Show when={submitAction.error}>
        <div class="text-red-400">An error has occured.</div>
      </Show>
      <div class="flex items-center sticky bottom-0 py-2 w-full bg-black/80">
        {/* spacer */}
        <div class="shrink basis-4" />
        <div class="inline-flex items-center flex-nowrap gap-4 w-full">
          Total
          <span
            classList={{
              "w-20 text-right overflow-hidden font-semibold py-1 px-2": true,
              "text-white": totalScore() === defaultTotalScore,
              "text-green-400": totalScore() > defaultTotalScore,
              "text-red-400": totalScore() < defaultTotalScore,
            }}
          >
            {totalScore().toLocaleString("en-AU")}
          </span>
        </div>
        <SubmitButton disabled={submitAction.loading} />
        <div class="shrink basis-4" />
      </div>
    </form>
  )
}

const rankDisplay = ["1st", "2nd", "3rd", "4th"]

const FormRow = (props: {
  points: number | null
  rank: number
  standing: string
  index: number
  adjustFinalScores: boolean
  onNameChange?: (v: string) => void
  onPointsChange?: (v: string) => void
}) => {
  const [points, setPoints] = createSignal("")
  const [finalScore, setFinalScore] = createSignal(
    untrack(() => props.standing)
  )
  createEffect(() => {
    if (props.adjustFinalScores) {
      setFinalScore(props.standing)
    }
  })

  return (
    <div class="flex flex-col w-full gap-1">
      <PlayerNameInput
        name={`name_player_${props.index}`}
        onNameChange={props.onNameChange}
      />
      <div class="flex items-center w-full font-mono">
        <div class="flex pe-1">
          <ScorePlusMinusToggle
            scoreInput={points()}
            onToggle={() => {
              if (points().startsWith("-")) {
                setPoints(points().replaceAll("-", ""))
              } else {
                setPoints(`-${points()}`)
              }
              props.onPointsChange?.(points())
            }}
          />
        </div>
        <input
          name={`score_player_${props.index}`}
          class="w-24 grow-0 shrink text-lg border-1 px-2 border-gray-700 text-center placeholder-gray-600"
          value={points()}
          onInput={(e) => {
            const input = e.target.value
            if (input === "" || /^-?\d*$/.test(input)) {
              setPoints(input)
              props.onPointsChange?.(input)
            }
          }}
          placeholder="250"
          inputMode="decimal"
          autocomplete="off"
        />
        <div class="text-sm text-slate-300 p-1">00</div>
        <div class="flex-1"></div>
        <div class="grow-0 shrink inline-flex justify-between h-10 text-center gap-4 overflow-hidden">
          <div class="inline-flex flex-initial items-center text-nowrap justify-start">
            {props.points != null ? rankDisplay[props.rank] : "--"}
          </div>
          <Show when={!props.adjustFinalScores}>
            <div class="inline-flex flex-initial items-center w-12 text-nowrap justify-end">
              {props.standing}
            </div>
          </Show>
          <Show when={props.adjustFinalScores}>
            <div class="inline-flex flex-initial items-center w-24 text-nowrap text-center">
              <input
                name={`adjusted_final_score_player_${props.index}`}
                class="text-lg border-1 px-2 border-gray-700 w-full text-center placeholder-gray-600"
                value={finalScore()}
                onChange={(e) => setFinalScore(e.target.value)}
                autocomplete="off"
              />
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}

const playerNamesQuery = async (searchTerm: string) => {
  const res = await appApiClient.riichi.listPlayers({
    query: {
      search: searchTerm,
      limit: 5,
    },
  })
  if (res.status === 200) {
    return res.body.data.players
  }
  throw Error("Unknown error")
}

const PlayerNameInput = (props: {
  name: string
  onNameChange?: (v: string) => void
}) => {
  // Thing in the text box
  const [searchTerm, setSearchTerm] = createSignal("")
  const debouncedSearchTerm = createDebouncedGetter(searchTerm)
  const [search] = createResource(debouncedSearchTerm, (value) =>
    playerNamesQuery(value)
  )

  const { collection, set: setCandidates } = useListCollection({
    initialItems: search() ?? [],
    limit: 100,
    itemToString: (item) => item.name,
    itemToValue: (item) => item.name,
    // filter: (itemText, filterText) => itemText.includes(filterText),
    // filter: filterFn().contains,
  })

  const [open, setOpen] = createSignal(false)
  createEffect(() => setCandidates(search() ?? []))

  return (
    <Combobox.Root
      // debounceOptionsMillisecond={300}
      collection={collection()}
      open={open()}
      onOpenChange={(e) => setOpen(e.open)}
      allowCustomValue
      openOnChange
      closeOnSelect
      inputBehavior="autohighlight"
      // optionValue={(op) => op.value}
      // optionLabel={(op) => op.value}
      // optionTextValue={(op) => op.display}
      inputValue={searchTerm()}
      onInputValueChange={(e) => {
        setSearchTerm(e.inputValue)
        props.onNameChange?.(e.inputValue)
      }}
    >
      <Combobox.Control>
        <Combobox.Input
          name={props.name}
          class="text-lg border-1 px-2 border-gray-700 w-full placeholder-gray-600"
          placeholder="Player"
          autocomplete="off"
        />
      </Combobox.Control>
      <Combobox.Positioner>
        <Combobox.Content class="bg-gray-800 p-4 z-20">
          <Combobox.ItemGroup class="flex flex-col overflow-y-auto cursor-default">
            <Combobox.ItemGroupLabel
              class="p-2 hover:bg-gray-200 hover:text-black"
              onClick={() => {
                if (searchTerm().length > 0) setOpen(false)
              }}
            >
              {searchTerm()
                ? `Create player "${searchTerm()}"`
                : "Search for a player..."}
            </Combobox.ItemGroupLabel>

            <For each={collection().items}>
              {(item) => (
                <Combobox.Item
                  item={item}
                  class="p-2 hover:bg-gray-200 hover:text-black"
                >
                  <Combobox.ItemText>{item.name}</Combobox.ItemText>
                </Combobox.Item>
              )}
            </For>
          </Combobox.ItemGroup>
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  )
}

const ScorePlusMinusToggle = (props: {
  scoreInput: string
  onToggle?: () => void
}) => {
  const plus = () => !props.scoreInput.startsWith("-")

  return (
    <button
      type="button"
      class="relative inline-flex items-center p-1 bg-gray-950 rounded-full border border-gray-700 "
      onClick={props.onToggle}
    >
      <IoAddSharp class="h-4 w-4 p-0.5 z-10" />
      <IoTriangleSharp class="h-4 w-4 p-1 z-10" />
      <span
        class={`absolute top-1 my-auto w-4 h-4 rounded-full shadow-md transition-all duration-200 ease-out ${
          plus() ? "translate-x-0 bg-sky-600" : "translate-x-full bg-red-400"
        }`}
      />
    </button>
  )
}

const SubmitButton = (props: ComponentProps<typeof Button>) => {
  const [state, setState] = createSignal<"initial" | "confirm">("initial")
  const [timeoutRef, setTimeoutRef] = createSignal<NodeJS.Timeout | null>(null)

  return (
    <Button
      disabled={props.disabled}
      type={state() === "initial" ? "button" : "submit"}
      onClick={(e) => {
        if (state() === "initial") {
          e.preventDefault()
          setState("confirm")

          const timeout = timeoutRef()
          if (timeout != null) {
            clearTimeout(timeout)
          }

          setTimeoutRef(
            setTimeout(() => {
              setState("initial")
            }, 4000)
          )
        }
      }}
      class="min-w-28"
      classList={{
        // "min-w-28": true,
        "bg-green-400 hover:bg-green-300": state() === "confirm",
      }}
    >
      {state() === "initial" ? "Submit" : "Confirm"}
    </Button>
  )
}
