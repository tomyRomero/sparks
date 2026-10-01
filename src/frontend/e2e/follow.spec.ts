import { expect, shareSpark, signUp, test } from "./support";

test("following a member puts their sparks in the Following feed", async ({ page, otherPage }) => {
  const writer = await signUp(otherPage);
  await shareSpark(otherPage, "A spark from someone worth following");
  await signUp(page);

  await page.goto("/?feed=following");
  await expect(page.getByText("Nothing from the people you follow yet")).toBeVisible();

  await page.goto(`/u/${writer.username}`);
  const profile = page.getByRole("region", { name: "Profile" });
  // The button changes at once; leaving the page waits for the API to have the follow.
  const followed = page.waitForResponse((response) => response.url().endsWith(`/users/${writer.username}/follow`));
  await profile.getByRole("button", { name: /^Follow/ }).click();
  expect((await followed).ok()).toBe(true);
  await expect(profile.getByRole("button", { name: /Following|Unfollow/ })).toBeVisible();
  await expect(profile.getByRole("link", { name: /follower/ })).toContainText("1");

  await page.goto("/?feed=following");
  await expect(page.getByRole("article").filter({ hasText: "A spark from someone worth following" })).toBeVisible();
});
