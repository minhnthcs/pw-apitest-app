import { test as setup, request, chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

setup("authentication", async () => {
  const authDir = path.resolve(__dirname, "../.auth");
  const userFile = path.join(authDir, "user.json");
  const tokenFile = path.join(authDir, "token.json");

  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const apiContext = await request.newContext();
  const response = await apiContext.post(
    "https://conduit-api.bondaracademy.com/api/users/login",
    {
      data: {
        user: { email: "mason@test.com", password: "Abcxyz@123" },
      },
    }
  );

  const responseBody = await response.json();
  const accessToken = responseBody.user.token;

  // Save token separately
  fs.writeFileSync(
    path.join(authDir, "token.json"),
    JSON.stringify({ token: accessToken }, null, 2)
  );
  // Store authenticated browser state
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://conduit.bondaracademy.com/");
  await page.evaluate(
    (token) => localStorage.setItem("jwtToken", token),
    accessToken
  );

  await context.storageState({ path: userFile });
  await browser.close();
  await apiContext.dispose();

  console.log("✅ Authentication state and token saved.");
});
