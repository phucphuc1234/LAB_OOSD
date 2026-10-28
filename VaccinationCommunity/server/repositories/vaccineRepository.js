const { sql } = require("../config/database");


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


// Thêm vaccine
const create = async (data) => {
    const pool = await sql.connect();

    const result = await pool
        .request()

        .input(
            "TenVaccine",
            sql.NVarChar(150),
            data.tenVaccine
        )

        .input(
            "LoaiVaccine",
            sql.NVarChar(100),
            data.loaiVaccine || null
        )

        .input(
            "NhaSanXuat",
            sql.NVarChar(150),
            data.nhaSanXuat || null
        )

        .input(
            "MoTa",
            sql.NVarChar(500),
            data.moTa || null
        )

        .input(
            "SoMuiKhuyenNghi",
            sql.Int,
            data.soMuiKhuyenNghi ?? null
        )

        .input(
            "KhoangCachMui",
            sql.Int,
            data.khoangCachMui ?? null
        )

        .query(`
            INSERT INTO VACCINE
            (
                TenVaccine,
                LoaiVaccine,
                NhaSanXuat,
                MoTa,
                SoMuiKhuyenNghi,
                KhoangCachMui
            )

            VALUES
            (
                @TenVaccine,
                @LoaiVaccine,
                @NhaSanXuat,
                @MoTa,
                @SoMuiKhuyenNghi,
                @KhoangCachMui
            )
        ; SELECT * FROM VACCINE WHERE MaVaccine=CONVERT(int,SCOPE_IDENTITY());
        `);

    return result.recordset[0];
};


// Cập nhật vaccine
const update = async (
    maVaccine,
    data
) => {
    const pool = await sql.connect();

    const result = await pool
        .request()

        .input(
            "MaVaccine",
            sql.Int,
            maVaccine
        )

        .input(
            "TenVaccine",
            sql.NVarChar(150),
            data.tenVaccine ?? null
        )

        .input(
            "LoaiVaccine",
            sql.NVarChar(100),
            data.loaiVaccine ?? null
        )

        .input(
            "NhaSanXuat",
            sql.NVarChar(150),
            data.nhaSanXuat ?? null
        )

        .input(
            "MoTa",
            sql.NVarChar(500),
            data.moTa ?? null
        )

        .input(
            "SoMuiKhuyenNghi",
            sql.Int,
            data.soMuiKhuyenNghi ?? null
        )

        .input(
            "KhoangCachMui",
            sql.Int,
            data.khoangCachMui ?? null
        )

        .query(`
            UPDATE VACCINE
            SET
                TenVaccine =
                    COALESCE(@TenVaccine, TenVaccine),

                LoaiVaccine =
                    COALESCE(@LoaiVaccine, LoaiVaccine),

                NhaSanXuat =
                    COALESCE(@NhaSanXuat, NhaSanXuat),

                MoTa =
                    COALESCE(@MoTa, MoTa),

                SoMuiKhuyenNghi =
                    COALESCE(
                        @SoMuiKhuyenNghi,
                        SoMuiKhuyenNghi
                    ),

                KhoangCachMui =
                    COALESCE(
                        @KhoangCachMui,
                        KhoangCachMui
                    )

            WHERE MaVaccine = @MaVaccine;

            SELECT *
            FROM VACCINE
            WHERE MaVaccine = @MaVaccine;
        `);

    return result.recordset[0] || null;
};


// Thay đổi trạng thái vaccine
const updateStatus = async (
    maVaccine,
    trangThai
) => {
    const pool = await sql.connect();

    const result = await pool
        .request()

        .input(
            "MaVaccine",
            sql.Int,
            maVaccine
        )

        .input(
            "TrangThai",
            sql.Bit,
            trangThai
        )

        .query(`
            UPDATE VACCINE
            SET TrangThai = @TrangThai
            WHERE MaVaccine = @MaVaccine;

            SELECT *
            FROM VACCINE
            WHERE MaVaccine = @MaVaccine;
        `);

    return result.recordset[0] || null;
};


module.exports = {
    findAll,
    findById,
    findByName,
    create,
    update,
    updateStatus
};
