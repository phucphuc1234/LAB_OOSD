const path = require("node:path");
const sql = require("mssql");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const [server, embeddedInstance] = (process.env.DB_SERVER || "localhost").split("\\");
const instanceName = process.env.DB_INSTANCE || embeddedInstance;
const databaseConfig = {
    user: process.env.DB_USER || "sa", password: process.env.DB_PASSWORD || "", server,
    database: process.env.DB_DATABASE || "VaccinationCommunity_Demo",
    ...(instanceName && !process.env.DB_PORT ? {} : { port: Number(process.env.DB_PORT || 1433) }),
    connectionTimeout: 15000, requestTimeout: 30000,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
        enableArithAbort: true,
        ...(instanceName && !process.env.DB_PORT ? { instanceName } : {}),
    },
};
function validateDatabaseConfig() {
    if (!databaseConfig.password) throw new Error("Chưa có DB_PASSWORD. Chạy npm run env:init và điền thông tin SQL Server vào server/.env.");
    if (!/^[A-Za-z][A-Za-z0-9_]{0,127}$/.test(databaseConfig.database)) throw new Error("DB_DATABASE chỉ dùng chữ, số và dấu gạch dưới, bắt đầu bằng chữ.");
    if (databaseConfig.port && (!Number.isInteger(databaseConfig.port) || databaseConfig.port < 1 || databaseConfig.port > 65535)) throw new Error("DB_PORT không hợp lệ.");
}
async function connectDB() { validateDatabaseConfig(); return sql.connect(databaseConfig); }
module.exports = { sql, connectDB, databaseConfig, validateDatabaseConfig };
