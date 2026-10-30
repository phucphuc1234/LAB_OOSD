const { sql } = require("../config/database");
const { integer } = require("../utils/validation");
const findById = async (id,actor) => {
    const pool = await sql.connect();
    return (await pool.request().input("Id",sql.Int,id).input("ActorId",sql.Int,integer(actor,"Tài khoản"))
        .query(`SELECT mt.*,nd.HoTen,v.TenVaccine,lv.MaLoVaccine,tk.TenDangNhap AS NhanVienGhiNhan,
            cs.TenCoSo,cs.DiaChi AS DiaChiCoSo,cs.PhuongXa AS PhuongXaCoSo,cs.TinhThanh AS TinhThanhCoSo
            FROM dbo.MUITIEM mt JOIN dbo.NGUOIDAN nd ON mt.MaNguoiDan=nd.MaNguoiDan
            JOIN dbo.VACCINE v ON mt.MaVaccine=v.MaVaccine JOIN dbo.LOVACCINE lv ON mt.MaLo=lv.MaLo
            JOIN dbo.TAIKHOAN tk ON mt.MaNhanVien=tk.MaTaiKhoan
            JOIN dbo.COSOTIEM cs ON cs.MaCoSoTiem=mt.MaCoSoTiem
            WHERE mt.MaMuiTiem=@Id AND dbo.fn_CoSoDuocPhep(@ActorId,mt.MaCoSoTiem)=1`)).recordset[0] || null;
};
// The procedure checks assignment again, then owns stock and idempotent retry.
const create = async (data,staff) => {
    const pool = await sql.connect();
    const result = await pool.request()
        .input("MaNguoiDan",sql.Int,data.maNguoiDan)
        .input("MaVaccine",sql.Int,data.maVaccine)
        .input("MaCoSoTiem",sql.Int,data.maCoSoTiem)
        .input("MaLo",sql.Int,data.maLo)
        .input("MaLichTiem",sql.Int,data.maLichTiem ?? null)
        .input("MuiSo",sql.Int,data.muiSo)
        .input("NgayTiem",sql.DateTime2,data.ngayTiem)
        .input("MaNhanVien",sql.Int,integer(staff,"Nhân viên"))
        .input("KetQua",sql.NVarChar(100),data.ketQua)
        .input("PhanUngSauTiem",sql.NVarChar(500),data.phanUngSauTiem ?? null)
        .input("GhiChu",sql.NVarChar(500),data.ghiChu ?? null)
        .execute("dbo.usp_GhiNhanMuiTiem");
    return result.recordset[0];
};
module.exports = {findById,create};
