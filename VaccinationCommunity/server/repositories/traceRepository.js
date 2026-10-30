const { sql } = require("../config/database");
const { integer } = require("../utils/validation");
const selection = `SELECT lv.MaLo,lv.MaLoVaccine,lv.MaVaccine,v.TenVaccine,
    lv.NgaySanXuat,lv.HanSuDung,lv.NgayNhap,lv.SoLuongNhap,lv.SoLuongCon,
    lv.TrangThai,lv.MaCoSoTiem,cs.TenCoSo,cs.DiaChi AS DiaChiCoSo,
    mt.MaMuiTiem,mt.MaNguoiDan,nd.HoTen,nd.NgaySinh,nd.CCCD,
    mt.MuiSo,mt.NgayTiem,mt.CoSoTiem,mt.KetQua,mt.MaNhanVien,
    tk.TenDangNhap AS NhanVienGhiNhan
    FROM dbo.LOVACCINE lv JOIN dbo.VACCINE v ON v.MaVaccine=lv.MaVaccine
    JOIN dbo.COSOTIEM cs ON cs.MaCoSoTiem=lv.MaCoSoTiem
    LEFT JOIN dbo.MUITIEM mt ON mt.MaLo=lv.MaLo
      AND dbo.fn_CoSoDuocPhep(@ActorId,mt.MaCoSoTiem)=1
    LEFT JOIN dbo.NGUOIDAN nd ON nd.MaNguoiDan=mt.MaNguoiDan
    LEFT JOIN dbo.TAIKHOAN tk ON tk.MaTaiKhoan=mt.MaNhanVien`;
const findBatch = async (where, param, type, value, actorId) => {
    const pool = await sql.connect();
    return (await pool.request()
        .input("ActorId", sql.Int, integer(actorId, "Tài khoản nhân viên"))
        .input(param, type, value)
        .query(`${selection} WHERE ${where}
            AND dbo.fn_CoSoDuocPhep(@ActorId,lv.MaCoSoTiem)=1
            ORDER BY mt.NgayTiem DESC,mt.MaMuiTiem DESC`)).recordset;
};
const traceByBatchId = (id, actorId) => findBatch("lv.MaLo=@BatchId", "BatchId", sql.Int, integer(id, "Mã lô"), actorId);
const traceByBatchCode = (code, actorId) => findBatch("lv.MaLoVaccine=@BatchCode", "BatchCode", sql.VarChar(50), code, actorId);
const traceByVaccinationId = async (id, actorId) => {
    const pool = await sql.connect();
    return (await pool.request()
        .input("ActorId", sql.Int, integer(actorId, "Tài khoản nhân viên"))
        .input("VaccinationId", sql.Int, integer(id, "Mã mũi tiêm"))
        .query(`${selection} WHERE mt.MaMuiTiem=@VaccinationId
            AND dbo.fn_CoSoDuocPhep(@ActorId,lv.MaCoSoTiem)=1
            AND dbo.fn_CoSoDuocPhep(@ActorId,mt.MaCoSoTiem)=1`)).recordset[0] || null;
};
module.exports = { traceByBatchId, traceByBatchCode, traceByVaccinationId };
