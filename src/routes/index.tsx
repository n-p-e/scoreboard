import { createFileRoute } from "@tanstack/solid-router"
import { Button } from "~/components/button"
import { Link } from "~/components/Link"

export const Route = createFileRoute("/")({
  component: Home,
})
export default function Home() {
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
