import "~/server/server-only"

import { getRequest } from "@tanstack/solid-start/server"
import { backendApp } from "~/server/backend"

// Intercept the fetch request and route to backend app.
export async function ssrLocalFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  // the original request from client that triggers this
  const originalRequest = getRequest()
  const url = new URL(
    typeof input === "string" ? input : input.toString(),
    originalRequest.url
  )

  const headers = new Headers(originalRequest.headers)
  if (init?.headers != null) {
    new Headers(init.headers).forEach((value, key) => {
      headers.set(key, value)
    })
  }

  const forwardedRequest = new Request(url, {
    method: init?.method ?? "GET",
    headers,
    body: init?.body,
  })

  return backendApp.fetch(forwardedRequest)
}
