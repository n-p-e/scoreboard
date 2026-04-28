import { ErrorHandler, NotFoundHandler } from "hono"
import { ContentfulStatusCode } from "hono/utils/http-status"
import * as zod from "zod"
import { AppError } from "~/error/app-error"
import { HttpStatusError } from "~/error/http-error"
import { getLogger } from "~/logger"

const log = getLogger("api-error-handler")

export const backendErrorHandler: ErrorHandler = (err, c) => {
  const method = c.req.method
  const url = c.req.url

  if (err instanceof AppError) {
    log.warn(
      {
        msg: err.message,
        method,
        url,
        tag: err.info.tag,
        error: err.info,
      },
      "api-error"
    )

    const status = err instanceof HttpStatusError ? err.httpStatus : 400

    return c.json(
      {
        tag: err.info.tag,
        message: err.message,
        info: err.info,
      },
      status as ContentfulStatusCode
    )
  }

  // Handle Validation Errors (Zod)
  if (err instanceof zod.core.$ZodError) {
    return c.json(
      {
        tag: "invalid-request",
        message: err.message,
        info: {
          issues: err.issues,
        },
      },
      400
    )
  }

  // Unexpected Errors
  let stack: string | undefined
  let errorClass: string | undefined

  if (err instanceof Error) {
    errorClass = err.constructor.name
    stack = err.stack
  }

  log.error(
    {
      tag: "unknown-error",
      method,
      url,
      error: err,
      errorClass,
      stack,
      msg: String(err),
    },
    "unknown-error"
  )

  return c.json({ status: "unknown-error", message: "unknown error" }, 500)
}

export const notFoundHandler: NotFoundHandler = (c) => {
  return c.json(
    {
      status: "not-found",
      message: `Route not found: ${c.req.method} ${c.req.path}`,
    },
    404
  )
}
