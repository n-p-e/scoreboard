import { describe, expect, test } from "vitest"
import type { PlayerRawScore } from "./riichi-schema"
import { calculateMatchStandings } from "./scores"

describe("calculateUmaPoints()", () => {
  const scoresInput = (scores: (number | null)[]) =>
    scores.map(
      (s, index) =>
        ({
          name: `player_${index}`,
          points: s,
        }) satisfies PlayerRawScore
    )

  test("applies uma", () => {
    const result = calculateMatchStandings(scoresInput([350, 250, 240, 160]))
    expect(result).toStrictEqual([
      {
        finalScore: 400,
        index: 0,
        name: "player_0",
        points: 350,
        rank: 0,
        umaPoints: 300,
      },
      {
        finalScore: 100,
        index: 1,
        name: "player_1",
        points: 250,
        rank: 1,
        umaPoints: 100,
      },
      {
        finalScore: -110,
        index: 2,
        name: "player_2",
        points: 240,
        rank: 2,
        umaPoints: -100,
      },
      {
        finalScore: -390,
        index: 3,
        name: "player_3",
        points: 160,
        rank: 3,
        umaPoints: -300,
      },
    ])
  })

  test("in other order", () => {
    const result = calculateMatchStandings(scoresInput([240, 350, 250, 160]))
    expect(result).toStrictEqual([
      {
        finalScore: -110,
        index: 0,
        name: "player_0",
        points: 240,
        rank: 2,
        umaPoints: -100,
      },
      {
        finalScore: 400,
        index: 1,
        name: "player_1",
        points: 350,
        rank: 0,
        umaPoints: 300,
      },
      {
        finalScore: 100,
        index: 2,
        name: "player_2",
        points: 250,
        rank: 1,
        umaPoints: 100,
      },
      {
        finalScore: -390,
        index: 3,
        name: "player_3",
        points: 160,
        rank: 3,
        umaPoints: -300,
      },
    ])
  })

  test("when all initial", () => {
    const result = calculateMatchStandings(scoresInput([250, 250, 250, 250]))
    expect(result.map((r) => r.umaPoints)).toStrictEqual([300, 100, -100, -300])
  })
})
