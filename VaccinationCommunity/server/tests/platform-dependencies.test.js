const test = require("node:test");
const assert = require("node:assert/strict");
const lock = require("../../package-lock.json");

test("Windows native optional packages are locked at their parent package's exact version", () => {
    let checked = 0;
    for (const [location, parent] of Object.entries(lock.packages)) {
        for (const [name, version] of Object.entries(parent.optionalDependencies || {})) {
            if (!name.includes("win32")) continue;
            const modules = location.slice(0, location.lastIndexOf("node_modules/") + "node_modules/".length);
            const entry = lock.packages[modules + name];
            assert.ok(entry, `Missing ${name} required by ${location}`);
            assert.equal(entry.version, version, `Native binding version mismatch for ${name}`);
            assert.ok(entry.optional);
            assert.ok(entry.os.includes("win32"));
            assert.match(entry.integrity, /^sha512-/);
            checked++;
        }
    }
    assert.ok(checked >= 11, "Rolldown, Tailwind Oxide, both Lightning CSS versions and Oxlint must cover Windows");
});
