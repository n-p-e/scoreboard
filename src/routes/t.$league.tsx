import { DropdownMenu } from "@kobalte/core/dropdown-menu"
import { createFileRoute, Outlet } from "@tanstack/solid-router"
import { RiSystemMenuLine } from "solid-icons/ri"
import { Show, Suspense } from "solid-js"
import { appApiClient } from "~/api-contract/client"
import { Link } from "~/components/Link"
import { getLoginState } from "~/users/login-state"
import style from "./navbar.module.css"

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

const Dropdown = () => {
  const navigate = Route.useNavigate()
  const [loginState] = getLoginState()

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger class="text-base p-4">
        <DropdownMenu.Icon class={style.dropdownTriggerIcon}>
          <RiSystemMenuLine />
        </DropdownMenu.Icon>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content class={style.dropdownContent}>
          <Show when={loginState()?.loggedIn}>
            <div class={style.dropdownLabel}>
              Logged in as {(() => {
                const login = loginState()
                if (login?.loggedIn) {
                  return login.user.username
                }
                return ""
              })()}
            </div>
            <DropdownMenu.Item
              class={style.dropdownItem}
              onSelect={() => {
                navigate({ to: "/leagues" })
              }}
            >
              All Leagues
            </DropdownMenu.Item>
            <DropdownMenu.Item
              class={style.dropdownItem}
              onSelect={() => {
                appApiClient.users
                  .logout({ body: {} })
                  .then(() => window.location.reload())
              }}
            >
              Log out
            </DropdownMenu.Item>
          </Show>
          <Show when={!loginState()?.loggedIn}>
            <DropdownMenu.Item
              class={style.dropdownItem}
              onSelect={() => {
                navigate({
                  to: "/login",
                  params: {
                    redir: window.location.pathname,
                  },
                })
              }}
            >
              Log in
            </DropdownMenu.Item>
          </Show>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu>
  )
}
