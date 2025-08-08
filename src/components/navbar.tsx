import { Popover } from "@ark-ui/solid/popover"
import { useNavigate } from "@tanstack/solid-router"
import { RiSystemMenuLine } from "solid-icons/ri"
import { ParentProps, Show } from "solid-js"
import { appApiClient } from "~/api-contract/client"
import { Link } from "~/components/Link"
import { getLoginState } from "~/users/login-state"
import style from "./navbar.module.css"

export const NavbarContainer = (props: ParentProps) => {
  return (
    <nav class="flex flex-row items-center justify-center h-10 xs:h-12 bg-slate-900 text-sm xs:text-base text-gray-200">
      <div class="flex-1"> </div>
      <div class="flex flex-row gap-1 xs:gap-4 items-center justify-center h-10 xs:h-12">
        {props.children}
      </div>
      <div class="flex-1 flex justify-end">
        <Dropdown />
      </div>
    </nav>
  )
}

export const NavbarLink: typeof Link = (props) => {
  return (
    <Link
      class="px-2 xs:px-4 h-full inline-flex items-center transition-colors duration-200 hover:bg-slate-700"
      activeClass="text-white bg-slate-700 pointer-events-none cursor-default"
      {...props}
    />
  )
}

export const Dropdown = () => {
  const navigate = useNavigate()
  const [loginState] = getLoginState()

  return (
    <Popover.Root modal>
      <Popover.Trigger class="text-base p-4">
        <span class={style.dropdownTriggerIcon}>
          <RiSystemMenuLine />
        </span>
      </Popover.Trigger>

      <Popover.Positioner>
        <Popover.Content class={style.dropdownContent}>
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
            <button
              type="button"
              class={style.dropdownItem}
              onClick={() => {
                navigate({ to: "/leagues" })
              }}
            >
              All Leagues
            </button>
            <button
              type="button"
              class={style.dropdownItem}
              onClick={() => {
                appApiClient.users
                  .logout({ body: {} })
                  .then(() => window.location.reload())
              }}
            >
              Log out
            </button>
          </Show>
          <Show when={!loginState()?.loggedIn}>
            <button
              type="button"
              class={style.dropdownItem}
              onClick={() => {
                navigate({
                  to: "/login",
                  search: {
                    redir: window.location.pathname,
                  },
                })
              }}
            >
              Log in
            </button>
          </Show>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  )
}
