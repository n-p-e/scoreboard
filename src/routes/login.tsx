import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { createSignal, Show } from "solid-js"

import { appApiClient } from "~/api-contract/client"
import { Button } from "~/components/button"
import { type UserLogin, UserLoginZ } from "~/users/users-schema"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const [error, setError] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)
  const navigate = useNavigate()

  return (
    <main class="flex flex-col items-center mx-auto text-white p-4">
      <form
        class="flex flex-col gap-2 w-full max-w-xs"
        onSubmit={(e) => {
          e.preventDefault()

          const formData = new FormData(e.currentTarget)
          const parseResult = UserLoginZ.safeParse({
            username: (formData.get("username") ?? undefined) as string,
            password: (formData.get("password") ?? undefined) as string,
          } as Partial<UserLogin>)

          if (parseResult.success) {
            ;(async () => {
              setLoading(true)
              const res = await appApiClient.users.login({
                body: parseResult.data,
              })
              setLoading(false)
              if (res.status === 200) {
                const search = new URLSearchParams(window.location.search)
                navigate({ to: search.get("redir") ?? "/leagues" })
              } else {
                setError("Could not log in")
              }
            })()
          } else {
            setError(
              parseResult.error.issues[0]?.message ?? "Please check your input"
            )
          }
        }}
      >
        <div class="flex flex-col py-4">
          <h1 class="text-lg text-center">Admin log in</h1>
        </div>
        <input
          name="username"
          type="text"
          placeholder="Username"
          class="bg-gray-900 text-lg border-1 px-2 border-gray-700 placeholder-gray-600"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          class="bg-gray-900 text-lg border-1 px-2 border-gray-700 placeholder-gray-600"
        />
        <Button type="submit" variant="outline" disabled={loading()}>
          Log in
        </Button>
        <div class="min-h-4 text-sm text-red-400 text-center">
          <Show when={error() != null}>{error()}</Show>
        </div>
      </form>
    </main>
  )
}
