import { createFileRoute } from '@tanstack/solid-router'

export const Route = createFileRoute('/leagues')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/leagues"!</div>
}
