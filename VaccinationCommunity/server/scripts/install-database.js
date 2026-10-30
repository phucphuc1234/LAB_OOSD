const { sql, databaseConfig, validateDatabaseConfig } = require("../config/database");
const { executeFile } = require("./sql-files");

async function main() {
    validateDatabaseConfig();
    // Installer targets the separate demo DB, not an arbitrary existing medical DB.
    if (databaseConfig.database !== "VaccinationCommunity_Demo") {
        throw new Error("Lệnh cài/seed tự động chỉ dùng VaccinationCommunity_Demo. Xem docs/database.md nếu cần triển khai database khác.");
    }
    const seedOnly = process.argv.includes("--seed-only");
    const upgrade = process.argv.includes("--upgrade");
    if (seedOnly && upgrade) throw new Error("Chạy db:upgrade và db:seed thành hai lệnh riêng.");
    if (!seedOnly && !upgrade) {
        const master = await new sql.ConnectionPool({ ...databaseConfig, database: "master" }).connect();
        try {
            await master.request().batch("IF DB_ID(N'VaccinationCommunity_Demo') IS NULL EXEC(N'CREATE DATABASE [VaccinationCommunity_Demo]');");
        } finally { await master.close(); }
    }
    const pool = await new sql.ConnectionPool({ ...databaseConfig, database: databaseConfig.database, requestTimeout: 120000 }).connect();
    try {
        if (seedOnly) {
            await pool.request().input("ConfirmDemo", sql.Bit, true).execute("dbo.usp_SeedDemo");
            console.log("Dữ liệu minh họa đã sẵn sàng. Tài khoản mẫu và mật khẩu nằm trong README.md; dữ liệu đã có được giữ nguyên.");
        } else {
            const filename = upgrade ? "VaccinationCommunity_HCM_Upgrade.sql" : "VaccinationCommunity_Demo.sql";
            const count = await executeFile(pool, filename);
            console.log(`Đã ${upgrade ? "nâng cấp" : "cài"} cấu trúc, Stored Procedures, Triggers và Views (${count} batch). Chạy npm run db:seed để thêm dữ liệu minh họa.`);
        }
    } finally { await pool.close(); }
}
main().catch(error => { console.error(`Không hoàn tất thao tác database: ${error.message}`); process.exitCode = 1; });
