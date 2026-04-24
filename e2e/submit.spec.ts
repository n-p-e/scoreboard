import { expect, test } from "@playwright/test"

test("test", async ({ page }) => {
  await page.goto("/t/test_league/submit")

  await page.locator('input[name="name_player_0"]').click()
  await page.locator('input[name="name_player_0"]').fill("player1")
  // dismiss the suggestion instead
  // await page.getByTestId("player-name-input-item").getByText("player1").click()
  await page.waitForTimeout(200)
  await page.keyboard.press("Escape")

  await page.locator('input[name="score_player_0"]').click()
  await page.locator('input[name="score_player_0"]').fill("100")
  await page.locator('input[name="name_player_1"]').click()
  await page.locator('input[name="name_player_1"]').fill("player2")
  // await page.getByTestId("player-name-input-item").getByText("player2").click()
  await page.waitForTimeout(200)

  await page.keyboard.press("Escape")

  await page.locator('input[name="score_player_1"]').click()
  await page.locator('input[name="score_player_1"]').fill("200")
  await page.locator('input[name="name_player_2"]').click()
  await page.locator('input[name="name_player_2"]').fill("player3")
  // await page.getByTestId("player-name-input-item").getByText("player3").click()
  await page.waitForTimeout(200)

  await page.keyboard.press("Escape")

  await page.locator('input[name="score_player_2"]').click()
  await page.locator('input[name="score_player_2"]').fill("300")
  await page.locator('input[name="name_player_3"]').click()

  // suggestion
  await page.locator('input[name="name_player_3"]').fill("player4")
  // await page.getByTestId("player-name-input-item").getByText("player4").click()\
  await page.waitForTimeout(200)

  await page.keyboard.press("Escape")
  await page.locator('input[name="score_player_3"]').click()
  await page.locator('input[name="score_player_3"]').fill("400")

  await page.getByRole("button", { name: "Submit" }).click()
  await page.getByRole("button", { name: "Confirm" }).click()

  await page.getByRole("link", { name: "Matches" }).click()

  expect(
    await page.getByTestId("matches-list").locator("li").first()
  ).toContainText([/player4/])
})
