import { expect, test } from "@playwright/test";

test("dashboard loads the production agent foundation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Generate, approve, schedule, publish." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turn one campaign into platform drafts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Publishing connectors" })).toBeVisible();
  await expect(page.getByText("Google Business Profile")).toBeVisible();
});
