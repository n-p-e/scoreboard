import { createFileRoute, Outlet } from "@tanstack/solid-router"
import { Suspense } from "solid-js"
import { Link } from "~/components/Link"
import { Dropdown } from "~/components/navbar"

export const Route = createFileRoute("/t/$league")({
  component: Layout,
})

function Layout() {
  const params = Route.useParams()

  return (
    <div class="flex flex-col min-h-screen">
      <nav class="flex flex-row items-center justify-center h-10 xs:h-12 bg-slate-900 text-sm xs:text-base">
        <div class="flex-1"> </div>

        <div class="flex flex-row gap-1 xs:gap-4 items-center justify-center h-10 xs:h-12">
          <Link
            class="text-gray-200 px-2 xs:px-4 h-full inline-flex items-center transition-colors duration-200 hover:bg-slate-700"
            activeClass="text-white bg-slate-700"
            to={`/t/$league/matches`}
            params={{ league: params().league }}
          >
            Matches
          </Link>
          <Link
            class="text-gray-200 px-2 xs:px-4 h-full inline-flex items-center transition-colors duration-200 hover:bg-slate-700"
            activeClass="text-white bg-slate-700"
            to={`/t/$league/leaderboard`}
            params={{ league: params().league }}
          >
            Standings
          </Link>
          <Link
            class="text-gray-200 px-2 xs:px-4 h-full inline-flex items-center transition-colors duration-200 hover:bg-slate-700"
            activeClass="text-white bg-slate-700"
            to={`/t/$league/submit`}
            params={{ league: params().league }}
          >
            Submit
          </Link>
        </div>

        <div class="flex-1 flex justify-end">
          <Dropdown />
        </div>
      </nav>

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
