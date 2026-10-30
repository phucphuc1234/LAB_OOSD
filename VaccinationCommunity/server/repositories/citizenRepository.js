const { sql } = require("../config/database");
const { integer } = require("../utils/validation");


// Tìm hồ sơ người dân theo tài khoản đăng nhập
const findByAccountId = async (maTaiKhoan) => {

    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaTaiKhoan",
            sql.Int,
            maTaiKhoan
        )
        .query(`
            SELECT
                nd.MaNguoiDan,
                nd.MaTaiKhoan,
                nd.HoTen,
                nd.NgaySinh,
                nd.GioiTinh,
                nd.CCCD,
                nd.SoBHYT,
                nd.SoDienThoai,
                nd.Email,
                nd.DiaChi,
                nd.PhuongXa,
                nd.QuanHuyen,
                nd.TinhThanh,
                nd.NgayTao,
                nd.NgayCapNhat,
                nd.TrangThai
            FROM NGUOIDAN nd
            WHERE nd.MaTaiKhoan = @MaTaiKhoan
        `);

    return result.recordset[0] || null;
};


// Người dân cập nhật hồ sơ cá nhân
const updateOwnProfile = async (maTaiKhoan, data) => {
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        const previous = (await new sql.Request(transaction)
            .input("MaTaiKhoan", sql.Int, maTaiKhoan)
            .query(`SELECT * FROM NGUOIDAN WITH (UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@MaTaiKhoan`)).recordset[0];
        if (!previous) throw Object.assign(new Error("Không tìm thấy hồ sơ người dân."), { statusCode: 404 });
        const request = new sql.Request(transaction)
            .input("MaTaiKhoan", sql.Int, maTaiKhoan)
            .input("SoDienThoai", sql.VarChar(20), data.soDienThoai ?? null)
            .input("Email", sql.VarChar(150), data.email ?? null)
            .input("DiaChi", sql.NVarChar(255), data.diaChi ?? null)
            .input("PhuongXa", sql.NVarChar(100), data.phuongXa ?? null)
            .input("QuanHuyen", sql.NVarChar(100), data.quanHuyen ?? null)
            .input("TinhThanh", sql.NVarChar(100), data.tinhThanh ?? null);
        const result = await request.query(`
            UPDATE NGUOIDAN SET
                SoDienThoai=COALESCE(@SoDienThoai,SoDienThoai), Email=COALESCE(@Email,Email),
                DiaChi=COALESCE(@DiaChi,DiaChi), PhuongXa=COALESCE(@PhuongXa,PhuongXa),
                QuanHuyen=COALESCE(@QuanHuyen,QuanHuyen), TinhThanh=COALESCE(@TinhThanh,TinhThanh),
                NgayCapNhat=GETDATE() WHERE MaTaiKhoan=@MaTaiKhoan;
            UPDATE TAIKHOAN SET Email=COALESCE(@Email,Email), SoDienThoai=COALESCE(@SoDienThoai,SoDienThoai)
                WHERE MaTaiKhoan=@MaTaiKhoan;
            SELECT * FROM NGUOIDAN WHERE MaTaiKhoan=@MaTaiKhoan;`);
        const updated = result.recordset[0];
        await new sql.Request(transaction)
            .input("MaBanGhi", sql.Int, updated.MaNguoiDan)
            .input("MaTaiKhoan", sql.Int, maTaiKhoan)
            .input("DuLieuCu", sql.NVarChar(sql.MAX), JSON.stringify(previous))
            .input("DuLieuMoi", sql.NVarChar(sql.MAX), JSON.stringify(updated))
            .query(`INSERT INTO LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi,MaTaiKhoan)
                VALUES('NGUOIDAN',@MaBanGhi,N'Cập nhật hồ sơ',@DuLieuCu,@DuLieuMoi,@MaTaiKhoan)`);
        await transaction.commit();
        return updated;
    } catch (failure) {
        try { await transaction.rollback(); } catch (_) { }
        throw failure;
    }
};

// Danh sách tất cả người dân
const findAll = async (actorId) => {

    const pool = await sql.connect();

    const result = await pool
        .request()
        .input("ActorId", sql.Int, integer(actorId, "Tài khoản nhân viên"))
        .query(`
            SELECT
                MaNguoiDan,
                HoTen,
                NgaySinh,
                GioiTinh,
                CCCD,
                SoBHYT,
                SoDienThoai,
                Email,
                DiaChi,
                PhuongXa,
                QuanHuyen,
                TinhThanh,
                TrangThai
            FROM NGUOIDAN
            WHERE dbo.fn_NguoiDanDuocPhep(@ActorId,MaNguoiDan)=1
            ORDER BY MaNguoiDan DESC
        `);

    return result.recordset;
};

// Staff detail lookups must use this method; findById remains an internal
// reference lookup for ownership-checked citizen and inventory operations.
const findScopedById = async (citizenId, actorId) => {
    const pool = await sql.connect();
    return (await pool.request()
        .input("CitizenId", sql.Int, integer(citizenId, "Mã người dân"))
        .input("ActorId", sql.Int, integer(actorId, "Tài khoản nhân viên"))
        .query(`SELECT nd.* FROM dbo.NGUOIDAN nd
            WHERE nd.MaNguoiDan=@CitizenId
              AND dbo.fn_NguoiDanDuocPhep(@ActorId,nd.MaNguoiDan)=1`)).recordset[0] || null;
};


// Tìm người dân theo ID
const findById = async (maNguoiDan) => {

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
                MaNguoiDan,
                MaTaiKhoan,
                HoTen,
                NgaySinh,
                GioiTinh,
                CCCD,
                SoBHYT,
                SoDienThoai,
                Email,
                DiaChi,
                PhuongXa,
                QuanHuyen,
                TinhThanh,
                NgayTao,
                NgayCapNhat,
                TrangThai
            FROM NGUOIDAN
            WHERE MaNguoiDan = @MaNguoiDan
        `);

    return result.recordset[0] || null;
};


module.exports = {
    findByAccountId,
    updateOwnProfile,
    findAll,
    findScopedById,
    findById
};
