import { createFileRoute, redirect } from "@tanstack/solid-router"
import { Button } from "~/components/button"
import { Link } from "~/components/Link"
import { fetchLoginState } from "~/users/login-state"

export const Route = createFileRoute("/")({
  component: Home,
  beforeLoad: async () => {
    if ((await fetchLoginState()).loggedIn) {
      throw redirect({ to: "/leagues" })
    }
  },
})

function Home() {
  return (
    <main class="text-center mx-auto text-white p-4">
      <h1 class="max-6-xs text-6xl uppercase">Riichi</h1>
      <h1 class="max-6-xs text-6xl uppercase">Scoreboard</h1>

      <Link to="/login">
        <Button>Log in</Button>
      </Link>
    </main>
  )
}
