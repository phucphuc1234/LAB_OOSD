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
            UNION ALL SELECT N'Phiếu sau tiêm',COUNT_BIG(*) FROM dbo.THEODOISAUTIEM;
            SELECT type_desc,COUNT(*) AS Records FROM sys.objects
            WHERE schema_id=SCHEMA_ID(N'dbo') AND type IN('P','V','TR') GROUP BY type_desc;`);
        console.log(`SQL Server đã kết nối: ${databaseConfig.database}`);
        console.table(result.recordsets[0]); console.table(result.recordsets[1]);
        const anomalies = await pool.request().query(`
            SELECT COUNT(*) AS Problems FROM dbo.LOVACCINE
            WHERE SoLuongCon<0 OR SoLuongDatTruoc<0 OR SoLuongDatTruoc>SoLuongCon;
            SELECT COUNT(*) AS Problems FROM dbo.THEODOISAUTIEM d JOIN dbo.MUITIEM m ON m.MaMuiTiem=d.MaMuiTiem
            WHERE d.MaNguoiDan<>m.MaNguoiDan;`);
        if (anomalies.recordsets.some(rows => rows[0].Problems > 0)) throw new Error("Phát hiện dữ liệu tồn kho hoặc chủ sở hữu phiếu theo dõi không hợp lệ.");
        console.log("Kiểm tra cơ bản tồn kho và chủ sở hữu phiếu theo dõi: đạt.");
    } finally { await sql.close(); }
}
main().catch(error => { console.error(`Kiểm tra database thất bại: ${error.message}`); process.exitCode = 1; });
