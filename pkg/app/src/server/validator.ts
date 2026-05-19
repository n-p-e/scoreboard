import { Context } from "hono"
import { validator } from "hono/validator"
import * as zod from "zod"
import * as zodMini from "zod/mini"

type ZodSchema = zod.ZodType | zodMini.ZodMiniType

// --- middlewares for request validation
export function jsonValidator<T extends ZodSchema>(schema: T) {
  return validator("json", (value, c) => validatorInner(schema, value, c))
}

export function queryValidator<T extends ZodSchema>(schema: T) {
  return validator("query", (value, c) => validatorInner(schema, value, c))
}

export function paramValidator<T extends ZodSchema>(schema: T) {
  return validator("param", (value, c) => validatorInner(schema, value, c))
}

function validatorInner<T extends ZodSchema>(
  schema: T,
  value: unknown,
  c: Context
) {
  const result = schema.safeParse(value)
  if (result.success) {
    return result.data as zod.output<T>
  }
  const error = result.error
  return c.json(
    {
      status: "invalid-request",
      message: zod.prettifyError(error),
      error: { issues: error.issues, type: error.type },
    },
    400
  )
}
