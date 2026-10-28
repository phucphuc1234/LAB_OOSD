const test = require("node:test");
const assert = require("node:assert/strict");
const { batches, executeFile } = require("../scripts/sql-files");

test("SQL installer never relies on pooled USE context and leaves CREATE routine first in its batch", async () => {
    const sent = [];
    const pool = { request: () => ({ batch: async (value) => sent.push(value) }) };
    await executeFile(pool, "VaccinationCommunity_Demo.sql");
    assert.ok(sent.length > 10);
    assert.ok(sent.some(value => /CREATE OR ALTER PROCEDURE/i.test(value)));
    assert.ok(sent.every(value => !/^\s*USE\s+/i.test(value)));
    assert.ok(sent.every(value => !/CREATE DATABASE/i.test(value)));
    assert.ok(sent.every(value => !/^\s*GO\s*$/mi.test(value)));
    assert.ok(sent.every(value => !/^EXEC\s+dbo\.usp_SeedDemo/m.test(value)), "install must not silently seed accounts");
});

test("database installation stops at the first failed batch with its source location", async () => {
    let calls = 0;
    const pool = { request: () => ({ batch: async () => { if (++calls === 2) throw new Error("permission denied"); } }) };
    await assert.rejects(executeFile(pool, "VaccinationCommunity_Demo.sql"), /VaccinationCommunity_Demo.sql, batch \d+: permission denied/);
    assert.equal(calls, 2);
});

test("GO splitting preserves SQL parameters and empty batches are not executed", () => {
    assert.deepEqual(batches("\uFEFFSELECT @Id;\nGO\n\nGO -- next\nSELECT N'không đổi';\nGO\n"), ["SELECT @Id;", "SELECT N'không đổi';"]);
});
