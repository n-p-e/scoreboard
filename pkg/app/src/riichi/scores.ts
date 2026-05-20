import type {
  PartialFinalScore,
  PartialPlayerRawScore,
} from "~/riichi/riichi-schema"
import { sum } from "~/utils/arrays"
import compare from "~/utils/compare"

export const defaultUma = [300, 100, -100, -300]
export const defaultInitialPoints = 250

export function calculateMatchStandings(
  scores: PartialPlayerRawScore[],
  uma = defaultUma,
  initial = defaultInitialPoints
): PartialFinalScore[] {
  const byRank = scores
    .map((v, index) => ({ ...v, index }))
    .sort(
      compare.compose(
        compare.byKey((v) => v.points, compare.desc),
        compare.byKey((v) => v.index, compare.asc)
      )
    )
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
  const originalOrder = splitUma.sort(
    compare.byKey((v) => v.index, compare.asc)
  )
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
    .sort(
      compare.compose(
        compare.byKey((v) => v.points, compare.desc),
        compare.byKey((v) => v.rank, compare.asc)
      )
    )
    .map((item, rank) => ({
      ...item,
      rank,
    }))
}
