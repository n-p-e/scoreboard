import type { FinalScore, PlayerRawScore } from "~/riichi/riichi-schema"

export const defaultUma = [150, 50, -50, -150]
export const defaultInitialPoints = 300

export function calculateMatchStandings(
  scores: PlayerRawScore[],
  uma = defaultUma,
  initial = defaultInitialPoints
): FinalScore[] {
  // sort and preserve original index
  const sorted = scores
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
    .sort((a, b) => {
      return a.index - b.index
    })
  return sorted
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
