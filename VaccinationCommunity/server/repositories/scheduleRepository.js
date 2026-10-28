const { sql } = require("../config/database");
const selection = `SELECT lt.*, nd.HoTen, v.TenVaccine, lv.MaLoVaccine
    FROM LICHTIEM lt JOIN NGUOIDAN nd ON nd.MaNguoiDan=lt.MaNguoiDan
    JOIN VACCINE v ON v.MaVaccine=lt.MaVaccine
    LEFT JOIN LOVACCINE lv ON lv.MaLo=lt.MaLoDuKien`;
const findAll = async () => {
    const pool = await sql.connect();
    return (await pool.request().query(`${selection} ORDER BY lt.NgayDuKien DESC, lt.MaLichTiem DESC`)).recordset;
};
const findById = async (id) => {
    const pool = await sql.connect();
    return (await pool.request().input("Id", sql.Int, id).query(`${selection} WHERE lt.MaLichTiem=@Id`)).recordset[0] || null;
};
const findByCitizenId = async (id) => {
    const pool = await sql.connect();
    return (await pool.request().input("Id", sql.Int, id).query(`${selection} WHERE lt.MaNguoiDan=@Id ORDER BY lt.NgayDuKien DESC`)).recordset;
};
// Capacity reservations and duplicate checks belong to the same SQL transaction.
const save = async (id, data, creator = null) => {
    const pool = await sql.connect();
    const result = await pool.request()
        .input("MaLichTiem", sql.Int, id)
        .input("MaNguoiDan", sql.Int, data.maNguoiDan)
        .input("MaVaccine", sql.Int, data.maVaccine)
        .input("MuiSo", sql.Int, data.muiSo)
        .input("NgayDuKien", sql.DateTime2, new Date(data.ngayDuKien))
        .input("CoSoTiem", sql.NVarChar(255), data.coSoTiem ?? null)
        .input("TrangThai", sql.NVarChar(50), data.trangThai || "Đã lên lịch")
        .input("GhiChu", sql.NVarChar(1000), data.ghiChu ?? null)
        .input("MaNhanVienTao", sql.Int, creator)
        .input("MaLoDuKien", sql.Int, data.maLoDuKien ?? null)
        .execute("dbo.usp_LuuLichTiem");
    return result.recordset[0];
};
const create = (data, creator) => save(null, data, creator);
const update = (id, data, creator) => save(id, data, creator);
const createByCitizen = (citizen, data) => save(null, { ...data, maNguoiDan: citizen }, null);
const updateStatus = async (id, status, account = null) => {
    const pool = await sql.connect();
    return (await pool.request()
        .input("MaLichTiem", sql.Int, id)
        .input("TrangThai", sql.NVarChar(50), status)
        .input("MaTaiKhoan", sql.Int, account)
        .execute("dbo.usp_DoiTrangThaiLichTiem")).recordset[0];
};
module.exports = { findAll, findById, findByCitizenId, create, update, updateStatus, createByCitizen };
