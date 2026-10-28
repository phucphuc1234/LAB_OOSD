const { sql } = require("../config/database");


// Danh sách chống chỉ định
const findAll = async () => {
    const pool = await sql.connect();

    const result = await pool.request().query(`
        SELECT
            c.MaChongChiDinh,
            c.MaNguoiDan,
            nd.HoTen,
            c.NoiDung,
            c.NgayXacNhan,
            c.MaNguoiXacNhan,
            tk.TenDangNhap AS NguoiXacNhan,
            c.TrangThai,
            c.GhiChu,
            c.NgayTao
        FROM CHONGCHIDINH c
        INNER JOIN NGUOIDAN nd
            ON c.MaNguoiDan = nd.MaNguoiDan
        LEFT JOIN TAIKHOAN tk
            ON c.MaNguoiXacNhan = tk.MaTaiKhoan
        ORDER BY c.MaChongChiDinh DESC
    `);

    return result.recordset;
};


// Tìm theo ID
const findById = async (id) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "MaChongChiDinh",
            sql.Int,
            id
        )
        .query(`
            SELECT
                c.MaChongChiDinh,
                c.MaNguoiDan,
                nd.HoTen,
                c.NoiDung,
                c.NgayXacNhan,
                c.MaNguoiXacNhan,
                tk.TenDangNhap AS NguoiXacNhan,
                c.TrangThai,
                c.GhiChu,
                c.NgayTao
            FROM CHONGCHIDINH c
            INNER JOIN NGUOIDAN nd
                ON c.MaNguoiDan = nd.MaNguoiDan
            LEFT JOIN TAIKHOAN tk
                ON c.MaNguoiXacNhan = tk.MaTaiKhoan
            WHERE c.MaChongChiDinh =
                @MaChongChiDinh
        `);

    return result.recordset[0] || null;
};


// Lấy theo người dân
const findByCitizenId = async (
    maNguoiDan
) => {
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
                MaChongChiDinh,
                MaNguoiDan,
                NoiDung,
                NgayXacNhan,
                TrangThai,
                GhiChu,
                NgayTao
            FROM CHONGCHIDINH
            WHERE MaNguoiDan = @MaNguoiDan
            ORDER BY MaChongChiDinh DESC
        `);

    return result.recordset;
};


// Thêm chống chỉ định
const create = async (
    data,
    maNguoiXacNhan
) => {
    const pool = await sql.connect();

    const transaction =
        new sql.Transaction(pool);

    try {

        await transaction.begin();

        const request =
            new sql.Request(transaction);

        request.input(
            "MaNguoiDan",
            sql.Int,
            data.maNguoiDan
        );

        request.input(
            "NoiDung",
            sql.NVarChar(500),
            data.noiDung
        );

        request.input(
            "NgayXacNhan",
            sql.DateTime2,
            data.ngayXacNhan
                ? new Date(data.ngayXacNhan)
                : new Date()
        );

        request.input(
            "MaNguoiXacNhan",
            sql.Int,
            maNguoiXacNhan
        );

        request.input(
            "TrangThai",
            sql.NVarChar(50),
            "Đã xác nhận"
        );

        request.input(
            "GhiChu",
            sql.NVarChar(500),
            data.ghiChu || null
        );

        const result =
            await request.query(`
                INSERT INTO CHONGCHIDINH
                (
                    MaNguoiDan,
                    NoiDung,
                    NgayXacNhan,
                    MaNguoiXacNhan,
                    TrangThai,
                    GhiChu
                )

                VALUES
                (
                    @MaNguoiDan,
                    @NoiDung,
                    @NgayXacNhan,
                    @MaNguoiXacNhan,
                    @TrangThai,
                    @GhiChu
                )
            ; SELECT * FROM CHONGCHIDINH WHERE MaChongChiDinh=CONVERT(int,SCOPE_IDENTITY());
        `);

        const record =
            result.recordset[0];


        // Lưu lịch sử
        const historyRequest =
            new sql.Request(transaction);

        historyRequest.input(
            "TenBang",
            sql.VarChar(100),
            "CHONGCHIDINH"
        );

        historyRequest.input(
            "MaBanGhi",
            sql.Int,
            record.MaChongChiDinh
        );

        historyRequest.input(
            "HanhDong",
            sql.NVarChar(50),
            "Thêm mới"
        );

        historyRequest.input(
            "DuLieuMoi",
            sql.NVarChar(sql.MAX),
            JSON.stringify(record)
        );

        historyRequest.input(
            "MaTaiKhoan",
            sql.Int,
            maNguoiXacNhan
        );

        await historyRequest.query(`
            INSERT INTO LICHSUHIEUCHINH
            (
                TenBang,
                MaBanGhi,
                HanhDong,
                DuLieuMoi,
                MaTaiKhoan
            )
            VALUES
            (
                @TenBang,
                @MaBanGhi,
                @HanhDong,
                @DuLieuMoi,
                @MaTaiKhoan
            )
        `);

        await transaction.commit();

        return record;

    } catch (error) {

        try {
            await transaction.rollback();
        } catch (_) { }

        throw error;
    }
};


// Cập nhật chống chỉ định
const update = async (
    id,
    data,
    maTaiKhoan
) => {
    const pool = await sql.connect();

    const transaction =
        new sql.Transaction(pool);

    try {

        await transaction.begin();

        const oldRequest =
            new sql.Request(transaction);

        oldRequest.input(
            "MaChongChiDinh",
            sql.Int,
            id
        );

        const oldResult =
            await oldRequest.query(`
                SELECT *
                FROM CHONGCHIDINH
                WHERE MaChongChiDinh =
                    @MaChongChiDinh
            `);

        const oldData =
            oldResult.recordset[0];


        const request =
            new sql.Request(transaction);

        request.input(
            "MaChongChiDinh",
            sql.Int,
            id
        );

        request.input(
            "NoiDung",
            sql.NVarChar(500),
            data.noiDung ?? null
        );

        request.input(
            "NgayXacNhan",
            sql.DateTime2,
            data.ngayXacNhan
                ? new Date(data.ngayXacNhan)
                : null
        );

        request.input(
            "TrangThai",
            sql.NVarChar(50),
            data.trangThai ?? null
        );

        request.input(
            "GhiChu",
            sql.NVarChar(500),
            data.ghiChu ?? null
        );

        const result =
            await request.query(`
                UPDATE CHONGCHIDINH
                SET
                    NoiDung =
                        COALESCE(
                            @NoiDung,
                            NoiDung
                        ),

                    NgayXacNhan =
                        COALESCE(
                            @NgayXacNhan,
                            NgayXacNhan
                        ),

                    TrangThai =
                        COALESCE(
                            @TrangThai,
                            TrangThai
                        ),

                    GhiChu =
                        COALESCE(
                            @GhiChu,
                            GhiChu
                        )

                WHERE MaChongChiDinh =
                    @MaChongChiDinh;

                SELECT *
                FROM CHONGCHIDINH
                WHERE MaChongChiDinh =
                    @MaChongChiDinh;
            `);

        const newData =
            result.recordset[0];


        const historyRequest =
            new sql.Request(transaction);

        historyRequest.input(
            "TenBang",
            sql.VarChar(100),
            "CHONGCHIDINH"
        );

        historyRequest.input(
            "MaBanGhi",
            sql.Int,
            id
        );

        historyRequest.input(
            "HanhDong",
            sql.NVarChar(50),
            "Cập nhật"
        );

        historyRequest.input(
            "DuLieuCu",
            sql.NVarChar(sql.MAX),
            JSON.stringify(oldData)
        );

        historyRequest.input(
            "DuLieuMoi",
            sql.NVarChar(sql.MAX),
            JSON.stringify(newData)
        );

        historyRequest.input(
            "MaTaiKhoan",
            sql.Int,
            maTaiKhoan
        );

        await historyRequest.query(`
            INSERT INTO LICHSUHIEUCHINH
            (
                TenBang,
                MaBanGhi,
                HanhDong,
                DuLieuCu,
                DuLieuMoi,
                MaTaiKhoan
            )
            VALUES
            (
                @TenBang,
                @MaBanGhi,
                @HanhDong,
                @DuLieuCu,
                @DuLieuMoi,
                @MaTaiKhoan
            )
        `);

        await transaction.commit();

        return newData;

    } catch (error) {

        try {
            await transaction.rollback();
        } catch (_) { }

        throw error;
    }
};


module.exports = {
    findAll,
    findById,
    findByCitizenId,
    create,
    update
};
