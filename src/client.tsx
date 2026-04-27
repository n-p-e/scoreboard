// src/client.tsx
import "~/ui-utils/set-timezone-preference.client"

import { hydrateStart, StartClient } from "@tanstack/solid-start/client"
import { hydrate } from "solid-js/web"

hydrateStart().then((router) => {
  hydrate(() => <StartClient router={router} />, document)
})
