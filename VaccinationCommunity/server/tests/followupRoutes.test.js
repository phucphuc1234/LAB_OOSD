const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const authRepository = require("../repositories/authRepository");
const service = require("../services/followupService");
const { generateToken } = require("../utils/jwt");

test("HTTP routes enforce authentication and citizen/staff roles before follow-up operations", async (t) => {
    const oldSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = "followup-route-test-secret-with-at-least-32-characters";
    const originals = { find: authRepository.findAuthenticatedAccount, listMine: service.listMine,
        listAll: service.listAll, review: service.review, submit: service.submit };
    const accounts = new Map([
        [1, { MaTaiKhoan: 1, TenDangNhap: "citizen", TenVaiTro: "Người dân", MaVaiTro: 1 }],
        [2, { MaTaiKhoan: 2, TenDangNhap: "staff", TenVaiTro: "Nhân viên", MaVaiTro: 2 }],
        [3, { MaTaiKhoan: 3, TenDangNhap: "admin", TenVaiTro: "Quản trị viên", MaVaiTro: 3 }],
    ].map(([id, row]) => [id, { ...row, MatKhau: "fixture-hash", TrangThai: 1, VaiTroHoatDong: 1 }]));
    const calls = [];
    authRepository.findAuthenticatedAccount = async (id) => accounts.get(id);
    service.listMine = async (user) => { calls.push(["mine", user.maTaiKhoan]); return { items: [], total: 0 }; };
    service.listAll = async (user) => { calls.push(["list", user.maTaiKhoan]); return { items: [], total: 0 }; };
    service.review = async () => { calls.push(["review"]); return {}; };
    service.submit = async () => { calls.push(["submit"]); return {}; };
    const app = express();
    app.use(express.json());
    app.use("/api/followups", require("../routes/followupRoutes"));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(async () => {
        await new Promise((resolve) => server.close(resolve));
        authRepository.findAuthenticatedAccount = originals.find;
        for (const name of ["listMine", "listAll", "review", "submit"]) service[name] = originals[name];
        if (oldSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = oldSecret;
    });
    const base = `http://127.0.0.1:${server.address().port}/api/followups`;
    const request = (path, accountId, method = "GET") => fetch(base + path, {
        method,
        headers: { ...(accountId ? { Authorization: `Bearer ${generateToken(accounts.get(accountId))}` } : {}),
            "Content-Type": "application/json" },
        ...(method === "GET" ? {} : { body: JSON.stringify({}) }),
    });
    assert.equal((await request("/mine")).status, 401);
    assert.equal((await request("/", 1)).status, 403);
    assert.equal((await request("/1/review", 1, "PATCH")).status, 403);
    assert.equal((await request("/mine", 2, "POST")).status, 403);
    assert.equal(calls.length, 0);
    const mine = await request("/mine", 1);
    assert.equal(mine.status, 200); assert.equal((await mine.json()).success, true);
    assert.equal((await request("/", 2)).status, 200);
    assert.equal((await request("/", 3)).status, 200);
    assert.deepEqual(calls, [["mine", 1], ["list", 2], ["list", 3]]);
});
