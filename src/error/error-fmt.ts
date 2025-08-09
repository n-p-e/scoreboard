import { appEnv } from "~/env"
import { AppError } from "~/error/app-error"

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function formatError(error: unknown) {
  if (error instanceof AppError) return error.message
  if (!appEnv.isProduction && error instanceof Error)
    return `[${error.name}] ${error}`
  return "An error has occured"
}
