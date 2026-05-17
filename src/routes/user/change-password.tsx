import { useMutation } from "@tanstack/solid-query"
import { createFileRoute, redirect } from "@tanstack/solid-router"

import { appApiClient } from "~/api-contract/client"
import { Button } from "~/components/button"
import { fetchLoginState } from "~/users/login-state"
import { ChangePasswordZ } from "~/users/users-schema"

export const Route = createFileRoute("/user/change-password")({
  component: ChangePasswordPage,
  loader: async () => {
    const login = await fetchLoginState()
    if (!login.loggedIn) {
      throw redirect({ to: "/login" })
    }
    return { login }
  },
})

function ChangePasswordPage() {
  const login = Route.useLoaderData()
  const navigate = Route.useNavigate()

  const changePasswordMut = useMutation(() => ({
    mutationFn: async (formData: FormData) => {
      const parseResult = ChangePasswordZ.parse({
        username: (formData.get("username") ?? undefined) as string,
        oldPassword: (formData.get("old_password") ?? undefined) as string,
        newPassword: (formData.get("new_password") ?? undefined) as string,
      })
      await appApiClient.users.changePassword({ body: parseResult })
      navigate({ to: "/" })
    },
  }))

  return (
    <main class="flex flex-col items-center mx-auto text-white p-4">
      <form
        class="flex flex-col gap-2 w-full max-w-xs"
        onSubmit={(e) => {
          e.preventDefault()

          const formData = new FormData(e.currentTarget)
          formData.set("username", login().login.user.username)
          changePasswordMut.mutate(formData)
        }}
      >
        <input
          disabled
          name="username"
          type="text"
          placeholder="Username"
          class="bg-gray-900 text-lg border px-2 border-gray-700 placeholder-gray-600 disabled:text-gray-300 disabled:bg-gray-800"
          value={login().login.user.username}
        />
        <input
          name="old_password"
          type="password"
          placeholder="Old Password"
          class="bg-gray-900 text-lg border px-2 border-gray-700 placeholder-gray-600"
        />
        <input
          name="new_password"
          type="password"
          placeholder="New Password"
          class="bg-gray-900 text-lg border px-2 border-gray-700 placeholder-gray-600"
        />
        <Button
          type="submit"
          variant="outline"
          disabled={changePasswordMut.isPending}
        >
          Change Password
        </Button>
        <div>{changePasswordMut.error?.toString()}</div>
      </form>
    </main>
  )
}
