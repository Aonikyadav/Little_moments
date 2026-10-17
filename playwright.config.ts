import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  use: {
    baseURL: process.env.STUDIO_TEST_URL || "http://localhost:3000",
    viewport: { width: 393, height: 852 },
    permissions: ["camera"],
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
      ],
    },
  },
  workers: 1,
  reporter: "list",
})
