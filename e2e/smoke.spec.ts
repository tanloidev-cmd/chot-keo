import { expect, test } from "@playwright/test";

test("privacy page renders", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Chính sách riêng tư" })).toBeVisible();
});

test("terms page renders", async ({ page }) => {
  await page.goto("/terms");
  await expect(page.getByRole("heading", { name: "Điều khoản sử dụng" })).toBeVisible();
});
