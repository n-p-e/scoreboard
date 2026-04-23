import { describe, expect, test } from "vitest"
import { orderStandingsByRawPoints } from "./riichi-store"
import { calculateMatchStandings } from "./scores"

describe("riichi-store", () => {
  test("orders adjusted standings by raw points, not adjusted final score", async () => {
    const standings = orderStandingsByRawPoints(
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
  // test("leaderboard", async () => {
  //   console.log(
  //     await queryLeaderboard({
  //       leagueId: "test_league",
  //     })
  //   )
  // })

  // test("listPlayers", async () => {
  //   await listPlayers({ limit: 10 })
  // })
})
