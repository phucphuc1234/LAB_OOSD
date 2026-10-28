const { sql } = require("../config/database");


// Lịch sử tiêm của một người dân
const findByCitizenId = async (maNguoiDan) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaNguoiDan",
            sql.Int,
            maNguoiDan
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
                mt.GhiChu

            FROM MUITIEM mt

            INNER JOIN NGUOIDAN nd
                ON mt.MaNguoiDan = nd.MaNguoiDan

            INNER JOIN VACCINE v
                ON mt.MaVaccine = v.MaVaccine

            INNER JOIN LOVACCINE lv
                ON mt.MaLo = lv.MaLo

            INNER JOIN TAIKHOAN tk
                ON mt.MaNhanVien = tk.MaTaiKhoan

            WHERE mt.MaNguoiDan = @MaNguoiDan

            ORDER BY mt.NgayTiem DESC
        `);

    return result.recordset;
};


// Chi tiết một mũi tiêm
const findByVaccinationId = async (
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
                nd.NgaySinh,
                nd.GioiTinh,

                mt.MaVaccine,
                v.TenVaccine,
                v.LoaiVaccine,
                v.NhaSanXuat,

                mt.MaLo,
                lv.MaLoVaccine,
                lv.NgaySanXuat,
                lv.HanSuDung,

                mt.MaLichTiem,
                mt.MuiSo,
                mt.NgayTiem,
                mt.CoSoTiem,

                mt.MaNhanVien,
                tk.TenDangNhap AS NhanVienGhiNhan,

                mt.KetQua,
                mt.PhanUngSauTiem,
                mt.GhiChu

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


module.exports = {
    findByCitizenId,
    findByVaccinationId
};
