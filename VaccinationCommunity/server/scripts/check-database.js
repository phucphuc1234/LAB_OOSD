const { connectDB, sql, databaseConfig } = require("../config/database");
async function main() {
    const pool = await connectDB();
    try {
        const result = await pool.request().query(`
            SELECT N'Tài khoản' AS Entity,COUNT_BIG(*) AS Records FROM dbo.TAIKHOAN
            UNION ALL SELECT N'Người dân',COUNT_BIG(*) FROM dbo.NGUOIDAN
            UNION ALL SELECT N'Vaccine',COUNT_BIG(*) FROM dbo.VACCINE
            UNION ALL SELECT N'Lô vaccine',COUNT_BIG(*) FROM dbo.LOVACCINE
            UNION ALL SELECT N'Lịch hẹn',COUNT_BIG(*) FROM dbo.LICHTIEM
            UNION ALL SELECT N'Mũi tiêm',COUNT_BIG(*) FROM dbo.MUITIEM
            UNION ALL SELECT N'Phiếu sau tiêm',COUNT_BIG(*) FROM dbo.THEODOISAUTIEM
            UNION ALL SELECT N'Khu vực phục vụ',COUNT_BIG(*) FROM dbo.KHUVUCTIEM
            UNION ALL SELECT N'Cơ sở tiêm',COUNT_BIG(*) FROM dbo.COSOTIEM
            UNION ALL SELECT N'Phân công nhân viên',COUNT_BIG(*) FROM dbo.PHANCONG_COSOTIEM;
            SELECT type_desc,COUNT(*) AS Records FROM sys.objects
            WHERE schema_id=SCHEMA_ID(N'dbo') AND type IN('P','V','TR') GROUP BY type_desc;`);
        console.log(`SQL Server đã kết nối: ${databaseConfig.database}`);
        console.table(result.recordsets[0]); console.table(result.recordsets[1]);
        const anomalies = await pool.request().query(`
            SELECT COUNT(*) AS Problems FROM dbo.LOVACCINE
            WHERE SoLuongCon<0 OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon;
            SELECT COUNT(*) AS Problems FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem
            WHERE d.MaNguoiDan<>m.MaNguoiDan;
            SELECT COUNT(*) AS Problems FROM dbo.LICHTIEM l JOIN dbo.LOVACCINE b ON b.MaLo=l.MaLoDuKien
            WHERE l.MaCoSoTiem<>b.MaCoSoTiem;
            SELECT COUNT(*) AS Problems FROM dbo.MUITIEM m JOIN dbo.LOVACCINE b ON b.MaLo=m.MaLo
            WHERE m.MaCoSoTiem<>b.MaCoSoTiem;
            SELECT COUNT(*) AS Problems FROM dbo.COSOTIEM WHERE TinhThanh<>N'Thành phố Hồ Chí Minh';`);
        if (anomalies.recordsets.some(rows => rows[0].Problems > 0)) throw new Error("Phát hiện dữ liệu tồn kho hoặc chủ sở hữu phiếu theo dõi không hợp lệ.");
        console.log("Kiểm tra tồn kho, chủ sở hữu, liên kết cơ sở và giới hạn TP. Hồ Chí Minh: đạt.");
        const held = await pool.request().query(`SELECT
            (SELECT COUNT_BIG(*) FROM dbo.LOVACCINE l JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=l.MaCoSoTiem WHERE c.TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát')+
            (SELECT COUNT_BIG(*) FROM dbo.LICHTIEM l JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=l.MaCoSoTiem WHERE c.TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát')+
            (SELECT COUNT_BIG(*) FROM dbo.MUITIEM l JOIN dbo.COSOTIEM c ON c.MaCoSoTiem=l.MaCoSoTiem WHERE c.TenCoSo=N'Cơ sở dữ liệu cũ — cần đối soát') AS Records;`);
        if (held.recordset[0].Records > 0) console.log("Có cơ sở lưu giữ dữ liệu cũ: admin xem hướng dẫn docs/facility-upgrade.md để đối soát trước khi cấp quyền.");
    } finally { await sql.close(); }
}
main().catch(error => { console.error(`Kiểm tra database thất bại: ${error.message}`); process.exitCode = 1; });
