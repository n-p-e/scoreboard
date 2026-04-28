import "@tanstack/solid-start/server-only"

if (typeof process === "undefined") {
  throw new Error("This file is marked server-only")
}

const _serverOnly = "This file is marked server-only"
export default _serverOnly
