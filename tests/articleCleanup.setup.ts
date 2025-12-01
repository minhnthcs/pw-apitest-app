import { test as setup, expect } from "@playwright/test";

setup("delete article", async ({ page, request }) => {
  const deleteResponse = await request.delete(
    `https://conduit-api.bondaracademy.com/api/articles/${process.env.SLUGID}`
  );
  expect(deleteResponse.status()).toEqual(204);
});
