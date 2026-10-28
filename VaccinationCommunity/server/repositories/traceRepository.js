const { sql } = require("../config/database");


// Truy vết từ lô vaccine -> các mũi tiêm
const traceByBatchId = async (maLo) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaLo",
            sql.Int,
            maLo
        )
        .query(`
            SELECT
                lv.MaLo,
                lv.MaLoVaccine,
                lv.MaVaccine,
                v.TenVaccine,
                lv.NgaySanXuat,
                lv.HanSuDung,
                lv.SoLuongNhap,
                lv.SoLuongCon,
                lv.TrangThai,

                mt.MaMuiTiem,
                mt.MaNguoiDan,
                nd.HoTen,
                nd.NgaySinh,
                nd.CCCD,

                mt.MuiSo,
                mt.NgayTiem,
                mt.CoSoTiem,
                mt.KetQua,

                mt.MaNhanVien,
                tk.TenDangNhap AS NhanVienGhiNhan

            FROM LOVACCINE lv

            INNER JOIN VACCINE v
                ON lv.MaVaccine = v.MaVaccine

            LEFT JOIN MUITIEM mt
                ON lv.MaLo = mt.MaLo

            LEFT JOIN NGUOIDAN nd
                ON mt.MaNguoiDan = nd.MaNguoiDan

            LEFT JOIN TAIKHOAN tk
                ON mt.MaNhanVien = tk.MaTaiKhoan

            WHERE lv.MaLo = @MaLo

            ORDER BY mt.NgayTiem DESC
        `);

    return result.recordset;
};


// Truy vết bằng mã lô
const traceByBatchCode = async (
    maLoVaccine
) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaLoVaccine",
            sql.VarChar(50),
            maLoVaccine
        )
        .query(`
            SELECT
                lv.MaLo,
                lv.MaLoVaccine,
                lv.MaVaccine,
                v.TenVaccine,
                lv.NgaySanXuat,
                lv.HanSuDung,
                lv.SoLuongNhap,
                lv.SoLuongCon,
                lv.TrangThai,

                mt.MaMuiTiem,
                mt.MaNguoiDan,
                nd.HoTen,
                nd.NgaySinh,
                nd.CCCD,

                mt.MuiSo,
                mt.NgayTiem,
                mt.CoSoTiem,
                mt.KetQua,

                tk.TenDangNhap
                    AS NhanVienGhiNhan

            FROM LOVACCINE lv

            INNER JOIN VACCINE v
                ON lv.MaVaccine = v.MaVaccine

            LEFT JOIN MUITIEM mt
                ON lv.MaLo = mt.MaLo

            LEFT JOIN NGUOIDAN nd
                ON mt.MaNguoiDan =
                    nd.MaNguoiDan

            LEFT JOIN TAIKHOAN tk
                ON mt.MaNhanVien =
                    tk.MaTaiKhoan

            WHERE lv.MaLoVaccine =
                @MaLoVaccine

            ORDER BY mt.NgayTiem DESC
        `);

    return result.recordset;
};


// Truy từ mũi tiêm -> lô vaccine
const traceByVaccinationId = async (
    maMuiTiem
) => {
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
                lv.NgaySanXuat,
                lv.HanSuDung,
                lv.NgayNhap,
                lv.SoLuongNhap,
                lv.SoLuongCon,
                lv.TrangThai AS TrangThaiLo,

                mt.MuiSo,
                mt.NgayTiem,
                mt.CoSoTiem,
                mt.KetQua,

                mt.MaNhanVien,
                tk.TenDangNhap
                    AS NhanVienGhiNhan

            FROM MUITIEM mt

            INNER JOIN NGUOIDAN nd
                ON mt.MaNguoiDan =
                    nd.MaNguoiDan

            INNER JOIN VACCINE v
                ON mt.MaVaccine =
                    v.MaVaccine

            INNER JOIN LOVACCINE lv
                ON mt.MaLo = lv.MaLo

            INNER JOIN TAIKHOAN tk
                ON mt.MaNhanVien =
                    tk.MaTaiKhoan

            WHERE mt.MaMuiTiem =
                @MaMuiTiem
        `);

    return result.recordset[0] || null;
};


module.exports = {
    traceByBatchId,
    traceByBatchCode,
    traceByVaccinationId
};
