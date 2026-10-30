const { sql } = require("../config/database");
const { integer } = require("../utils/validation");
const selection = `SELECT c.*,nd.HoTen,tk.TenDangNhap AS NguoiXacNhan,
    cs.TenCoSo,cs.DiaChi AS DiaChiCoSo
    FROM dbo.CHONGCHIDINH c JOIN dbo.NGUOIDAN nd ON nd.MaNguoiDan=c.MaNguoiDan
    JOIN dbo.COSOTIEM cs ON cs.MaCoSoTiem=c.MaCoSoTiem
    LEFT JOIN dbo.TAIKHOAN tk ON tk.MaTaiKhoan=c.MaNguoiXacNhan`;
const findAll = async actorId => {
    const pool = await sql.connect();
    return (await pool.request().input("ActorId", sql.Int, integer(actorId, "Tài khoản nhân viên"))
        .query(`${selection} WHERE dbo.fn_CoSoDuocPhep(@ActorId,c.MaCoSoTiem)=1
            ORDER BY c.MaChongChiDinh DESC`)).recordset;
};
const findById = async (id, actorId) => {
    const pool = await sql.connect();
    return (await pool.request().input("ActorId", sql.Int, integer(actorId, "Tài khoản nhân viên"))
        .input("Id", sql.Int, integer(id, "Mã chống chỉ định"))
        .query(`${selection} WHERE c.MaChongChiDinh=@Id
            AND dbo.fn_CoSoDuocPhep(@ActorId,c.MaCoSoTiem)=1`)).recordset[0] || null;
};
const findByCitizenId = async (citizenId, ownerAccountId) => {
    const pool = await sql.connect();
    return (await pool.request()
        .input("CitizenId", sql.Int, integer(citizenId, "Mã người dân"))
        .input("OwnerAccountId", sql.Int, integer(ownerAccountId, "Tài khoản người dân"))
        .query(`${selection} WHERE c.MaNguoiDan=@CitizenId AND nd.MaTaiKhoan=@OwnerAccountId
            ORDER BY c.MaChongChiDinh DESC`)).recordset;
};
// Keep the assignment and patient-scope reads in the same SERIALIZABLE
// transaction as the clinical change and its audit. A concurrent revocation
// cannot slip between an authorization check and the write.
const save = async (id, data, actorId) => {
    actorId = integer(actorId, "Tài khoản nhân viên");
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        await new sql.Request(transaction).query(`DECLARE @LockResult int;
            EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',
                @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=10000;
            IF @LockResult<0 THROW 51003,N'Dữ liệu tiêm chủng đang được xử lý; vui lòng thử lại.',1;`);
        const req = new sql.Request(transaction)
            .input("Id", sql.Int, id)
            .input("ActorId", sql.Int, actorId)
            .input("CitizenId", sql.Int, data.maNguoiDan)
            .input("FacilityId", sql.Int, data.maCoSoTiem)
            .input("Content", sql.NVarChar(500), data.noiDung)
            .input("ConfirmedAt", sql.DateTime2, data.ngayXacNhan)
            .input("Status", sql.NVarChar(50), data.trangThai)
            .input("Note", sql.NVarChar(500), data.ghiChu ?? null);
        const result = await req.query(`
            DECLARE @Old nvarchar(max),@New nvarchar(max),@PreviousCitizen int,@PreviousFacility int;
            IF ISNULL(dbo.fn_CoSoDuocPhep(@ActorId,@FacilityId),0)<>1
                OR ISNULL(dbo.fn_NguoiDanDuocPhep(@ActorId,@CitizenId),0)<>1
                THROW 51002,N'Bạn không được quản lý hồ sơ tại cơ sở tiêm này.',1;
            IF NOT EXISTS(SELECT 1 FROM dbo.NGUOIDAN WITH(HOLDLOCK) WHERE MaNguoiDan=@CitizenId AND TrangThai=1)
                THROW 51001,N'Không tìm thấy hồ sơ người dân đang hoạt động.',1;
            IF @Id IS NULL
            BEGIN
                IF NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM cs WITH(HOLDLOCK)
                    JOIN dbo.KHUVUCTIEM kv WITH(HOLDLOCK) ON kv.MaKhuVuc=cs.MaKhuVuc
                    WHERE cs.MaCoSoTiem=@FacilityId AND cs.TrangThai=1 AND kv.TrangThai=1)
                    THROW 51003,N'Cơ sở tiêm hoặc khu vực đang ngừng hoạt động.',1;
                INSERT dbo.CHONGCHIDINH(MaNguoiDan,MaCoSoTiem,NoiDung,NgayXacNhan,MaNguoiXacNhan,TrangThai,GhiChu)
                    VALUES(@CitizenId,@FacilityId,@Content,@ConfirmedAt,@ActorId,N'Đã xác nhận',@Note);
                SET @Id=CONVERT(int,SCOPE_IDENTITY());
            END
            ELSE
            BEGIN
                SELECT @PreviousCitizen=MaNguoiDan,@PreviousFacility=MaCoSoTiem
                    FROM dbo.CHONGCHIDINH WITH(UPDLOCK,HOLDLOCK) WHERE MaChongChiDinh=@Id;
                IF @PreviousCitizen IS NULL THROW 51001,N'Không tìm thấy chống chỉ định.',1;
                IF @PreviousCitizen<>@CitizenId OR @PreviousFacility<>@FacilityId
                    THROW 51003,N'Không được đổi người dân hoặc cơ sở của chống chỉ định.',1;
                SET @Old=(SELECT * FROM dbo.CHONGCHIDINH WHERE MaChongChiDinh=@Id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
                UPDATE dbo.CHONGCHIDINH SET NoiDung=@Content,NgayXacNhan=@ConfirmedAt,
                    TrangThai=@Status,GhiChu=@Note WHERE MaChongChiDinh=@Id;
            END;
            SET @New=(SELECT * FROM dbo.CHONGCHIDINH WHERE MaChongChiDinh=@Id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
            INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi,MaTaiKhoan)
                VALUES('CHONGCHIDINH',@Id,CASE WHEN @Old IS NULL THEN N'Thêm mới' ELSE N'Cập nhật' END,@Old,@New,@ActorId);
            SELECT * FROM dbo.CHONGCHIDINH WHERE MaChongChiDinh=@Id;`);
        await transaction.commit();
        return result.recordset[0];
    } catch (error) {
        try { await transaction.rollback(); } catch (_) { /* preserve original error */ }
        throw error;
    }
};
const create = (data, actorId) => save(null, data, actorId);
const update = (id, data, actorId) => save(integer(id, "Mã chống chỉ định"), data, actorId);
module.exports = { findAll, findById, findByCitizenId, create, update };
