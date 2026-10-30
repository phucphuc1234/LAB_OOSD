const { sql } = require("../config/database");
const { integer } = require("../utils/validation");

// Ownership and staff assignments are mutually explicit scopes. Omitting both
// never opens a global query. Citizen history can span all of their facilities.
const bindScope = (request, { actorId = null, ownerAccountId = null } = {}) => request
    .input("ActorId", sql.Int, actorId === null ? null : integer(actorId, "Tài khoản nhân viên"))
    .input("OwnerAccountId", sql.Int, ownerAccountId === null ? null : integer(ownerAccountId, "Tài khoản người dân"));
const allowed = `((@OwnerAccountId IS NOT NULL AND nd.MaTaiKhoan=@OwnerAccountId)
    OR (@OwnerAccountId IS NULL AND dbo.fn_CoSoDuocPhep(@ActorId,mt.MaCoSoTiem)=1))`;
const selection = `SELECT mt.*,nd.HoTen,nd.NgaySinh,nd.GioiTinh,
    v.TenVaccine,v.LoaiVaccine,v.NhaSanXuat,lv.MaLoVaccine,
    lv.NgaySanXuat,lv.HanSuDung,tk.TenDangNhap AS NhanVienGhiNhan,
    cs.TenCoSo,cs.DiaChi AS DiaChiCoSo,cs.PhuongXa AS PhuongXaCoSo
    FROM dbo.MUITIEM mt JOIN dbo.NGUOIDAN nd ON nd.MaNguoiDan=mt.MaNguoiDan
    JOIN dbo.VACCINE v ON v.MaVaccine=mt.MaVaccine
    JOIN dbo.LOVACCINE lv ON lv.MaLo=mt.MaLo
    JOIN dbo.TAIKHOAN tk ON tk.MaTaiKhoan=mt.MaNhanVien
    JOIN dbo.COSOTIEM cs ON cs.MaCoSoTiem=mt.MaCoSoTiem`;
const findByCitizenId = async (citizenId, scope) => {
    const pool = await sql.connect();
    return (await bindScope(pool.request(), scope)
        .input("CitizenId", sql.Int, integer(citizenId, "Mã người dân"))
        .query(`${selection} WHERE mt.MaNguoiDan=@CitizenId AND ${allowed}
            ORDER BY mt.NgayTiem DESC,mt.MaMuiTiem DESC`)).recordset;
};
const findByVaccinationId = async (vaccinationId, scope) => {
    const pool = await sql.connect();
    return (await bindScope(pool.request(), scope)
        .input("VaccinationId", sql.Int, integer(vaccinationId, "Mã mũi tiêm"))
        .query(`${selection} WHERE mt.MaMuiTiem=@VaccinationId AND ${allowed}`)).recordset[0] || null;
};
module.exports = { findByCitizenId, findByVaccinationId };
