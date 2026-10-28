// Opt-in, real SQL Server tests. Creates and drops ONLY a uniquely named test DB.
const test = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const { sql, databaseConfig, validateDatabaseConfig } = require("../config/database");
const { executeFile } = require("../scripts/sql-files");

test("real SQL Server: install, seed, inventory concurrency, ownership and post-vaccination workflow", {
    skip: process.env.RUN_SQL_INTEGRATION !== "1", timeout: 180000,
}, async t => {
    validateDatabaseConfig();
    process.env.JWT_SECRET ||= "isolated-integration-test-secret-not-for-production-123456";
    const database = `VaccinationCommunity_Test_${randomBytes(6).toString("hex")}`;
    const master = await new sql.ConnectionPool({ ...databaseConfig, database: "master", requestTimeout: 120000 }).connect();
    let pool, server, created = false;
    try {
        await master.request().batch(`CREATE DATABASE [${database}];`); created = true;
        pool = await sql.connect({ ...databaseConfig, database, requestTimeout: 120000 });
        await executeFile(pool, "VaccinationCommunity_Demo.sql", { databaseName: database });
        await pool.request().input("ConfirmDemo", sql.Bit, true).execute("dbo.usp_SeedDemo");
        await t.test("demo data is consistent and seeding is idempotent", async () => {
            const before = await pool.request().query("SELECT COUNT(*) n FROM dbo.TAIKHOAN; SELECT COUNT(*) n FROM dbo.MUITIEM; SELECT COUNT(*) n FROM dbo.THEODOISAUTIEM;");
            assert.deepEqual(before.recordsets.map(rows => rows[0].n), [213, 300, 90]);
            await pool.request().input("ConfirmDemo", sql.Bit, true).execute("dbo.usp_SeedDemo");
            const after = await pool.request().query("SELECT COUNT(*) n FROM dbo.TAIKHOAN;");
            assert.equal(after.recordset[0].n, 213);
        });
        const identities = (await pool.request().query(`SELECT t.MaTaiKhoan,t.TenDangNhap,n.MaNguoiDan
            FROM dbo.TAIKHOAN t LEFT JOIN dbo.NGUOIDAN n ON n.MaTaiKhoan=t.MaTaiKhoan
            WHERE t.TenDangNhap IN('nd101','nd102','nv01');`)).recordset;
        const citizens = identities.filter(row => row.MaNguoiDan);
        const staff = identities.find(row => row.TenDangNhap === "nv01");
        const fixture = await pool.request().query(`
            INSERT dbo.VACCINE(TenVaccine,SoMuiKhuyenNghi,KhoangCachMui) VALUES(N'Integration fixture',5,0);
            DECLARE @V int=CONVERT(int,SCOPE_IDENTITY());
            INSERT dbo.LOVACCINE(MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon)
            VALUES('TEST-LAST-DOSE',@V,DATEADD(day,-30,CAST(SYSUTCDATETIME() AS date)),DATEADD(day,365,CAST(SYSUTCDATETIME() AS date)),1,1);
            SELECT @V AS vaccineId,CONVERT(int,SCOPE_IDENTITY()) AS batchId;`);
        const { vaccineId, batchId } = fixture.recordset[0];
        const booking = async citizen => pool.request()
            .input("MaNguoiDan", sql.Int, citizen.MaNguoiDan).input("MaVaccine", sql.Int, vaccineId)
            .input("MuiSo", sql.Int, 1).input("NgayDuKien", sql.DateTime2, new Date(Date.now()+86400000))
            .input("TrangThai", sql.NVarChar(50), "Đã xác nhận").input("MaNhanVienTao", sql.Int, staff.MaTaiKhoan)
            .execute("dbo.usp_LuuLichTiem");
        let winner, schedule;
        await t.test("two concurrent bookings cannot both reserve the final dose", async () => {
            const results = await Promise.allSettled(citizens.map(booking));
            assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
            winner = citizens[results.findIndex(r => r.status === "fulfilled")];
            schedule = results.find(r => r.status === "fulfilled").value.recordset[0];
            const stock = (await pool.request().input("Id", sql.Int, batchId).query("SELECT SoLuongCon,SoLuongDatTruoc FROM dbo.LOVACCINE WHERE MaLo=@Id")).recordset[0];
            assert.deepEqual(stock, { SoLuongCon: 1, SoLuongDatTruoc: 1 });
        });
        const changeStatus = actor => pool.request().input("MaLichTiem", sql.Int, schedule.MaLichTiem)
            .input("TrangThai", sql.NVarChar(50), "Đã hủy").input("MaTaiKhoan", sql.Int, actor.MaTaiKhoan).execute("dbo.usp_DoiTrangThaiLichTiem");
        await t.test("another citizen cannot cancel a reservation; its owner releases it", async () => {
            await assert.rejects(changeStatus(citizens.find(c => c !== winner)));
            await changeStatus(winner);
            const stock = (await pool.request().input("Id", sql.Int, batchId).query("SELECT SoLuongCon,SoLuongDatTruoc FROM dbo.LOVACCINE WHERE MaLo=@Id")).recordset[0];
            assert.deepEqual(stock, { SoLuongCon: 1, SoLuongDatTruoc: 0 });
        });
        const vaccinate = () => pool.request().input("MaNguoiDan", sql.Int, winner.MaNguoiDan)
            .input("MaVaccine", sql.Int, vaccineId).input("MaLo", sql.Int, batchId)
            .input("MuiSo", sql.Int, 1).input("MaNhanVien", sql.Int, staff.MaTaiKhoan).execute("dbo.usp_GhiNhanMuiTiem");
        let vaccinationId;
        await t.test("recording the same administration twice consumes stock only once", async () => {
            const first = await vaccinate(), second = await vaccinate();
            vaccinationId = first.recordset[0].MaMuiTiem;
            assert.equal(second.recordset[0].MaMuiTiem, vaccinationId);
            const stock = (await pool.request().input("Id", sql.Int, batchId).query("SELECT SoLuongCon,SoLuongDatTruoc FROM dbo.LOVACCINE WHERE MaLo=@Id")).recordset[0];
            assert.deepEqual(stock, { SoLuongCon: 0, SoLuongDatTruoc: 0 });
        });
        const app = require("../app");
        server = await new Promise(resolve => { const listener=app.listen(0,"127.0.0.1",()=>resolve(listener)); });
        const base = `http://127.0.0.1:${server.address().port}/api`;
        const call = async (url, body, token, method = "POST") => {
            const response = await fetch(base+url, { method, headers: { "Content-Type":"application/json", ...(token ? {Authorization:`Bearer ${token}`} : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
            return { status: response.status, body: await response.json() };
        };
        const login = async name => {
            const response = await call("/auth/login", { tenDangNhap:name, matKhau:"Demo@123456" });
            assert.equal(response.status, 200); assert.ok(response.body.token); return response.body.token;
        };
        await t.test("real HTTP reporting derives red-flag priority, checks ownership and detects stale staff updates", async () => {
            const token = await login(winner.TenDangNhap), staffToken=await login("nv01");
            const otherToken = await login(citizens.find(c => c !== winner).TenDangNhap);
            const symptom = (await pool.request().query("SELECT TOP(1) MaTrieuChung FROM dbo.DANHMUCTRIEUCHUNG WHERE LaDauHieuCanhBao=1 AND DangHoatDong=1")).recordset[0].MaTrieuChung;
            const blocked = await call("/followups/mine", { vaccinationId, symptoms:[symptom], severity:"none" }, token);
            assert.equal(blocked.status, 400);
            const submitted = await call("/followups/mine", { vaccinationId, symptoms:[symptom], description:"Triệu chứng thử nghiệm phần mềm, không phải hồ sơ thật." }, token);
            assert.equal(submitted.status, 201);
            assert.equal(submitted.body.data.severity, "emergency");
            assert.equal(submitted.body.data.status, "escalated");
            assert.match(submitted.body.data.advice.message, /115/);
            const id = submitted.body.data.id;
            assert.equal((await call(`/followups/${id}`, undefined, otherToken, "GET")).status, 404);
            const review = { status:"monitoring", staffAdvice:"Đã liên hệ và xử lý theo quy trình thử nghiệm.", expectedRevision:1, nextFollowupAt:new Date(Date.now()+86400000).toISOString() };
            assert.equal((await call(`/followups/${id}/review`, review, staffToken,"PATCH")).status, 200);
            assert.equal((await call(`/followups/${id}/review`, review, staffToken,"PATCH")).status, 409);
            const row=(await pool.request().input("Id",sql.Int,id).query("SELECT LanCapNhat FROM dbo.THEODOISAUTIEM WHERE MaTheoDoi=@Id; SELECT COUNT(*) n FROM dbo.THEODOI_LICHSU WHERE MaTheoDoi=@Id;")).recordsets;
            assert.equal(row[0][0].LanCapNhat,2); assert.equal(row[1][0].n,2);
            await assert.rejects(pool.request().input("Id",sql.Int,id).query("DELETE FROM dbo.THEODOI_LICHSU WHERE MaTheoDoi=@Id"));
        });
        await t.test("reminders are idempotent and immutable medical records cannot be deleted", async () => {
            await pool.request().input("DaysAhead",sql.Int,3).execute("dbo.usp_TaoNhacLich");
            const again=await pool.request().input("DaysAhead",sql.Int,3).execute("dbo.usp_TaoNhacLich");
            assert.equal(again.recordset[0].created,0);
            await assert.rejects(pool.request().input("Id",sql.Int,vaccinationId).query("DELETE FROM dbo.MUITIEM WHERE MaMuiTiem=@Id"));
        });
    } finally {
        if (server) await new Promise(resolve=>server.close(resolve));
        if (pool) await sql.close();
        if (created) await master.request().batch(`ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${database}];`);
        await master.close();
    }
});
