const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const target = path.join(__dirname, "../.env");
if (fs.existsSync(target)) {
    console.log("server/.env đã tồn tại; giữ nguyên cấu hình của bạn.");
} else {
    const template = fs.readFileSync(path.join(__dirname, "../.env.example"), "utf8");
    fs.writeFileSync(target, template.replace(/^JWT_SECRET=$/m, `JWT_SECRET=${crypto.randomBytes(48).toString("base64url")}`), { mode: 0o600 });
    console.log("Đã tạo server/.env và JWT secret riêng. Điền DB_SERVER, DB_USER, DB_PASSWORD để kết nối SQL Server.");
}
