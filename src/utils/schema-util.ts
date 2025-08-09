import { Uuid25 } from "uuid25"
import * as z from "zod/mini"

export const integerRange = (min: number, max: number) => {
  return z.coerce.number().check(
    z.minimum(min, `should be between ${min} and ${max}`),
    z.maximum(max, `should be between ${min} and ${max}`),
    z.refine((n) => Number.isSafeInteger(n), "Invalid input: expected integer")
  )
}

export const uuidString = () =>
  z.pipe(
    z.string(),
    z.transform((s) => Uuid25.parse(s).toString())
  )
