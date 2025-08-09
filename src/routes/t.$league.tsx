import { createFileRoute, Outlet } from "@tanstack/solid-router"
import { Suspense } from "solid-js"
import { Loading } from "~/components/loading"
import { NavbarContainer, NavbarLink } from "~/components/navbar"

export const Route = createFileRoute("/t/$league")({
  component: Layout,
})

function Layout() {
  const params = Route.useParams()

  return (
    <div class="flex flex-col min-h-screen">
      <NavbarContainer>
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
