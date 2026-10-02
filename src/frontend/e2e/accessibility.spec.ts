import AxeBuilder from "@axe-core/playwright";
import type { BrowserContext, Page } from "@playwright/test";
import { test as base, expect, shareSpark, signUp } from "./support";

// WCAG 2.2 AA, plus axe's best practices.
const rules = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

type Member = {
  username: string;
  spark: number;
  storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
};

/** One member per worker, with a spark to open, so each page needn't sign up again. */
const test = base.extend<object, { member: Member }>({
  member: [
    async ({ browser }, provide, workerInfo) => {
      const context = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      const page = await context.newPage();
      const { username } = await signUp(page);
      const spark = await shareSpark(page, "Checking every page with axe, one spark at a time.");
      // Its title and logline match the guest search, on the card that stays dark in either theme.
      await shareSpark(
        page,
        "Title: The Last Spark\n\nA projectionist finds a reel that plays a different film every night.",
        "movieScript",
      );
      await provide({ username, spark, storageState: await context.storageState() });
      await context.close();
    },
    { scope: "worker" },
  ],
});

const guestPages: Record<string, string> = {
  home: "/",
  "sign in": "/sign-in",
  "sign up": "/sign-up",
  search: "/search?q=spark",
};

const memberPages: Record<string, (member: Member) => string> = {
  home: () => "/",
  following: () => "/?feed=following",
  "new spark": () => "/create",
  spark: ({ spark }) => `/p/${spark}`,
  activity: () => "/activity",
  messages: () => "/messages",
  profile: ({ username }) => `/u/${username}`,
  followers: ({ username }) => `/u/${username}/followers`,
  settings: () => "/settings/profile",
};

async function expectNoViolations(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const { violations } = await new AxeBuilder({ page }).withTags(rules).analyze();
  const found = violations.map(({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(" ")).join(", ")}`);
  expect(found, `axe on ${path}`).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`in ${colorScheme}`, () => {
    test.use({ colorScheme });

    for (const [name, path] of Object.entries(guestPages)) {
      test(`a guest's ${name} page passes axe`, async ({ page }) => {
        await expectNoViolations(page, path);
      });
    }

    test.describe("signed in", () => {
      test.use({ storageState: async ({ member }, provide) => provide(member.storageState) });

      for (const [name, path] of Object.entries(memberPages)) {
        test(`a member's ${name} page passes axe`, async ({ page, member }) => {
          await expectNoViolations(page, path(member));
        });
      }
    });
  });
}
