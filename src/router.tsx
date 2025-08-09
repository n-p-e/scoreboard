import { createRouter as createTanStackRouter } from "@tanstack/solid-router"
import { DefaultCatchBoundary } from "./components/errors"
import { NotFound } from "./components/NotFound"
import { routeTree } from "./routeTree.gen"

export function createRouter() {
  const router = createTanStackRouter({
    routeTree,
    // defaultPreload: false,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  })

  return router
}

declare module "@tanstack/solid-router" {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
