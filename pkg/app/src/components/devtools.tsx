import { SolidQueryDevtools } from "@tanstack/solid-query-devtools"
import { TanStackRouterDevtools } from "@tanstack/solid-router-devtools"

export default function Devtools() {
  return (
    <>
      <TanStackRouterDevtools position="bottom-right" />
      <SolidQueryDevtools buttonPosition="bottom-left" />
    </>
  )
}
