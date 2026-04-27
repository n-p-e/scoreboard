import "@tanstack/solid-start/client-only"
import { cookieName } from "./timezone-preference"

export const setTimezoneCookie = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timezone) {
    // biome-ignore lint/suspicious/noDocumentCookie: api is not available
    document.cookie = `${cookieName}=${encodeURIComponent(timezone)}; path=/; max-age=31536000; SameSite=Lax`
  }
}

setTimezoneCookie()
