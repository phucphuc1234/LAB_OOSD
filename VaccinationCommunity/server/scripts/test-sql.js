const { spawnSync } = require("node:child_process");
const path = require("node:path");
const result = spawnSync(process.execPath, ["--test", path.join(__dirname, "../tests/sql-integration.test.js")], {
    stdio: "inherit", env: { ...process.env, RUN_SQL_INTEGRATION: "1", NODE_ENV: "test" },
});
process.exitCode = result.status ?? 1;
