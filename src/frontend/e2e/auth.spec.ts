import { expect, newAccount, test } from "./support";

test("a visitor signs up, signs out and signs back in", async ({ page }) => {
  const account = newAccount();
  const accountMenu = page.getByRole("button", { name: `${account.displayName}: account menu` });

  await page.goto("/sign-up");
  await page.getByLabel("Name", { exact: true }).fill(account.displayName);
  await page.getByLabel("Username", { exact: true }).fill(account.username);
  await page.getByLabel("Email", { exact: true }).fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/");
  await expect(accountMenu).toBeVisible();

  await accountMenu.click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  // The open menu hides the rest of the page from assistive tech, so wait
  // for the sign-out itself rather than for the menu button to go.
  await expect(page.getByText("Signed out. See you soon.")).toBeVisible();
  await expect(accountMenu).toBeHidden();

  await page.goto("/sign-in");
  await page.getByLabel("Email or username").fill(account.username);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/");
  await expect(accountMenu).toBeVisible();
});

test("a wrong password keeps the visitor on the sign-in page with a message", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email or username").fill(newAccount().username);
  await page.getByLabel("Password", { exact: true }).fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});
