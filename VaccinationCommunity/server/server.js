const { connectDB, sql } = require("./config/database");
const app = require("./app");
const notificationService = require("./services/notificationService");
async function startServer() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET cần ít nhất 32 ký tự. Chạy npm run env:init để tạo cấu hình riêng.");
    await connectDB();
    const port = Number(process.env.PORT || 5000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT không hợp lệ.");
    const server = app.listen(port, () => console.log(`Cổng theo dõi tiêm chủng cộng đồng: http://localhost:${port}`));
    let running = false;
    const remind = async () => {
        if (running) return; running = true;
        try { await notificationService.generateReminders(3); }
        catch { console.error("Chưa tạo được nhắc lịch tiêm; sẽ thử lại ở chu kỳ tiếp theo."); }
        finally { running = false; }
    };
    const timer = process.env.ENABLE_REMINDERS === "false" ? null : setInterval(remind, 3600000);
    timer?.unref(); if (timer) void remind();
    const close = () => {
        if (timer) clearInterval(timer);
        server.close(() => { sql.close().finally(() => process.exit(0)); });
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.once("SIGINT", close); process.once("SIGTERM", close);
    server.on("error", (error) => {
        console.error(error.code === "EADDRINUSE" ? `Cổng ${port} đang được sử dụng. Đổi PORT trong server/.env.` : "Không thể khởi động HTTP server.");
        if (timer) clearInterval(timer);
        sql.close().finally(() => { process.exitCode = 1; });
    });
    return server;
}
if (require.main === module) startServer().catch(error => {
    console.error(error.code === "ELOGIN" ? "SQL Server từ chối đăng nhập. Kiểm tra DB_USER và DB_PASSWORD." : error.message);
    process.exitCode = 1;
});
module.exports = { startServer };
