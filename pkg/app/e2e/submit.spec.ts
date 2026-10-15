import { expect, test } from "@playwright/test"

import type { SubmitMatchResultRequest } from "../src/riichi/riichi-schema"

test("trims player names before submitting scores", async ({ page }) => {
  await page.goto("/t/test_league/submit")

  await page.locator('input[name="name_player_0"]').click()
  await page.locator('input[name="name_player_0"]').fill("  player 1")
  // dismiss the suggestion instead
  // await page.getByTestId("player-name-input-item").getByText("player1").click()
  await page.waitForTimeout(200)
  await page.keyboard.press("Escape")

  await page.locator('input[name="score_player_0"]').click()
  await page.locator('input[name="score_player_0"]').fill("100")
  await page.locator('input[name="name_player_1"]').click()
  await page.locator('input[name="name_player_1"]').fill("player2  ")
  // await page.getByTestId("player-name-input-item").getByText("player2").click()
  await page.waitForTimeout(200)

  await page.keyboard.press("Escape")

  await page.locator('input[name="score_player_1"]').click()
  await page.locator('input[name="score_player_1"]').fill("200")
  await page.locator('input[name="name_player_2"]').click()
  await page.locator('input[name="name_player_2"]').fill(" player3 ")
  // await page.getByTestId("player-name-input-item").getByText("player3").click()
  await page.waitForTimeout(200)

  await page.keyboard.press("Escape")

  await page.locator('input[name="score_player_2"]').click()
  await page.locator('input[name="score_player_2"]').fill("300")
  await page.locator('input[name="name_player_3"]').click()

  // suggestion
  await page.locator('input[name="name_player_3"]').fill("\u00a0player4\u00a0")
  // await page.getByTestId("player-name-input-item").getByText("player4").click()\
  await page.waitForTimeout(200)

  await page.keyboard.press("Escape")
  await page.locator('input[name="score_player_3"]').click()
  await page.locator('input[name="score_player_3"]').fill("400")

  const submission = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/match-standing"
  )
  await page.getByRole("button", { name: "Submit" }).click()
  await page.getByRole("button", { name: "Confirm" }).click()

  const body = (await submission).postDataJSON() as SubmitMatchResultRequest
  expect(body.data.matchResult.map((result) => result.name)).toEqual([
    "player 1",
    "player2",
    "player3",
    "player4",
  ])

  await expect(page).toHaveURL("/t/test_league/matches")
  await expect(
    page.getByTestId("matches-list").locator("li").first()
  ).toContainText("player4")
})

test("rejects submissions with untrimmed player names", async ({ request }) => {
  for (const name of [
    " player1",
    "player1 ",
    " player1 ",
    "\tplayer1\n",
    "\u00a0player1\u00a0",
    " \t ",
  ]) {
    await test.step(JSON.stringify(name), async () => {
      const response = await request.post("/api/match-standing", {
        data: {
          data: {
            leagueId: "test_league",
            matchResult: [
              { name, points: 100 },
              { name: "player2", points: 200 },
              { name: "player3", points: 300 },
              { name: "player4", points: 400 },
            ],
          },
        },
      })

      expect(response.status()).toBe(400)
      expect(await response.json()).toMatchObject({
        status: "invalid-request",
        error: {
          issues: [
            expect.objectContaining({
              path: ["data", "matchResult", 0, "name"],
              message:
                "Player name must not have leading or trailing whitespace",
            }),
          ],
        },
      })
    })
  }
})
