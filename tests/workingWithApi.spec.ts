import { test, expect } from "@playwright/test";
import tags from "../test-data/tags.json";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/tags*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tags),
    });
    console.log("Intercepted:", route.request().url());
  });
  page.on("request", (req) => console.log("Outgoing:", req.url()));
  await page.goto("https://conduit.bondaracademy.com/");
});

test("has title", async ({ page }) => {
  // trigger the API call - this very important to make sure the api call to be mocked
  await page.waitForSelector(".tag-list");

  // assert that mocked data appeared - this very important to make sure the api call to be mocked
  for (const tag of tags.tags) {
    await expect(page.locator(".tag-list")).toContainText(tag);
  }
  // Expect a title "to contain" a substring.
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");
});

/**
 * When you run the test, you only navigated to: await page.goto("https://conduit.bondaracademy.com/");
 * 
 * At that moment, the homepage loads CSS/JS/fonts, but it doesn’t call /api/tags immediately.
The /api/tags request is triggered later, when the app executes JavaScript to load the sidebar tags. In Conduit’s demo app, that happens when you open the home feed or interact with the UI.

That’s why:
	•	In browser DevTools (when you clicked around) → you saw the API call.
	•	In Playwright (where you only did goto and immediately asserted title) → the request never fired, so your route handler was never triggered.

  Solution: Add a wait or trigger UI interaction before checking for /api/tags: 
  // Wait for the sidebar to appear (this triggers the tags request)
            await page.waitForSelector(".tag-list");
 */
