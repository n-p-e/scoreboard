import { createFileRoute } from "@tanstack/solid-router"
import { backendApp } from "~/server/backend"

const handleApiRequest = ({ request }: { request: Request }) => {
  return backendApp.fetch(request)
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: handleApiRequest,
      POST: handleApiRequest,
      PUT: handleApiRequest,
      PATCH: handleApiRequest,
      DELETE: handleApiRequest,
      OPTIONS: handleApiRequest,
    },
  },
})
