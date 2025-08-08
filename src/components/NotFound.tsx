import { Link } from "@tanstack/solid-router"
import { Button } from "~/components/button"

export function NotFound({ children }: { children?: any }) {
  return (
    <div class="flex items-center flex-col space-y-2 p-2 mx-auto">
      <div class="text-gray-600 dark:text-gray-400">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p class="flex items-center gap-2 flex-wrap">
        <Button type="button" onClick={() => window.history.back()}>
          Go back
        </Button>
        <Link to="/">
          <Button variant="outline">Start Over</Button>
        </Link>
      </p>
    </div>
  )
}
