const { sql } = require("../config/database");
const { integer, fail } = require("../utils/validation");
const vietnamDay = value => new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 10);
const selection = `SELECT lv.*,v.TenVaccine,cs.TenCoSo,cs.DiaChi AS DiaChiCoSo,
    cs.PhuongXa AS PhuongXaCoSo,cs.TinhThanh AS TinhThanhCoSo
    FROM LOVACCINE lv JOIN VACCINE v ON lv.MaVaccine=v.MaVaccine
    JOIN COSOTIEM cs ON cs.MaCoSoTiem=lv.MaCoSoTiem`;
const findAll = async actor => {
    const pool = await sql.connect();
    return (await pool.request().input("ActorId",sql.Int,integer(actor,"Tài khoản"))
        .query(`${selection} WHERE dbo.fn_CoSoDuocPhep(@ActorId,lv.MaCoSoTiem)=1 ORDER BY lv.MaLo DESC`)).recordset;
};
const findById = async (id,actor) => {
    const pool = await sql.connect();
    return (await pool.request().input("MaLo",sql.Int,id).input("ActorId",sql.Int,integer(actor,"Tài khoản"))
        .query(`${selection} WHERE lv.MaLo=@MaLo AND dbo.fn_CoSoDuocPhep(@ActorId,lv.MaCoSoTiem)=1`)).recordset[0] || null;
};
const findByCode = async code => {
    const pool = await sql.connect();
    return (await pool.request().input("MaLoVaccine",sql.VarChar(50),code)
        .query("SELECT MaLo,MaLoVaccine,MaVaccine FROM LOVACCINE WHERE MaLoVaccine=@MaLoVaccine")).recordset[0] || null;
};
async function lockInventory(transaction) {
    await new sql.Request(transaction).query(`
        DECLARE @LockResult int;
        EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',
            @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=10000;
        IF @LockResult<0 THROW 51003,N'Dữ liệu kho đang được xử lý. Vui lòng thử lại.',1;`);
}
// Hold role and assignment locks until commit: revocation cannot race the mutation.
async function checkPermission(transaction,actor,facility) {
    const row = (await new sql.Request(transaction).input("ActorId",sql.Int,actor).input("FacilityId",sql.Int,facility)
        .query(`DECLARE @PermissionLock int;
            SELECT @PermissionLock=t.MaTaiKhoan FROM dbo.TAIKHOAN t WITH(HOLDLOCK)
                JOIN dbo.VAITRO r WITH(HOLDLOCK) ON r.MaVaiTro=t.MaVaiTro WHERE t.MaTaiKhoan=@ActorId;
            SELECT @PermissionLock=p.MaTaiKhoan FROM dbo.PHANCONG_COSOTIEM p WITH(HOLDLOCK)
                WHERE p.MaTaiKhoan=@ActorId AND p.MaCoSoTiem=@FacilityId;
            SELECT dbo.fn_CoSoDuocPhep(@ActorId,@FacilityId) AS HasPermission;`)).recordset[0];
    if (!row?.HasPermission) fail("Bạn không được phân công quản lý cơ sở tiêm này.",403);
}
async function checkOffering(transaction,facility,vaccine) {
    const row = (await new sql.Request(transaction).input("FacilityId",sql.Int,facility).input("VaccineId",sql.Int,vaccine)
        .query(`SELECT CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.COSOTIEM cs WITH(HOLDLOCK)
            JOIN dbo.KHUVUCTIEM kv WITH(HOLDLOCK) ON kv.MaKhuVuc=cs.MaKhuVuc
            JOIN dbo.COSOTIEM_VACCINE cv WITH(HOLDLOCK) ON cv.MaCoSoTiem=cs.MaCoSoTiem AND cv.MaVaccine=@VaccineId
            JOIN dbo.VACCINE v WITH(HOLDLOCK) ON v.MaVaccine=cv.MaVaccine
            WHERE cs.MaCoSoTiem=@FacilityId AND cs.TrangThai=1 AND kv.TrangThai=1
                AND cv.TrangThai=1 AND v.TrangThai=1 AND cs.TinhThanh=N'Thành phố Hồ Chí Minh') THEN 1 ELSE 0 END AS bit) AS IsAvailable;`)).recordset[0];
    if (!row?.IsAvailable) fail("Cơ sở hoặc vaccine đang ngừng phục vụ; hãy kiểm tra danh mục vaccine tại cơ sở.",409);
}
const create = async (data,actor) => {
    actor=integer(actor,"Tài khoản");
    const pool=await sql.connect(), transaction=new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        await lockInventory(transaction);
        await checkPermission(transaction,actor,data.maCoSoTiem);
        await checkOffering(transaction,data.maCoSoTiem,data.maVaccine);
        const result=await new sql.Request(transaction)
            .input("MaCoSoTiem",sql.Int,data.maCoSoTiem).input("MaLoVaccine",sql.VarChar(50),data.maLoVaccine)
            .input("MaVaccine",sql.Int,data.maVaccine).input("NgaySanXuat",sql.Date,data.ngaySanXuat || null)
            .input("HanSuDung",sql.Date,data.hanSuDung).input("SoLuongNhap",sql.Int,data.soLuongNhap)
            .input("SoLuongCon",sql.Int,data.soLuongCon).input("TrangThai",sql.NVarChar(50),data.trangThai)
            .input("GhiChu",sql.NVarChar(255),data.ghiChu || null).query(`
                INSERT dbo.LOVACCINE(MaCoSoTiem,MaLoVaccine,MaVaccine,NgaySanXuat,HanSuDung,SoLuongNhap,SoLuongCon,TrangThai,GhiChu)
                VALUES(@MaCoSoTiem,@MaLoVaccine,@MaVaccine,@NgaySanXuat,@HanSuDung,@SoLuongNhap,@SoLuongCon,@TrangThai,@GhiChu);
                SELECT * FROM dbo.LOVACCINE WHERE MaLo=CONVERT(int,SCOPE_IDENTITY());`);
        await transaction.commit();return result.recordset[0];
    } catch(error) {try {await transaction.rollback();} catch(_) { /* retain original failure */ } throw error;}
};
const edit = async (id,data,actor,statusOnly=false) => {
    actor=integer(actor,"Tài khoản");
    const pool=await sql.connect(), transaction=new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        await lockInventory(transaction);
        const old=(await new sql.Request(transaction).input("Id",sql.Int,id)
            .query("SELECT * FROM LOVACCINE WITH (UPDLOCK,HOLDLOCK) WHERE MaLo=@Id")).recordset[0];
        if(!old) fail("Không tìm thấy lô vaccine.",404);
        await checkPermission(transaction,actor,old.MaCoSoTiem);
        const status=data.trangThai ?? old.TrangThai;
        if(!statusOnly && data.maCoSoTiem!==old.MaCoSoTiem) fail("Không được chuyển lô vaccine đã nhập sang cơ sở khác.",409);
        if(!statusOnly && (data.soLuongNhap!==old.SoLuongNhap || data.soLuongCon!==old.SoLuongCon))
            fail("Không được chỉnh số lượng nhập/còn của lô đã tạo; hãy tải lại dữ liệu hoặc tạo lô mới để nhập bổ sung.",409);
        if(old.SoLuongDatTruoc>0 && status!=="Đang sử dụng")
            fail("Lô đang được giữ cho lịch tiêm. Vui lòng dời hoặc hủy các lịch liên quan trước.",409);
        const expiry=new Date(data.hanSuDung ?? old.HanSuDung);
        if(status==="Đang sử dụng" && (old.SoLuongCon<=0 || expiry.toISOString().slice(0,10)<vietnamDay(new Date())))
            fail("Không thể sử dụng lô đã hết hàng hoặc hết hạn.",409);
        if(status==="Hết hàng" && old.SoLuongCon!==0) fail("Lô vẫn còn vaccine, không thể đánh dấu hết hàng.",409);
        if(status==="Hết hạn" && expiry.toISOString().slice(0,10)>=vietnamDay(new Date())) fail("Lô chưa hết hạn sử dụng.",409);
        if(status==="Đang sử dụng") await checkOffering(transaction,old.MaCoSoTiem,old.MaVaccine);
        if(!statusOnly) {
            const reserved=(await new sql.Request(transaction).input("Id",sql.Int,id)
                .query("SELECT MAX(NgayDuKien) AS LastAppointment FROM LICHTIEM WHERE MaLoDuKien=@Id AND TrangThai IN (N'Đã lên lịch',N'Đã xác nhận')")).recordset[0]?.LastAppointment;
            if(reserved && expiry.toISOString().slice(0,10)<vietnamDay(reserved))
                fail("Hạn sử dụng phải bao phủ các lịch tiêm đã đặt trước.",409);
        }
        const request=new sql.Request(transaction).input("Id",sql.Int,id).input("TrangThai",sql.NVarChar(50),status);
        if(statusOnly) await request.query("UPDATE LOVACCINE SET TrangThai=@TrangThai WHERE MaLo=@Id;");
        else await request.input("NgaySanXuat",sql.Date,data.ngaySanXuat).input("HanSuDung",sql.Date,expiry)
            .input("GhiChu",sql.NVarChar(255),data.ghiChu).query(`UPDATE LOVACCINE SET NgaySanXuat=@NgaySanXuat,HanSuDung=@HanSuDung,
                GhiChu=@GhiChu,TrangThai=@TrangThai WHERE MaLo=@Id;`);
        const result=await new sql.Request(transaction).input("Id",sql.Int,id).query("SELECT * FROM LOVACCINE WHERE MaLo=@Id");
        await transaction.commit();return result.recordset[0];
    } catch(error) {try {await transaction.rollback();} catch(_) { /* retain original failure */ } throw error;}
};
const update=(id,data,actor)=>edit(id,data,actor);
const updateStatus=(id,status,actor)=>edit(id,{trangThai:status},actor,true);
module.exports={findAll,findById,findByCode,create,update,updateStatus};
