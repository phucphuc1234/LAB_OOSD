const { sql } = require('../config/database');
const { fail } = require('../utils/validation');
const CITY = 'Thành phố Hồ Chí Minh';
const adminCheck = `IF NOT EXISTS(SELECT 1 FROM dbo.TAIKHOAN t WITH(UPDLOCK,HOLDLOCK)
    JOIN dbo.VAITRO v WITH(HOLDLOCK) ON v.MaVaiTro=t.MaVaiTro
    WHERE t.MaTaiKhoan=@ActorId AND t.TrangThai=1 AND v.TrangThai=1 AND v.TenVaiTro=N'Quản trị viên')
    THROW 51002,N'Chỉ quản trị viên đang hoạt động được thực hiện thao tác này.',1;`;
async function transaction(actorId, operation, admin = true) {
    const pool = await sql.connect(), tx = new sql.Transaction(pool);
    try {
        await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        const request = () => new sql.Request(tx).input('ActorId', sql.Int, actorId);
        // Keep the same lock order as booking, stock edits and global catalog
        // changes, before locking role/assignment rows or active appointments.
        await request().query(`DECLARE @LockResult int;
            EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',
                @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=10000;
            IF @LockResult<0 THROW 51003,N'Dữ liệu đang được cập nhật. Vui lòng thử lại.',1;`);
        if (admin) await request().query(adminCheck);
        const result = await operation(request);
        await tx.commit();
        return result;
    } catch (error) {
        try { await tx.rollback(); } catch (_) { /* preserve original failure */ }
        throw error;
    }
}
async function audit(request, table, id, action, before, after) {
    await request().input('TableName', sql.VarChar(100), table).input('RecordId', sql.Int, id)
        .input('Action', sql.NVarChar(100), action)
        .input('Before', sql.NVarChar(sql.MAX), before == null ? null : JSON.stringify(before))
        .input('After', sql.NVarChar(sql.MAX), JSON.stringify(after))
        .query(`INSERT dbo.LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi,MaTaiKhoan)
            VALUES(@TableName,@RecordId,@Action,@Before,@After,@ActorId);`);
}
async function areas(includeInactive = false) {
    const pool = await sql.connect();
    return (await pool.request().input('IncludeInactive', sql.Bit, includeInactive).query(`
        SELECT * FROM dbo.KHUVUCTIEM WHERE (@IncludeInactive=1 OR TrangThai=1) ORDER BY TenKhuVuc`)).recordset;
}
async function facilities(actor, { vaccineId = null, appointmentDate = null, includeInactive = false } = {}) {
    const pool = await sql.connect();
    return (await pool.request().input('ActorId', sql.Int, actor).input('VaccineId', sql.Int, vaccineId)
        .input('AppointmentDate', sql.DateTime2, appointmentDate || new Date())
        .input('IncludeInactive', sql.Bit, includeInactive).query(`
        DECLARE @Role nvarchar(50);
        SELECT @Role=v.TenVaiTro FROM dbo.TAIKHOAN t JOIN dbo.VAITRO v ON v.MaVaiTro=t.MaVaiTro
            WHERE t.MaTaiKhoan=@ActorId AND t.TrangThai=1 AND v.TrangThai=1;
        SELECT c.*,k.TenKhuVuc,k.TrangThai AS KhuVucHoatDong,ISNULL(stock.Available,0) AS SoLieuKhaDung
        FROM dbo.COSOTIEM c JOIN dbo.KHUVUCTIEM k ON k.MaKhuVuc=c.MaKhuVuc
        OUTER APPLY(SELECT SUM(CONVERT(bigint,l.SoLuongCon-l.SoLuongDatTruoc)) AS Available
            FROM dbo.LOVACCINE l WHERE l.MaCoSoTiem=c.MaCoSoTiem AND l.TrangThai=N'Đang sử dụng'
                AND l.HanSuDung>=CAST(DATEADD(hour,7,@AppointmentDate) AS date) AND (@VaccineId IS NULL OR l.MaVaccine=@VaccineId)) stock
        WHERE ((@Role=N'Người dân' AND c.TrangThai=1 AND k.TrangThai=1)
            OR (@Role IN(N'Nhân viên',N'Quản trị viên') AND dbo.fn_CoSoDuocPhep(@ActorId,c.MaCoSoTiem)=1
                AND (@IncludeInactive=1 OR (c.TrangThai=1 AND k.TrangThai=1))))
          AND (@VaccineId IS NULL OR (ISNULL(stock.Available,0)>0 AND EXISTS(
                SELECT 1 FROM dbo.COSOTIEM_VACCINE cv JOIN dbo.VACCINE v ON v.MaVaccine=cv.MaVaccine
                WHERE cv.MaCoSoTiem=c.MaCoSoTiem AND cv.MaVaccine=@VaccineId AND cv.TrangThai=1 AND v.TrangThai=1)))
        ORDER BY k.TenKhuVuc,c.TenCoSo;`)).recordset;
}
async function saveArea(actor, id, data) {
    return transaction(actor, async request => {
        let old = null;
        if (id) {
            old = (await request().input('Id', sql.Int, id).query('SELECT * FROM dbo.KHUVUCTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaKhuVuc=@Id')).recordset[0];
            if (!old) fail('Không tìm thấy khu vực.', 404);
        }
        const req = request().input('Id', sql.Int, id).input('Name', sql.NVarChar(150), data.tenKhuVuc)
            .input('City', sql.NVarChar(100), CITY).input('Active', sql.Bit, data.trangThai);
        if (!data.trangThai && id) await request().input('Id', sql.Int, id).query(`
            IF EXISTS(SELECT 1 FROM dbo.LICHTIEM l JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=l.MaCoSoTiem
                WHERE c.MaKhuVuc=@Id AND l.TrangThai IN(N'Đã lên lịch',N'Đã xác nhận'))
            THROW 51003,N'Khu vực còn lịch tiêm đang hoạt động; cần xử lý các lịch trước khi ngừng.',1;`);
        const row = (await req.query(id ? `UPDATE dbo.KHUVUCTIEM SET TenKhuVuc=@Name,TrangThai=@Active
            OUTPUT INSERTED.* WHERE MaKhuVuc=@Id;` : `INSERT dbo.KHUVUCTIEM(TenKhuVuc,TinhThanh,TrangThai)
            OUTPUT INSERTED.* VALUES(@Name,@City,@Active);`)).recordset[0];
        await audit(request, 'KHUVUCTIEM', row.MaKhuVuc, id ? 'Cập nhật khu vực' : 'Thêm khu vực', old, row);
        return row;
    });
}
async function saveFacility(actor, id, data) {
    return transaction(actor, async request => {
        let old = null;
        if (id) {
            old = (await request().input('Id', sql.Int, id).query('SELECT * FROM dbo.COSOTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaCoSoTiem=@Id')).recordset[0];
            if (!old) fail('Không tìm thấy cơ sở tiêm.', 404);
        }
        const area = (await request().input('AreaId', sql.Int, data.maKhuVuc)
            .query('SELECT * FROM dbo.KHUVUCTIEM WITH(HOLDLOCK) WHERE MaKhuVuc=@AreaId')).recordset[0];
        if (!area || (data.trangThai && !area.TrangThai)) fail('Cần chọn khu vực đang hoạt động trong TP. Hồ Chí Minh.', 409);
        if (!data.trangThai && id) await request().input('Id', sql.Int, id).query(`
            IF EXISTS(SELECT 1 FROM dbo.LICHTIEM WHERE MaCoSoTiem=@Id AND TrangThai IN(N'Đã lên lịch',N'Đã xác nhận'))
                THROW 51003,N'Cơ sở còn lịch tiêm đang hoạt động; cần xử lý các lịch trước khi ngừng.',1;`);
        const row = (await request().input('Id', sql.Int, id).input('AreaId', sql.Int, data.maKhuVuc)
            .input('Name', sql.NVarChar(150), data.tenCoSo).input('Address', sql.NVarChar(255), data.diaChi)
            .input('Ward', sql.NVarChar(100), data.phuongXa).input('City', sql.NVarChar(100), CITY)
            .input('Phone', sql.VarChar(20), data.soDienThoai).input('Active', sql.Bit, data.trangThai)
            .input('Notes', sql.NVarChar(1000), data.ghiChu).query(id ? `
                UPDATE dbo.COSOTIEM SET MaKhuVuc=@AreaId,TenCoSo=@Name,DiaChi=@Address,PhuongXa=@Ward,
                    TinhThanh=@City,SoDienThoai=@Phone,TrangThai=@Active,GhiChu=@Notes
                OUTPUT INSERTED.* WHERE MaCoSoTiem=@Id;` : `
                INSERT dbo.COSOTIEM(MaKhuVuc,TenCoSo,DiaChi,PhuongXa,TinhThanh,SoDienThoai,TrangThai,GhiChu)
                OUTPUT INSERTED.* VALUES(@AreaId,@Name,@Address,@Ward,@City,@Phone,@Active,@Notes);`)).recordset[0];
        await audit(request, 'COSOTIEM', row.MaCoSoTiem, id ? 'Cập nhật cơ sở' : 'Thêm cơ sở', old, row);
        return row;
    });
}
async function assignments() {
    const pool = await sql.connect();
    const result = await pool.request().query(`
        SELECT t.MaTaiKhoan,t.TenDangNhap,t.Email,t.TrangThai FROM dbo.TAIKHOAN t
            JOIN dbo.VAITRO v ON v.MaVaiTro=t.MaVaiTro WHERE v.TenVaiTro=N'Nhân viên' ORDER BY t.TenDangNhap;
        SELECT p.*,c.TenCoSo,k.TenKhuVuc FROM dbo.PHANCONG_COSOTIEM p
            JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=p.MaCoSoTiem JOIN dbo.KHUVUCTIEM k ON k.MaKhuVuc=c.MaKhuVuc;`);
    return { staff: result.recordsets[0], assignments: result.recordsets[1] };
}
async function assign(actor, accountId, facilityIds) {
    return transaction(actor, async request => {
        const target = (await request().input('TargetId', sql.Int, accountId).query(`
            SELECT t.MaTaiKhoan FROM dbo.TAIKHOAN t WITH(UPDLOCK,HOLDLOCK) JOIN dbo.VAITRO v WITH(HOLDLOCK) ON v.MaVaiTro=t.MaVaiTro
            WHERE t.MaTaiKhoan=@TargetId AND t.TrangThai=1 AND v.TrangThai=1 AND v.TenVaiTro=N'Nhân viên'`)).recordset[0];
        if (!target) fail('Chỉ phân công cho tài khoản Nhân viên đang hoạt động.', 409);
        for (const id of facilityIds) {
            const facility = (await request().input('Id', sql.Int, id).input('TargetId', sql.Int, accountId).query(`
                SELECT c.MaCoSoTiem FROM dbo.COSOTIEM c WITH(HOLDLOCK) JOIN dbo.KHUVUCTIEM k WITH(HOLDLOCK) ON k.MaKhuVuc=c.MaKhuVuc
                WHERE c.MaCoSoTiem=@Id AND ((c.TrangThai=1 AND k.TrangThai=1) OR EXISTS(
                    SELECT 1 FROM dbo.PHANCONG_COSOTIEM WITH(HOLDLOCK) WHERE MaTaiKhoan=@TargetId AND MaCoSoTiem=@Id))`)).recordset[0];
            if (!facility) fail('Danh sách có cơ sở không tồn tại hoặc đang ngừng hoạt động.', 409);
        }
        const before = (await request().input('TargetId', sql.Int, accountId)
            .query('SELECT MaCoSoTiem FROM dbo.PHANCONG_COSOTIEM WITH(UPDLOCK,HOLDLOCK) WHERE MaTaiKhoan=@TargetId')).recordset;
        await request().input('TargetId', sql.Int, accountId).query('DELETE dbo.PHANCONG_COSOTIEM WHERE MaTaiKhoan=@TargetId');
        for (const id of facilityIds) await request().input('TargetId', sql.Int, accountId).input('FacilityId', sql.Int, id)
            .query(`INSERT dbo.PHANCONG_COSOTIEM(MaTaiKhoan,MaCoSoTiem,MaNguoiPhanCong) VALUES(@TargetId,@FacilityId,@ActorId)`);
        await audit(request, 'PHANCONG_COSOTIEM', accountId, 'Phân công cơ sở', before, facilityIds);
        return { maTaiKhoan: accountId, maCoSoTiemIds: facilityIds };
    });
}
async function offerings(actor, facilityId) {
    const pool = await sql.connect();
    return (await pool.request().input('ActorId', sql.Int, actor).input('FacilityId', sql.Int, facilityId).query(`
        SELECT v.MaVaccine,v.TenVaccine,v.TrangThai AS VaccineHoatDong,ISNULL(cv.TrangThai,0) AS TrangThai
        FROM dbo.VACCINE v LEFT JOIN dbo.COSOTIEM_VACCINE cv ON cv.MaVaccine=v.MaVaccine AND cv.MaCoSoTiem=@FacilityId
        WHERE dbo.fn_CoSoDuocPhep(@ActorId,@FacilityId)=1 ORDER BY v.TenVaccine;`)).recordset;
}
async function saveOffering(actor, facilityId, vaccineId, active) {
    return transaction(actor, async request => {
        await request().input('FacilityId', sql.Int, facilityId).input('VaccineId', sql.Int, vaccineId)
            .input('Active', sql.Bit, active).query(`
            IF NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM WITH(HOLDLOCK) WHERE MaCoSoTiem=@FacilityId)
                THROW 51001,N'Không tìm thấy cơ sở tiêm.',1;
            IF dbo.fn_CoSoDuocPhep(@ActorId,@FacilityId)<>1
                THROW 51002,N'Cơ sở không thuộc phạm vi được giao.',1;
            IF @Active=1 AND NOT EXISTS(SELECT 1 FROM dbo.COSOTIEM c WITH(HOLDLOCK) JOIN dbo.KHUVUCTIEM k WITH(HOLDLOCK)
                ON k.MaKhuVuc=c.MaKhuVuc WHERE c.MaCoSoTiem=@FacilityId AND c.TrangThai=1 AND k.TrangThai=1)
                THROW 51003,N'Cơ sở hoặc khu vực đang ngừng hoạt động.',1;
            IF NOT EXISTS(SELECT 1 FROM dbo.VACCINE WITH(HOLDLOCK) WHERE MaVaccine=@VaccineId AND (@Active=0 OR TrangThai=1))
                THROW 51003,N'Vaccine không tồn tại hoặc đang ngừng sử dụng.',1;
            IF @Active=0 AND EXISTS(SELECT 1 FROM dbo.LICHTIEM WHERE MaCoSoTiem=@FacilityId AND MaVaccine=@VaccineId
                AND TrangThai IN(N'Đã lên lịch',N'Đã xác nhận'))
                THROW 51003,N'Vaccine còn lịch tiêm đang hoạt động tại cơ sở này.',1;`);
        const old = (await request().input('FacilityId', sql.Int, facilityId).input('VaccineId', sql.Int, vaccineId)
            .query('SELECT * FROM dbo.COSOTIEM_VACCINE WITH(UPDLOCK,HOLDLOCK) WHERE MaCoSoTiem=@FacilityId AND MaVaccine=@VaccineId')).recordset[0];
        const result = { MaCoSoTiem: facilityId, MaVaccine: vaccineId, TrangThai: active };
        await request().input('FacilityId', sql.Int, facilityId).input('VaccineId', sql.Int, vaccineId).input('Active', sql.Bit, active)
            .query(old ? 'UPDATE dbo.COSOTIEM_VACCINE SET TrangThai=@Active WHERE MaCoSoTiem=@FacilityId AND MaVaccine=@VaccineId'
                : 'INSERT dbo.COSOTIEM_VACCINE(MaCoSoTiem,MaVaccine,TrangThai) VALUES(@FacilityId,@VaccineId,@Active)');
        await audit(request, 'COSOTIEM_VACCINE', facilityId, 'Cập nhật vaccine tại cơ sở', old, result);
        return result;
    }, false);
}
module.exports = { CITY, areas, facilities, saveArea, saveFacility, assignments, assign, offerings, saveOffering };
