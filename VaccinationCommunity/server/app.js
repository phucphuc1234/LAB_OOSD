const express = require("express");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");
const { sql } = require("./config/database");
const { errorResponse } = require("./utils/http");
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
    next();
});
const origins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",").map(x => x.trim()).filter(Boolean);
app.use(cors({ origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    const error = new Error("Nguồn truy cập chưa được cho phép."); error.statusCode = 403; callback(error);
} }));
app.use(express.json({ limit: "256kb" }));
const authAttempts = new Map();
const authWindowMs = 15 * 60 * 1000;
const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of authAttempts) if (entry.until <= now) authAttempts.delete(key);
}, authWindowMs);
cleanup.unref();
app.use(["/api/auth/login", "/api/auth/register"], (req, res, next) => {
    if (process.env.NODE_ENV === "test") return next();
    const key = req.ip, now = Date.now();
    let entry = authAttempts.get(key);
    if (!entry || entry.until <= now) {
        if (authAttempts.size >= 10000) authAttempts.delete(authAttempts.keys().next().value);
        entry = { count: 0, until: now + authWindowMs }; authAttempts.set(key, entry);
    }
    if (++entry.count > 50) {
        res.setHeader("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
        return res.status(429).json({ success: false, message: "Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau." });
    }
    next();
});
app.get("/api/health", async (_req, res) => {
    try {
        const pool = await sql.connect(); await pool.request().query("SELECT 1 AS Healthy");
        res.json({ success: true, service: "Cổng theo dõi tiêm chủng cộng đồng", database: "connected" });
    } catch { res.status(503).json({ success: false, message: "Chưa kết nối được cơ sở dữ liệu." }); }
});
const modules = {
    auth: "authRoutes", citizens: "citizenRoutes", vaccines: "vaccineRoutes", batches: "batchRoutes",
    schedules: "scheduleRoutes", vaccinations: "vaccinationRoutes", contraindications: "contraindicationRoutes",
    history: "historyRoutes", trace: "traceRoutes", notifications: "notificationRoutes", users: "userRoutes", followups: "followupRoutes",
};
for (const [name, file] of Object.entries(modules)) app.use(`/api/${name}`, require(`./routes/${file}`));
app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Không tìm thấy chức năng API." }));
const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(path.join(clientDist, "index.html"))) {
    app.use(express.static(clientDist, { index: false }));
    app.get("/{*path}", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
    app.get("/", (_req, res) => res.json({ success: true, message: "Cổng theo dõi tiêm chủng cộng đồng", development: "Mở giao diện tại http://localhost:5173" }));
}
app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.parse.failed") return res.status(400).json({ success: false, message: "Dữ liệu JSON không hợp lệ." });
    if (error.type === "entity.too.large") return res.status(413).json({ success: false, message: "Nội dung gửi lên vượt giới hạn." });
    return errorResponse(res, error);
});
module.exports = app;
