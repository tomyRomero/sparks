import { expect, signUp, test } from "./support";

test("a member writes a haiku, likes it and starts the conversation", async ({ page }) => {
  await signUp(page);
  const lines = ["Tests run in the dark", "a browser clicks through the night", "every check turns green"];

  await page.goto("/create");
  // The radio is visually hidden; members pick the card that labels it.
  const haiku = page.getByRole("radio", { name: "Haiku" });
  await page.locator("label").filter({ has: haiku }).click();
  await expect(haiku).toBeChecked();
  await page.getByLabel("Your haiku").fill(lines.join("\n"));
  await expect(page.getByRole("complementary", { name: "Preview" })).toContainText(lines[1]);
  await page.getByRole("button", { name: "Share spark" }).click();

  await expect(page).toHaveURL(/\/p\/\d+$/);
  const spark = page.getByRole("article").first();
  await expect(spark).toContainText(lines[2]);

  const like = spark.getByRole("button", { name: /^Like/ });
  // The heart fills at once; the reload waits for the API to have it.
  const liked = page.waitForResponse((response) => response.url().endsWith("/like"));
  await like.click();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  expect((await liked).ok()).toBe(true);
  await page.reload();
  await expect(like).toHaveAttribute("aria-pressed", "true");
  await expect(like).toContainText("1");

  await page.getByLabel("Write a comment").fill("Reading this back, I'd keep every line.");
  await page.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(page.getByText("Reading this back, I'd keep every line.")).toBeVisible();
});
