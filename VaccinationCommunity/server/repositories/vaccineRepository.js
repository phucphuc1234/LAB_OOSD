const { sql } = require("../config/database");
const { integer, fail } = require("../utils/validation");


// Lấy danh sách vaccine
const findAll = async () => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .query(`
            SELECT
                MaVaccine,
                TenVaccine,
                LoaiVaccine,
                NhaSanXuat,
                MoTa,
                SoMuiKhuyenNghi,
                KhoangCachMui,
                TrangThai,
                NgayTao
            FROM VACCINE
            ORDER BY MaVaccine DESC
        `);

    return result.recordset;
};


// Lấy vaccine theo ID
const findById = async (maVaccine) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaVaccine",
            sql.Int,
            maVaccine
        )
        .query(`
            SELECT
                MaVaccine,
                TenVaccine,
                LoaiVaccine,
                NhaSanXuat,
                MoTa,
                SoMuiKhuyenNghi,
                KhoangCachMui,
                TrangThai,
                NgayTao
            FROM VACCINE
            WHERE MaVaccine = @MaVaccine
        `);

    return result.recordset[0] || null;
};


// Kiểm tra tên vaccine
const findByName = async (tenVaccine) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "TenVaccine",
            sql.NVarChar(150),
            tenVaccine
        )
        .query(`
            SELECT
                MaVaccine,
                TenVaccine
            FROM VACCINE
            WHERE TenVaccine = @TenVaccine
        `);

    return result.recordset[0] || null;
};


// The global catalog affects every site. Recheck admin access under the same
// serializable transaction as the write and audit; route middleware is not enough.
async function write(actor, operation) {
    actor = integer(actor, "Tài khoản quản trị");
    const pool = await sql.connect(), transaction = new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const request = () => new sql.Request(transaction).input("ActorId", sql.Int, actor);
        // Match booking/vaccination lock order, so a new appointment cannot race a
        // global vaccine deactivation and become stranded after it succeeds.
        await request().query(`DECLARE @LockResult int;
            EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',
                @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=10000;
            IF @LockResult<0 THROW 51003,N'Dữ liệu vaccine đang được xử lý. Vui lòng thử lại.',1;`);
        await request().query(`IF NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t WITH(UPDLOCK,HOLDLOCK)
            JOIN dbo.VAITRO r WITH(HOLDLOCK) ON r.MaVaiTro=t.MaVaiTro
            WHERE t.MaTaiKhoan=@ActorId AND t.TrangThai=1 AND r.TrangThai=1 AND r.TenVaiTro=N'Quản trị viên')
            THROW 51002,N'Chỉ quản trị viên đang hoạt động được sửa danh mục vaccine dùng chung.',1;`);
        const result = await operation(request);
        await transaction.commit();
        return result;
    } catch (error) {
        try { await transaction.rollback(); } catch (_) { /* retain original error */ }
        throw error;
    }
}
async function audit(request, id, action, before, after) {
    await request().input("Id", sql.Int, id).input("Action", sql.NVarChar(100), action)
        .input("Before", sql.NVarChar(sql.MAX), before == null ? null : JSON.stringify(before))
        .input("After", sql.NVarChar(sql.MAX), JSON.stringify(after)).query(`
            INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi,MaTaiKhoan)
            VALUES('VACCINE',@Id,@Action,@Before,@After,@ActorId);`);
}
const fields = (request, data) => request
    .input("TenVaccine", sql.NVarChar(150), data.tenVaccine)
    .input("LoaiVaccine", sql.NVarChar(100), data.loaiVaccine ?? null)
    .input("NhaSanXuat", sql.NVarChar(150), data.nhaSanXuat ?? null)
    .input("MoTa", sql.NVarChar(500), data.moTa ?? null)
    .input("SoMuiKhuyenNghi", sql.Int, data.soMuiKhuyenNghi)
    .input("KhoangCachMui", sql.Int, data.khoangCachMui);
async function currentRow(request, id) {
    const row = (await request().input("MaVaccine", sql.Int, id)
        .query("SELECT * FROM dbo.VACCINE WITH(UPDLOCK,HOLDLOCK) WHERE MaVaccine=@MaVaccine")).recordset[0];
    if (!row) fail("Không tìm thấy vaccine.", 404);
    return row;
}
const create = (data, actor) => write(actor, async request => {
    const row = (await fields(request(), data).query(`
        INSERT dbo.VACCINE(TenVaccine,LoaiVaccine,NhaSanXuat,MoTa,SoMuiKhuyenNghi,KhoangCachMui)
        VALUES(@TenVaccine,@LoaiVaccine,@NhaSanXuat,@MoTa,@SoMuiKhuyenNghi,@KhoangCachMui);
        SELECT * FROM dbo.VACCINE WHERE MaVaccine=CONVERT(int,SCOPE_IDENTITY());`)).recordset[0];
    await audit(request, row.MaVaccine, "Thêm vaccine", null, row);
    return row;
});
const update = (id, data, actor) => write(actor, async request => {
    const before = await currentRow(request, id);
    const row = (await fields(request().input("MaVaccine", sql.Int, id), data).query(`
        UPDATE dbo.VACCINE SET TenVaccine=@TenVaccine,LoaiVaccine=@LoaiVaccine,NhaSanXuat=@NhaSanXuat,
            MoTa=@MoTa,SoMuiKhuyenNghi=@SoMuiKhuyenNghi,KhoangCachMui=@KhoangCachMui
        WHERE MaVaccine=@MaVaccine;
        SELECT * FROM dbo.VACCINE WHERE MaVaccine=@MaVaccine;`)).recordset[0];
    await audit(request, id, "Cập nhật vaccine", before, row);
    return row;
});
const updateStatus = (id, status, actor) => write(actor, async request => {
    const before = await currentRow(request, id);
    if (!status) await request().input("MaVaccine", sql.Int, id).query(`
        IF EXISTS(SELECT 1 FROM dbo.LICHTIEM WITH(UPDLOCK,HOLDLOCK)
            WHERE MaVaccine=@MaVaccine AND TrangThai IN(N'Đã lên lịch',N'Đã xác nhận'))
            THROW 51003,N'Vaccine còn lịch tiêm đang hoạt động. Cần xử lý các lịch trước khi ngừng sử dụng.',1;`);
    const row = (await request().input("MaVaccine", sql.Int, id).input("TrangThai", sql.Bit, status)
        .query(`UPDATE dbo.VACCINE SET TrangThai=@TrangThai WHERE MaVaccine=@MaVaccine;
            SELECT * FROM dbo.VACCINE WHERE MaVaccine=@MaVaccine;`)).recordset[0];
    await audit(request, id, "Đổi trạng thái vaccine", before, row);
    return row;
});
module.exports = { findAll, findById, findByName, create, update, updateStatus };
