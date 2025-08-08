import {
  TsRestHttpError,
  type TsRestRequest,
  TsRestResponse,
} from "@ts-rest/serverless/fetch"
import { $ZodError as ZodErrorBase } from "zod/v4/core"
import { AppError } from "~/error/app-error"
import { HttpStatusError } from "~/error/http-error"
import { getLogger } from "~/logger"

const log = getLogger("api-error-handler")

export const tsRestErrorHandler = (err: unknown, req: TsRestRequest) => {
  if (err instanceof AppError) {
    log.warn(
      {
        msg: err.message,
        method: req.method,
        url: req.url,
        tag: err.info.tag,
        error: err.info,
      },
      "api-error"
    )

    return TsRestResponse.fromJson(
      {
        tag: err.info.tag,
        message: err.message,
        info: err.info,
      },
      {
        status: err instanceof HttpStatusError ? err.httpStatus : 400,
      }
    )
  } else if (err instanceof TsRestHttpError) {
    return TsRestResponse.fromJson(
      {
        ...err.body,
        message: err.message,
      },
      { status: err.statusCode }
    )
  } else if (err instanceof ZodErrorBase) {
    return TsRestResponse.fromJson(
      {
        tag: "invalid-request",
        message: err.message,
        info: {
          issues: err.issues,
        },
      },
      { status: 400 }
    )
  } else {
    let stack: string | undefined
    let errorClass: string | undefined
    if (err instanceof Error) {
      errorClass = err.constructor.name
      stack = err.stack
    }
    log.error(
      {
        tag: "unknown-error",
        method: req.method,
        url: req.url,
        error: err,
        errorClass,
        stack,
        msg: String(err),
      },
      "unknown-error"
    )

    return TsRestResponse.fromJson(
      { message: "unknown error" },
      { status: 500 }
    )
  }
}
