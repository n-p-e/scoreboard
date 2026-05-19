import { QueryClient } from "@tanstack/solid-query"
import { createRouter as createTanStackRouter } from "@tanstack/solid-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/solid-router-ssr-query"

import { DefaultCatchBoundary } from "./components/errors"
import { NotFound } from "./components/NotFound"
import { routeTree } from "./routeTree.gen"

export function getRouter() {
  const queryClient = new QueryClient({})

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    // defaultPreload: false,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    // scrollRestoration: true,
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module "@tanstack/solid-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
