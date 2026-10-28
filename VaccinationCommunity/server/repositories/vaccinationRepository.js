const { sql } = require("../config/database");


// Tìm mũi tiêm theo ID
const findById = async (maMuiTiem) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaMuiTiem",
            sql.Int,
            maMuiTiem
        )
        .query(`
            SELECT
                mt.MaMuiTiem,
                mt.MaNguoiDan,
                nd.HoTen,
                mt.MaVaccine,
                v.TenVaccine,
                mt.MaLo,
                lv.MaLoVaccine,
                mt.MaLichTiem,
                mt.MuiSo,
                mt.NgayTiem,
                mt.CoSoTiem,
                mt.MaNhanVien,
                tk.TenDangNhap AS NhanVienGhiNhan,
                mt.KetQua,
                mt.PhanUngSauTiem,
                mt.GhiChu,
                mt.NgayTao
            FROM MUITIEM mt
            INNER JOIN NGUOIDAN nd
                ON mt.MaNguoiDan = nd.MaNguoiDan
            INNER JOIN VACCINE v
                ON mt.MaVaccine = v.MaVaccine
            INNER JOIN LOVACCINE lv
                ON mt.MaLo = lv.MaLo
            INNER JOIN TAIKHOAN tk
                ON mt.MaNhanVien = tk.MaTaiKhoan
            WHERE mt.MaMuiTiem = @MaMuiTiem
        `);

    return result.recordset[0] || null;
};


// SQL owns validation, inventory and appointment updates in one transaction.
const create = async (data, staff) => {
    const pool = await sql.connect();
    const result = await pool.request()
        .input("MaNguoiDan", sql.Int, data.maNguoiDan)
        .input("MaVaccine", sql.Int, data.maVaccine)
        .input("MaLo", sql.Int, data.maLo)
        .input("MaLichTiem", sql.Int, data.maLichTiem ?? null)
        .input("MuiSo", sql.Int, data.muiSo)
        .input("NgayTiem", sql.DateTime2, data.ngayTiem)
        .input("CoSoTiem", sql.NVarChar(255), data.coSoTiem ?? null)
        .input("MaNhanVien", sql.Int, staff)
        .input("KetQua", sql.NVarChar(100), data.ketQua)
        .input("PhanUngSauTiem", sql.NVarChar(500), data.phanUngSauTiem ?? null)
        .input("GhiChu", sql.NVarChar(500), data.ghiChu ?? null)
        .execute("dbo.usp_GhiNhanMuiTiem");
    return result.recordset[0];
};
module.exports = { findById, create };
