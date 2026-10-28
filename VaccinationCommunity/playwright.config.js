const { defineConfig } = require("@playwright/test");
const fs = require("node:fs");
module.exports = defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: false,
    workers: 1,
    timeout: 30000,
    expect: { timeout: 7000 },
    reporter: "list",
    use: {
        baseURL: "http://127.0.0.1:5173",
        timezoneId: "Asia/Ho_Chi_Minh",
        viewport: { width: 1440, height: 1000 },
        trace: "retain-on-failure",
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
            : fs.existsSync("/usr/bin/chromium") ? { executablePath: "/usr/bin/chromium" } : {},
    },
    webServer: {
        command: "npm run dev --workspace client -- --host 127.0.0.1",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
});
