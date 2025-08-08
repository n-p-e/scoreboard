import { createFileRoute, Outlet } from "@tanstack/solid-router"
import { Suspense } from "solid-js"
import { Navbar, NavbarLink } from "~/components/navbar"

export const Route = createFileRoute("/t/$league")({
  component: Layout,
})

function Layout() {
  const params = Route.useParams()

  return (
    <div class="flex flex-col min-h-screen">
      <Navbar>
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
      </Navbar>

      <Suspense
        fallback={
          <div class="flex flex-1 items-center justify-center w-full h-full text-lg font-semibold">
            Loading
          </div>
        }
      >
        <Outlet />
      </Suspense>
    </div>
  )
}
