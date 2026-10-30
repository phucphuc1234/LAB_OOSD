const { sql } = require("../config/database");
const { integer } = require("../utils/validation");
const selection = `SELECT lt.*, nd.HoTen, v.TenVaccine, lv.MaLoVaccine,
    cs.TenCoSo,cs.DiaChi AS DiaChiCoSo,cs.PhuongXa AS PhuongXaCoSo,cs.TinhThanh AS TinhThanhCoSo
    FROM LICHTIEM lt JOIN NGUOIDAN nd ON nd.MaNguoiDan=lt.MaNguoiDan
    JOIN VACCINE v ON v.MaVaccine=lt.MaVaccine
    JOIN COSOTIEM cs ON cs.MaCoSoTiem=lt.MaCoSoTiem
    LEFT JOIN LOVACCINE lv ON lv.MaLo=lt.MaLoDuKien`;
const findAll = async (actor) => {
    const pool = await sql.connect();
    return (await pool.request().input("ActorId",sql.Int,integer(actor,"Tài khoản"))
        .query(`${selection} WHERE dbo.fn_CoSoDuocPhep(@ActorId,lt.MaCoSoTiem)=1 ORDER BY lt.NgayDuKien DESC,lt.MaLichTiem DESC`)).recordset;
};
const findById = async (id,actor) => {
    const pool = await sql.connect();
    return (await pool.request().input("Id",sql.Int,id).input("ActorId",sql.Int,integer(actor,"Tài khoản"))
        .query(`${selection} WHERE lt.MaLichTiem=@Id AND dbo.fn_CoSoDuocPhep(@ActorId,lt.MaCoSoTiem)=1`)).recordset[0] || null;
};
// Explicit ownership-only reads keep citizen APIs independent from staff assignments.
const findByIdForCitizen = async (id,citizen) => {
    const pool = await sql.connect();
    return (await pool.request().input("Id",sql.Int,id).input("CitizenId",sql.Int,citizen)
        .query(`${selection} WHERE lt.MaLichTiem=@Id AND lt.MaNguoiDan=@CitizenId`)).recordset[0] || null;
};
const findByCitizenId = async (id) => {
    const pool = await sql.connect();
    return (await pool.request().input("Id",sql.Int,id)
        .query(`${selection} WHERE lt.MaNguoiDan=@Id ORDER BY lt.NgayDuKien DESC`)).recordset;
};
const findAvailableFacility = async (facility,vaccine,date) => {
    const pool = await sql.connect();
    return (await pool.request().input("FacilityId",sql.Int,facility).input("VaccineId",sql.Int,vaccine)
        .input("AppointmentDate",sql.DateTime2,date).query(`
            SELECT cs.* FROM dbo.COSOTIEM cs JOIN dbo.KHUVUCTIEM kv ON kv.MaKhuVuc=cs.MaKhuVuc
            JOIN dbo.COSOTIEM_VACCINE cv ON cv.MaCoSoTiem=cs.MaCoSoTiem AND cv.MaVaccine=@VaccineId
            WHERE cs.MaCoSoTiem=@FacilityId AND cs.TrangThai=1 AND kv.TrangThai=1 AND cv.TrangThai=1
              AND cs.TinhThanh=N'Thành phố Hồ Chí Minh'
              AND EXISTS(SELECT 1 FROM dbo.LOVACCINE lv WHERE lv.MaCoSoTiem=cs.MaCoSoTiem
                  AND lv.MaVaccine=@VaccineId AND lv.TrangThai=N'Đang sử dụng'
                  AND lv.HanSuDung>=CAST(DATEADD(hour,7,@AppointmentDate) AS date) AND lv.SoLuongCon>lv.SoLuongDatTruoc)`)).recordset[0] || null;
};
// SQL rechecks facility, actor ownership/assignment and FEFO reservation atomically.
const save = async (id,data,creator=null,citizenAccount=null) => {
    const pool = await sql.connect();
    const result = await pool.request()
        .input("MaLichTiem",sql.Int,id)
        .input("MaNguoiDan",sql.Int,data.maNguoiDan)
        .input("MaVaccine",sql.Int,data.maVaccine)
        .input("MaCoSoTiem",sql.Int,data.maCoSoTiem)
        .input("MuiSo",sql.Int,data.muiSo)
        .input("NgayDuKien",sql.DateTime2,new Date(data.ngayDuKien))
        .input("TrangThai",sql.NVarChar(50),data.trangThai || "Đã lên lịch")
        .input("GhiChu",sql.NVarChar(1000),data.ghiChu ?? null)
        .input("MaNhanVienTao",sql.Int,creator)
        .input("MaTaiKhoanNguoiDan",sql.Int,citizenAccount)
        .input("MaLoDuKien",sql.Int,data.maLoDuKien ?? null)
        .execute("dbo.usp_LuuLichTiem");
    return result.recordset[0];
};
const create = (data,creator) => save(null,data,integer(creator,"Nhân viên lập lịch"));
const update = (id,data,creator) => save(id,data,integer(creator,"Nhân viên lập lịch"));
const createByCitizen = (citizen,data,account) => save(null,{...data,maNguoiDan:citizen},null,integer(account,"Tài khoản người dân"));
const updateStatus = async (id,status,account) => {
    const pool = await sql.connect();
    return (await pool.request().input("MaLichTiem",sql.Int,id)
        .input("TrangThai",sql.NVarChar(50),status)
        .input("MaTaiKhoan",sql.Int,integer(account,"Tài khoản"))
        .execute("dbo.usp_DoiTrangThaiLichTiem")).recordset[0];
};
module.exports = {findAll,findById,findByIdForCitizen,findByCitizenId,findAvailableFacility,create,update,updateStatus,createByCitizen};
