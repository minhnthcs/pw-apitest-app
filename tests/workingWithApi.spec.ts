import { test, expect } from "@playwright/test";
import fs from "fs";
const { token } = JSON.parse(fs.readFileSync("./.auth/token.json", "utf-8"));

import tags from "../test-data/tags.json";

test.beforeEach(async ({ page }) => {
  // await page.route("**/api/tags*", async (route) => {
  //   await route.fulfill({
  //     status: 200,
  //     contentType: "application/json",
  //     body: JSON.stringify(tags),
  //   });
  //   console.log("Intercepted:", route.request().url());
  // });

  await page.goto("https://conduit.bondaracademy.com/");
});

test("has title", async ({ page }) => {
  await page.route("**/api/articles*", async (route) => {
    const response = await route.fetch();
    const responseBody = await response.json();
    responseBody.articles[0].title = "This is a MOCK test title";
    responseBody.articles[0].description = "This is a MOCK test description";

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });

  await page.getByText("Global Feed").click();

  await page.waitForTimeout(1000);
  // trigger the API call - this very important to make sure the api call to be mocked
  await page.waitForSelector(".tag-list");

  // assert that mocked data appeared - this very important to make sure the api call to be mocked
  // for (const tag of tags.tags) {
  //   await expect(page.locator(".tag-list")).toContainText(tag);
  // }
  // Expect a title "to contain" a substring.
  await expect(page.locator(".navbar-brand")).toHaveText("conduit");

  // this is having a bug of playwright, need a assertion to modify the api successfully
  await expect(page.locator("app-article-list h1").first()).toContainText(
    "This is a MOCK test title"
  );
  await expect(page.locator("app-article-list p").first()).toContainText(
    "This is a MOCK test description"
  );
});

test("delete articles", async ({ request, page }) => {
  console.log("token", token);

  const articleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "This is my test Mason ",
          description: "This is test about",
          body: "This is test description",
          tagList: [],
        },
      },
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );

  expect(articleResponse.status()).toEqual(201);
  const articleSlug = (await articleResponse.json()).article.slug;

  await page.waitForTimeout(1000);
  await page.getByText("Global Feed").click();
  expect(await page.locator("app-article-list h1").first()).toContainText(
    "This is my test Mason"
  );

  const deleteResponse = await request.delete(
    `https://conduit-api.bondaracademy.com/api/articles/${articleSlug}`,
    {
      headers: {
        Authorization: `Token ${token}`,
      },
    }
  );
  expect(deleteResponse.status()).toEqual(204);
  await page.getByText("Global Feed").click();
  expect(await page.locator("app-article-list h1").first()).not.toContainText(
    "This is my test Mason"
  );
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
