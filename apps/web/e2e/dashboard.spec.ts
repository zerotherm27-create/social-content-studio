import { expect, test } from "@playwright/test";

test("agent workspace loads and moves between core views", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Your content/ })).toBeVisible();

  await page.getByRole("button", { name: "Ideas" }).first().click();
  await expect(page.getByRole("heading", { name: "Ideas worth making" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Meet the summer flight" }).first()).toBeVisible();

  await page.getByRole("button", { name: "Create", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Turn one source into a campaign" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Shape the campaign before Orbit writes it." })).toBeVisible();
});
