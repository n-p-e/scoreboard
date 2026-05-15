import type {
  PartialFinalScore,
  PartialPlayerRawScore,
} from "~/riichi/riichi-schema"
import { sum } from "~/utils/arrays"

export const defaultUma = [300, 100, -100, -300]
export const defaultInitialPoints = 250

export function calculateMatchStandings(
  scores: PartialPlayerRawScore[],
  uma = defaultUma,
  initial = defaultInitialPoints
): PartialFinalScore[] {
  const byRank = scores
    .map((v, index) => ({ ...v, index }))
    .sort((a, b) => {
      // null at the end
      const cmp0 = compareDescOrder(a.points, b.points)
      if (cmp0 !== 0) return cmp0
      return compareAscOrder(a.index, b.index)
    })
    .map((v, rank) => ({
      ...v,
      rank,
      umaPoints: v.points != null ? uma[rank] : 0,
      finalScore: v.points != null ? v.points - initial + uma[rank] : 0,
    }))

  const groupTies = byRank.reduce<(PartialFinalScore & { index: number })[][]>(
    (acc, v) => {
      const prevGroup = acc.at(acc.length - 1)
      if (prevGroup && prevGroup.at(0)?.points === v.points) {
        prevGroup.push(v)
      } else {
        acc.push([v])
      }
      return acc
    },
    []
  )

  const splitUma = groupTies.flatMap((group) => {
    if (group.length === 0) throw new Error("Impossible")
    const averageUma = sum(group.map((v) => v.umaPoints)) / group.length
    return group.map((v) => ({
      ...v,
      umaPoints: averageUma,
      finalScore: v.points != null ? v.points - initial + averageUma : 0,
    }))
  })

  // preserve original index
  const originalOrder = splitUma.sort((a, b) => {
    return a.index - b.index
  })
  return originalOrder
}

export function sortStandings<
  T extends {
    points: number | null
    rank: number
  },
>(standings: T[]): T[] {
  return standings
    .slice()
    .sort((a, b) => {
      const cmp0 = compareDescOrder(a.points, b.points)
      if (cmp0 !== 0) return cmp0
      return compareAscOrder(a.rank, b.rank)
    })
    .map((item, rank) => ({
      ...item,
      rank,
    }))
}

function compareAscOrder(a: number | null, b: number | null) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return a - b
}
function compareDescOrder(a: number | null, b: number | null) {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return b - a
}
