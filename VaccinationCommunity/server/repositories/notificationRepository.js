const { sql } = require("../config/database");


// Lấy thông báo của người dân theo tài khoản
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
                tb.MaThongBao,
                tb.MaNguoiDan,
                tb.MaLichTiem,
                tb.TieuDe,
                tb.NoiDung,
                tb.ThoiGianGui,
                tb.KenhGui,
                tb.TrangThai,
                tb.DaDoc,
                tb.NgayTao
            FROM THONGBAO tb
            INNER JOIN NGUOIDAN nd
                ON tb.MaNguoiDan = nd.MaNguoiDan
            WHERE nd.MaTaiKhoan = @MaTaiKhoan
            ORDER BY tb.NgayTao DESC
        `);

    return result.recordset;
};


// Tìm thông báo theo ID
const findById = async (maThongBao) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaThongBao",
            sql.Int,
            maThongBao
        )
        .query(`
            SELECT *
            FROM THONGBAO
            WHERE MaThongBao = @MaThongBao
        `);

    return result.recordset[0] || null;
};


// Tìm hồ sơ người dân từ tài khoản
const findCitizenByAccountId = async (
    maTaiKhoan
) => {
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
                MaNguoiDan
            FROM NGUOIDAN
            WHERE MaTaiKhoan = @MaTaiKhoan
        `);

    return result.recordset[0] || null;
};


// Đánh dấu đã đọc
const markAsRead = async (
    maThongBao
) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaThongBao",
            sql.Int,
            maThongBao
        )
        .query(`
            UPDATE THONGBAO
            SET DaDoc = 1
            WHERE MaThongBao = @MaThongBao;

            SELECT *
            FROM THONGBAO
            WHERE MaThongBao = @MaThongBao;
        `);

    return result.recordset[0] || null;
};


// Tìm lịch sắp đến hạn

// =========================
// LẤY LỊCH SẮP TỚI 0 - 3 NGÀY
// =========================
const findUpcomingSchedules = async (daysAhead = 3) => {

    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "DaysAhead",
            sql.Int,
            daysAhead
        )
        .query(`
            SELECT
                LT.MaLichTiem,
                LT.MaNguoiDan,
                LT.MaVaccine,
                LT.MuiSo,
                LT.NgayDuKien,
                LT.CoSoTiem,
                LT.TrangThai,
                V.TenVaccine

            FROM LICHTIEM LT

            INNER JOIN VACCINE V
                ON V.MaVaccine = LT.MaVaccine

            WHERE LT.TrangThai = N'Đã xác nhận'
                AND LT.NgayDuKien >= SYSUTCDATETIME()
                AND DATEDIFF(DAY,
                    CAST(DATEADD(HOUR,7,SYSUTCDATETIME()) AS DATE),
                    CAST(DATEADD(HOUR,7,LT.NgayDuKien) AS DATE)) BETWEEN 0 AND @DaysAhead
            ORDER BY
                LT.NgayDuKien ASC
        `);

    return result.recordset;
};


// =========================
// KIỂM TRA ĐÃ TẠO NHẮC LỊCH CHƯA
// =========================
const existsForSchedule = async (
    maLichTiem
) => {

    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaLichTiem",
            sql.Int,
            maLichTiem
        )
        .query(`
            SELECT TOP 1
                MaThongBao

            FROM THONGBAO

            WHERE
                MaLichTiem = @MaLichTiem
                AND TieuDe = N'Nhắc lịch tiêm'
        `);

    return result.recordset.length > 0;
};


// =========================
// TẠO THÔNG BÁO NHẮC LỊCH
// =========================
const createReminder = async ({ maNguoiDan, maLichTiem, tieuDe, noiDung }) => {
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        await new sql.Request(transaction).query(`
            DECLARE @LockResult int;
            EXEC @LockResult=sys.sp_getapplock @Resource=N'VaccinationCommunity.Inventory',
                @LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=10000;
            IF @LockResult<0 THROW 51003,N'Dữ liệu đang được xử lý. Vui lòng thử lại.',1;
        `);
        const result = await new sql.Request(transaction)
            .input("MaNguoiDan", sql.Int, maNguoiDan)
            .input("MaLichTiem", sql.Int, maLichTiem)
            .input("TieuDe", sql.NVarChar(200), tieuDe)
            .input("NoiDung", sql.NVarChar(1000), noiDung)
            .query(`
                IF NOT EXISTS (SELECT 1 FROM THONGBAO WITH (UPDLOCK,HOLDLOCK)
                    WHERE MaLichTiem=@MaLichTiem AND TieuDe=@TieuDe)
                AND EXISTS (SELECT 1 FROM LICHTIEM WITH (HOLDLOCK) WHERE MaLichTiem=@MaLichTiem
                    AND MaNguoiDan=@MaNguoiDan AND TrangThai=N'Đã xác nhận'
                    AND NgayDuKien>=SYSUTCDATETIME())
                BEGIN
                    INSERT INTO THONGBAO (MaNguoiDan,MaLichTiem,TieuDe,NoiDung,ThoiGianGui,KenhGui,TrangThai,DaDoc,NgayTao)
                    OUTPUT INSERTED.*
                    VALUES (@MaNguoiDan,@MaLichTiem,@TieuDe,@NoiDung,SYSUTCDATETIME(),N'Website',N'Đã gửi',0,SYSUTCDATETIME());
                END;
            `);
        await transaction.commit();
        return result.recordset?.[0] || null;
    } catch (error) {
        try { await transaction.rollback(); } catch (_) { /* preserve original error */ }
        throw error;
    }
};
module.exports = {
    findByAccountId,
    findById,
    findCitizenByAccountId,
    markAsRead,
    findUpcomingSchedules,
    existsForSchedule,
    createReminder
};
