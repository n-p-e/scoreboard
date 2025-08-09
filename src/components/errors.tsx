import type { ErrorComponentProps } from "@tanstack/solid-router"
import { Link, rootRouteId, useMatch, useRouter } from "@tanstack/solid-router"
import { createSignal } from "solid-js"
import { Button } from "~/components/button"
import { appEnv } from "~/env"
import { formatError } from "~/error/error-fmt"

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

// Taken from https://github.com/TanStack/router/blob/v1.130.16/packages/solid-router/src/CatchBoundary.tsx
export function ErrorComponent({ error }: { error: unknown }) {
  const [show, setShow] = createSignal(!appEnv.isProduction)

  return (
    <div style={{ padding: ".5rem", "max-width": "100%" }}>
      <div style={{ display: "flex", "align-items": "center", gap: ".5rem" }}>
        <strong style={{ "font-size": "1rem" }}>Something went wrong!</strong>
        <Button
          type="button"
          variant="outline"
          class="text-xs h-auto p-1.5"
          onClick={() => setShow((d) => !d)}
        >
          {show() ? "Hide details" : "Show details"}
        </Button>
      </div>
      <div style={{ height: ".25rem" }} />
      {show() ? (
        <div>
          <pre class="text-sm text-red-400 border border-red-500 rounded-sm p-1 overflow-auto">
            <code>{formatError(error)}</code>
          </pre>
        </div>
      ) : null}
    </div>
  )
}
