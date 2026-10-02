import { expect, signUp, test } from "./support";

test("a message arrives in the other member's open chat without a reload", async ({ page, otherPage }) => {
  const sender = await signUp(page);
  const recipient = await signUp(otherPage);

  await page.goto(`/u/${recipient.username}`);
  await page.getByRole("region", { name: "Profile" }).getByRole("button", { name: "Message", exact: true }).click();
  await expect(page).toHaveURL(/\/messages\/\d+$/);

  await otherPage.goto(new URL(page.url()).pathname);
  await expect(otherPage.getByRole("textbox", { name: `Message ${sender.displayName}` })).toBeVisible();

  await page.getByRole("textbox", { name: `Message ${recipient.displayName}` }).fill("Hello from the end-to-end suite");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(otherPage.getByRole("list", { name: sender.displayName })).toContainText(
    "Hello from the end-to-end suite",
  );
});
