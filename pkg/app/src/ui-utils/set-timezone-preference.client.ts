import "@tanstack/solid-start/client-only"
import { cookieName } from "./timezone-preference"

export const setTimezoneCookie = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timezone) {
    document.cookie = `${cookieName}=${encodeURIComponent(timezone)}; path=/; max-age=31536000; SameSite=Lax`
  }
}
