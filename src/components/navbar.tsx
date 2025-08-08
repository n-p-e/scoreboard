import { Popover } from "@ark-ui/solid/popover"
import { useNavigate } from "@tanstack/solid-router"
import { RiSystemMenuLine } from "solid-icons/ri"
import { Show } from "solid-js"
import { appApiClient } from "~/api-contract/client"
import { getLoginState } from "~/users/login-state"

import style from "./navbar.module.css"

export const Dropdown = () => {
  const navigate = useNavigate()
  const [loginState] = getLoginState()

  return (
    <Popover.Root>
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
                  params: {
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
