import { test as base, expect, type Page } from "@playwright/test";

export { expect };

/** The usual fixtures, plus a second member's page in a browser context of its own. */
export const test = base.extend<{ otherPage: Page }>({
  otherPage: async ({ browser, baseURL }, provide) => {
    const context = await browser.newContext({ baseURL });
    await provide(await context.newPage());
    await context.close();
  },
});

export type Account = { username: string; displayName: string; email: string; password: string };

/** Details for a member no other test uses, so tests can run in any order, at once. */
export function newAccount(): Account {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const username = `e2e_${id}`;
  return {
    username,
    displayName: `Tester ${id.slice(-4).toUpperCase()}`,
    email: `${username}@sparks.test`,
    password: `pw-${id}-${Math.random().toString(36).slice(2)}`,
  };
}

/**
 * Signs a new member up through the API, on the page's browser context, so
 * the page is signed in as them. Tests that aren't about signing up start here.
 */
export async function signUp(page: Page, account = newAccount()): Promise<Account> {
  const response = await page.request.post("/api/v1/auth/signup", {
    data: {
      email: account.email,
      username: account.username,
      displayName: account.displayName,
      password: account.password,
    },
  });
  expect(response.ok(), await response.text()).toBe(true);
  return account;
}

/** Shares a spark through the API, for tests about what happens to one. */
export async function shareSpark(page: Page, body: string): Promise<number> {
  const response = await page.request.post("/api/v1/posts", { data: { kind: "regular", body } });
  expect(response.ok(), await response.text()).toBe(true);
  return ((await response.json()) as { id: number }).id;
}
