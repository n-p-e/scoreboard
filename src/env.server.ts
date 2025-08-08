import "~/server/server-only"

export const serverEnv = {
  isProduction: import.meta.env.NODE_ENV === "production",
  apiBaseUrl:
    (import.meta.env.API_BASE_URL as string) ?? "http://localhost:3000/api",
}
