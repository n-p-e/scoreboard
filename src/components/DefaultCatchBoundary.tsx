import type { ErrorComponentProps } from "@tanstack/solid-router"
import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/solid-router"
import { Button } from "~/components/button"

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error("DefaultCatchBoundary Error:", error)

  return (
    <div class="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div class="flex gap-2 items-center flex-wrap">
        <Button
          type="button"
          onClick={() => {
            router.invalidate()
          }}
        >
          Try Again
        </Button>
        {isRoot() ? (
          <Link to="/">
            <Button variant="outline">Home</Button>
          </Link>
        ) : (
          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            <Button variant="outline">Go Back</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
