// SQL Server owns report submission, review concurrency and immutable audit history.
// Dependencies are injectable so contract tests do not require a running SQL Server.
function createFollowupRepository({ sql, connect }) {
    const request = async () => (await connect()).request();
    const first = (result) => result.recordset?.[0] || null;

    async function findActor(accountId) {
        const req = await request();
        return first(await req.input("AccountId", sql.Int, accountId).query(`
            SELECT tk.MaTaiKhoan, tk.TrangThai, vt.TenVaiTro
            FROM dbo.TAIKHOAN tk JOIN dbo.VAITRO vt ON vt.MaVaiTro=tk.MaVaiTro
            WHERE tk.MaTaiKhoan=@AccountId AND vt.TrangThai=1`));
    }

    async function listSymptoms() {
        const req = await request();
        return (await req.query(`SELECT MaTrieuChung,TenTrieuChung,LaDauHieuCanhBao
            FROM dbo.DANHMUCTRIEUCHUNG WHERE DangHoatDong=1
            ORDER BY LaDauHieuCanhBao DESC,TenTrieuChung`)).recordset;
    }

    async function findVaccination(vaccinationId, accountId) {
        const req = await request();
        return first(await req.input("VaccinationId", sql.Int, vaccinationId)
            .input("AccountId", sql.Int, accountId).query(`
            SELECT mt.*,v.TenVaccine,nd.MaTaiKhoan AS MaTaiKhoanNguoiDan
            FROM dbo.MUITIEM mt JOIN dbo.NGUOIDAN nd ON nd.MaNguoiDan=mt.MaNguoiDan
            JOIN dbo.VACCINE v ON v.MaVaccine=mt.MaVaccine
            WHERE mt.MaMuiTiem=@VaccinationId AND nd.MaTaiKhoan=@AccountId`));
    }

    async function listVaccinations(accountId) {
        const req = await request();
        return (await req.input("AccountId", sql.Int, accountId).query(`
            SELECT mt.MaMuiTiem,mt.NgayTiem,mt.MuiSo,mt.CoSoTiem,mt.MaCoSoTiem,v.TenVaccine
            FROM dbo.MUITIEM mt JOIN dbo.NGUOIDAN nd ON nd.MaNguoiDan=mt.MaNguoiDan
            JOIN dbo.VACCINE v ON v.MaVaccine=mt.MaVaccine
            WHERE nd.MaTaiKhoan=@AccountId ORDER BY mt.NgayTiem DESC,mt.MaMuiTiem DESC`)).recordset;
    }

    async function listReports(filters, accountId = null, staffAccountId = null) {
        const req = await request();
        req.input("AccountId", sql.Int, accountId)
            .input("StaffAccountId", sql.Int, staffAccountId)
            .input("Status", sql.VarChar(16), filters.status || null)
            .input("Severity", sql.VarChar(16), filters.severity || null)
            .input("VaccinationId", sql.Int, filters.vaccinationId || null)
            .input("Search", sql.NVarChar(260), filters.search
                ? `%${filters.search.replace(/[~%_\[]/g, "~$&")}%` : null)
            .input("Offset", sql.Int, (filters.page - 1) * filters.limit)
            .input("Limit", sql.Int, filters.limit);
        const where = `WHERE ((@AccountId IS NOT NULL AND MaTaiKhoanNguoiDan=@AccountId)
            OR (@AccountId IS NULL AND EXISTS(SELECT 1 FROM dbo.MUITIEM scopeMt
                WHERE scopeMt.MaMuiTiem=td.MaMuiTiem
                  AND dbo.fn_CoSoDuocPhep(@StaffAccountId,scopeMt.MaCoSoTiem)=1)))
            AND (@Status IS NULL OR TrangThai=@Status)
            AND (@Severity IS NULL OR MucDo=@Severity)
            AND (@VaccinationId IS NULL OR MaMuiTiem=@VaccinationId)
            AND (@Search IS NULL OR HoTen LIKE @Search ESCAPE N'~'
                OR TenVaccine LIKE @Search ESCAPE N'~')`;
        const result = await req.query(`
            SELECT COUNT_BIG(*) AS Total FROM dbo.vw_TheoDoiSauTiemChiTiet td ${where};
            SELECT * FROM dbo.vw_TheoDoiSauTiemChiTiet td ${where}
            ORDER BY CASE WHEN TrangThai='resolved' THEN 1 ELSE 0 END,
                CoDauHieuCanhBao DESC,
                CASE MucDo WHEN 'emergency' THEN 0 WHEN 'severe' THEN 1
                    WHEN 'moderate' THEN 2 WHEN 'mild' THEN 3 ELSE 4 END,
                ThoiDiemBaoCao DESC,MaTheoDoi DESC
            OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;`);
        return { total: Number(result.recordsets?.[0]?.[0]?.Total || 0),
            items: result.recordsets?.[1] || [] };
    }

    async function findReport(reportId, accountId = null, staffAccountId = null) {
        const req = await request();
        return first(await req.input("ReportId", sql.Int, reportId)
            .input("AccountId", sql.Int, accountId)
            .input("StaffAccountId", sql.Int, staffAccountId).query(`
            SELECT * FROM dbo.vw_TheoDoiSauTiemChiTiet td
            WHERE MaTheoDoi=@ReportId
              AND ((@AccountId IS NOT NULL AND MaTaiKhoanNguoiDan=@AccountId)
                OR (@AccountId IS NULL AND EXISTS(SELECT 1 FROM dbo.MUITIEM scopeMt
                    WHERE scopeMt.MaMuiTiem=td.MaMuiTiem
                      AND dbo.fn_CoSoDuocPhep(@StaffAccountId,scopeMt.MaCoSoTiem)=1)))`));
    }

    async function reportSymptoms(reportIds) {
        if (!reportIds.length) return [];
        const req = await request();
        const placeholders = reportIds.map((id, i) => {
            req.input(`Report${i}`, sql.Int, id);
            return `@Report${i}`;
        }).join(",");
        return (await req.query(`SELECT tc.MaTheoDoi,dm.MaTrieuChung,
            dm.TenTrieuChung,dm.LaDauHieuCanhBao
            FROM dbo.THEODOI_TRIEUCHUNG tc
            JOIN dbo.DANHMUCTRIEUCHUNG dm ON dm.MaTrieuChung=tc.MaTrieuChung
            WHERE tc.MaTheoDoi IN (${placeholders})
            ORDER BY dm.LaDauHieuCanhBao DESC,dm.TenTrieuChung`)).recordset;
    }

    async function history(reportId) {
        const req = await request();
        return (await req.input("ReportId", sql.Int, reportId).query(`
            SELECT MaLichSu,MaTaiKhoan,TrangThaiCu,TrangThaiMoi,LanCapNhat,
                HanhDong,NoiDung,NgayTao FROM dbo.THEODOI_LICHSU
            WHERE MaTheoDoi=@ReportId ORDER BY MaLichSu`)).recordset;
    }

    async function submit(accountId, data) {
        const req = await request();
        return first(await req.input("MaTaiKhoan", sql.Int, accountId)
            .input("MaMuiTiem", sql.Int, data.vaccinationId)
            .input("KhoiPhatLuc", sql.DateTime2, data.onsetAt)
            .input("ThoiLuongGio", sql.Decimal(6, 2), data.durationHours)
            .input("NhietDo", sql.Decimal(4, 1), data.temperature)
            .input("TrieuChung", sql.NVarChar(2000), data.description)
            .input("MucDo", sql.VarChar(16), data.severity)
            .input("TrieuChungJson", sql.NVarChar(sql.MAX), JSON.stringify(data.symptoms))
            .execute("dbo.usp_BaoCaoSauTiem"));
    }

    async function review(accountId, reportId, data) {
        const req = await request();
        return first(await req.input("MaTaiKhoan", sql.Int, accountId)
            .input("MaTheoDoi", sql.Int, reportId)
            .input("TrangThai", sql.VarChar(16), data.status)
            .input("HuongXuLy", sql.NVarChar(2000), data.staffAdvice)
            .input("HenTheoDoiLuc", sql.DateTime2, data.nextFollowupAt)
            .input("LanCapNhatMongDoi", sql.Int, data.expectedRevision)
            .execute("dbo.usp_XuLyTheoDoi"));
    }

    async function checkInTimes(accountId) {
        const req = await request();
        return (await req.input("AccountId", sql.Int, accountId).query(`
            SELECT MaMuiTiem,ThoiDiemBaoCao FROM dbo.vw_TheoDoiSauTiemChiTiet
            WHERE MaTaiKhoanNguoiDan=@AccountId
            ORDER BY ThoiDiemBaoCao`)).recordset;
    }

    return { findActor, listSymptoms, findVaccination, listVaccinations, listReports,
        findReport, reportSymptoms, history, submit, review, checkInTimes };
}

let instance;
function defaultRepository() {
    if (!instance) {
        const { sql } = require("../config/database");
        instance = createFollowupRepository({ sql, connect: () => sql.connect() });
    }
    return instance;
}
const methods = ["findActor", "listSymptoms", "findVaccination", "listVaccinations", "listReports",
    "findReport", "reportSymptoms", "history", "submit", "review", "checkInTimes"];
module.exports = { createFollowupRepository, ...Object.fromEntries(methods.map((name) =>
    [name, (...args) => defaultRepository()[name](...args)])) };
