export type Comparator<T> = (a: T, b: T) => number

function compose<T>(...args: Array<Comparator<T>>): Comparator<T> {
  return (a, b) => {
    for (const cmp of args) {
      const res = cmp(a, b)
      if (res !== 0) return res
    }
    return 0
  }
}

function byKey<T, U>(
  key: (item: T) => U,
  cmp: (key1: U, key2: U) => number
): (a: T, b: T) => number {
  return (a, b) => cmp(key(a), key(b))
}

function asc(a: number | null, b: number | null) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}

function desc(a: number | null, b: number | null) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return b - a
}

export default {
  compose,
  byKey,
  asc,
  desc,
}
