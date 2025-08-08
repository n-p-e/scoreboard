import pino from "pino"

const rootLogger = pino({
  level: "info",
  transport: (() => {
    if (import.meta.env.DEV) {
      return {
        target: "pino-pretty",
      }
    }
    return undefined // default transport
  })(),
})

export function getLogger(name: string) {
  return rootLogger.child({ name })
}
