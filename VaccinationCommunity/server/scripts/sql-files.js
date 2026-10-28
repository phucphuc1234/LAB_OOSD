const fs = require("node:fs");
const path = require("node:path");

const databaseDirectory = path.join(__dirname, "../../database");
function batches(source) {
    // Project scripts use standalone GO separators, never GO inside string literals.
    return source.replace(/^\uFEFF/, "").split(/^\s*GO\s*(?:--[^\r\n]*)?$/gmi).map(x => x.trim()).filter(Boolean);
}
async function executeFile(pool, filename, { databaseName } = {}) {
    let source = fs.readFileSync(path.join(databaseDirectory, filename), "utf8");
    if (databaseName) {
        if (!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(databaseName)) throw new Error("Tên database không hợp lệ.");
        source = source.replaceAll("VaccinationCommunity_Demo", databaseName);
    }
    const sections = batches(source);
    let executed = 0;
    for (let index = 0; index < sections.length; index++) {
        // A pool may use a different physical connection for each request.
        // Never depend on a previous USE batch to select the application DB.
        const statement = sections[index].replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\r\n]*/g, "").trim();
        if (/^USE\s+/i.test(statement) || (/^IF\s+DB_ID\(/i.test(statement) && /CREATE DATABASE/i.test(statement))) continue;
        try { await pool.request().batch(sections[index]); }
        catch (error) {
            error.message = `${filename}, batch ${index + 1}: ${error.message}`;
            throw error;
        }
        executed++;
    }
    return executed;
}
module.exports = { batches, executeFile, databaseDirectory };
