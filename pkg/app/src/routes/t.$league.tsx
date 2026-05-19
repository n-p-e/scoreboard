import {
  createFileRoute,
  Outlet,
  useMatch,
  useNavigate,
} from "@tanstack/solid-router"
import { Show, Suspense } from "solid-js"

import { Loading } from "~/components/loading"
import {
  DropdownButton,
  NavbarContainer,
  NavbarLink,
} from "~/components/navbar"

export const Route = createFileRoute("/t/$league")({
  component: Layout,
})

function Layout() {
  const params = Route.useParams()

  return (
    <div class="flex flex-col min-h-screen">
      <NavbarContainer dropdownItems={<StatsLink />}>
        <NavbarLink
          to={`/t/$league/matches`}
          params={{ league: params().league }}
        >
          Matches
        </NavbarLink>
        <NavbarLink
          to={`/t/$league/leaderboard`}
          params={{ league: params().league }}
        >
          Standings
        </NavbarLink>
        <NavbarLink
          to={`/t/$league/submit`}
          params={{ league: params().league }}
        >
          Submit
        </NavbarLink>
      </NavbarContainer>

      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

const StatsLink = () => {
  const navigate = useNavigate()
  const match = useMatch({
    from: "/t/$league",
    shouldThrow: false,
  })

  return (
    <Show when={match()}>
      {(match) => (
        <DropdownButton
          onClick={() =>
            navigate({
              to: "/t/$league/stats",
              params: { league: match().params.league },
            })
          }
        >
          Stats
        </DropdownButton>
      )}
    </Show>
  )
}
