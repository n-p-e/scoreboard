/**
 * Set an element of array immutably, returning a copy of the array.
 */
export function arraySet<T>(arr: T[], index: number, value: T): T[] {
  const res = arr.slice()
  res[index] = value
  return res
}

export function sum(arr: number[]) {
  return arr.reduce((a, b) => a + b)
}
