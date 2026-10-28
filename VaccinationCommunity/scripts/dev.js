const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.join(__dirname, "..");
const vite = path.join(path.dirname(require.resolve("vite/package.json", { paths: [path.join(root, "client")] })), "bin/vite.js");
const children = [
    spawn(process.execPath, ["--watch", "server.js"], { cwd: path.join(root, "server"), stdio: "inherit", detached: process.platform !== "win32" }),
    spawn(process.execPath, [vite], { cwd: path.join(root, "client"), stdio: "inherit", detached: process.platform !== "win32" }),
];
let closing = false;
function stop(code = 0) {
    if (closing) return;
    closing = true;
    for (const child of children) {
        if (!child.pid) continue;
        if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        else { try { process.kill(-child.pid, "SIGTERM"); } catch { /* already stopped */ } }
    }
    process.exitCode = code;
}
for (const child of children) {
    child.on("error", () => stop(1));
    child.on("exit", (code) => stop(code || 0));
}
process.once("SIGINT", () => stop());
process.once("SIGTERM", () => stop());
