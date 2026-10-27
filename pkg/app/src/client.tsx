import { hydrateStart, StartClient } from "@tanstack/solid-start/client"
import { hydrate } from "solid-js/web"

import { setTimezoneCookie } from "~/ui-utils/set-timezone-preference.client"

setTimezoneCookie()

hydrateStart().then((router) => {
  hydrate(() => <StartClient router={router} />, document)
})
