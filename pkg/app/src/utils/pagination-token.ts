type PagerDef = {
  [key: string]: {
    marker: string
    type: "string" | "int"
  }
}

interface Pager<D extends PagerDef> {
  definitions: D
  keyToMarker: Record<string, string>
  markerToKey: Record<string, string>
}

type Data<D extends PagerDef> = {
  [key in keyof D]: D[key]["type"] extends "string" ? string : number
}

const Separator = "_"

export function define<Def extends PagerDef>(def: Def): Pager<Def> {
  const keyToMarker: Record<string, string> = {}
  const markerToKey: Record<string, string> = {}

  for (const key in def) {
    const marker = def[key].marker
    if (Object.hasOwn(markerToKey, marker)) {
      throw new Error("definePager: duplicate marker")
    }
    keyToMarker[key] = marker
    markerToKey[marker] = key
  }

  return { keyToMarker, markerToKey, definitions: def }
}

export function encode<D extends PagerDef>(
  pager: Pager<D>,
  data: Data<D>
): string {
  const parts: string[] = []
  for (const key in pager.definitions) {
    const { marker, type } = pager.definitions[key]
    const value =
      type === "int"
        ? (data[key] as number).toFixed(0)
        : (data[key] as string)

    if (value.includes(Separator)) {
      throw new Error(
        `pagination-token encode: value for "${key}" must not contain "${Separator}"`
      )
    }
    parts.push(marker + Separator + value)
  }

  return parts.join(Separator)
}

export function decode<D extends PagerDef>(
  pager: Pager<D>,
  token: string
): Data<D> {
  const parts = token.split(Separator)
  const output: Record<string, string | number> = {}

  for (let i = 0; i < parts.length; i += 2) {
    const marker = parts[i]
    const value = parts[i + 1]
    if (!marker || value == null) break

    const key = pager.markerToKey[marker]
    if (!key) continue

    const def = pager.definitions[key]
    if (def.type === "int") {
      output[key] = Number(value)
    } else {
      output[key] = value
    }
  }

  return output as Data<D>
}

export const string = (marker: string) =>
  ({
    marker,
    type: "string",
  }) as const

export const int = (marker: string) =>
  ({
    marker,
    type: "int",
  }) as const

export default {
  define,
  string,
  int,
}
