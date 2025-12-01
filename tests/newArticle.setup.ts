import { test as setup, expect } from "@playwright/test";

setup("cerate new article", async ({ page, request }) => {
  const articleResponse = await request.post(
    "https://conduit-api.bondaracademy.com/api/articles/",
    {
      data: {
        article: {
          title: "This is my like test Mason ",
          description: "This is test about",
          body: "This is test description",
          tagList: [],
        },
      },
    }
  );

  expect(articleResponse.status()).toEqual(201);
  const articleSlug = (await articleResponse.json()).article.slug;
  process.env["SLUGID"] = articleSlug;
});
