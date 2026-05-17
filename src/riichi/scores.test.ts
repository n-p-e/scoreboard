import { describe, expect, test } from "vitest"

import type { PartialPlayerRawScore } from "./riichi-schema"
import { calculateMatchStandings, sortStandings } from "./scores"

describe("scores", () => {
  describe("calculateUmaPoints()", () => {
    const scoresInput = (scores: (number | null)[]) =>
      scores.map(
        (s, index) =>
          ({
            name: `player_${index}`,
            points: s,
          }) satisfies PartialPlayerRawScore
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

    test("retains original order", () => {
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
      expect(result.map((r) => r.umaPoints)).toStrictEqual([0, 0, 0, 0])
    })

    test("when tied", () => {
      const result = calculateMatchStandings(scoresInput([300, 250, 250, 200]))
      expect(result.map((r) => r.umaPoints)).toStrictEqual([300, 0, 0, -300])
    })

    test("when tied, keeps order", () => {
      const result = calculateMatchStandings(scoresInput([300, 200, 250, 250]))
      expect(result.map((r) => r.umaPoints)).toStrictEqual([300, -300, 0, 0])
    })

    test("when some are null", () => {
      const result = calculateMatchStandings(
        scoresInput([300, null, 200, null])
      )
      expect(result.map((r) => r.umaPoints)).toStrictEqual([300, 0, 100, 0])
      expect(result.map((r) => r.finalScore)).toStrictEqual([350, 0, 50, 0])
    })
  })

  describe("sortStandings()", () => {
    test("orders adjusted standings by raw points", async () => {
      const standings = sortStandings(
        calculateMatchStandings(
          [200, 200, 300, 300].map((points, index) => ({
            name: `player_${index}`,
            points,
          }))
        ).map((item, index) => ({
          ...item,
          finalScore: [400, -350, 350, 150][index],
          nameLower: item.name.toLowerCase(),
        }))
      )

      expect(
        standings.map(({ name, rank, points, finalScore }) => ({
          name,
          rank,
          points,
          finalScore,
        }))
      ).toStrictEqual([
        {
          finalScore: 350,
          name: "player_2",
          points: 300,
          rank: 0,
        },
        {
          finalScore: 150,
          name: "player_3",
          points: 300,
          rank: 1,
        },
        {
          finalScore: 400,
          name: "player_0",
          points: 200,
          rank: 2,
        },
        {
          finalScore: -350,
          name: "player_1",
          points: 200,
          rank: 3,
        },
      ])
    })
  })
})
