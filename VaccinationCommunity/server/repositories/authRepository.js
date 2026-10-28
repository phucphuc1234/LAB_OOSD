const { sql } = require("../config/database");


const findByUsername = async (tenDangNhap) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "TenDangNhap",
            sql.VarChar(100),
            tenDangNhap
        )
        .query(`
            SELECT
                tk.MaTaiKhoan,
                tk.TenDangNhap,
                tk.MatKhau,
                tk.Email,
                tk.SoDienThoai,
                tk.MaVaiTro,
                tk.TrangThai,
                vt.TenVaiTro,
                vt.TrangThai AS VaiTroHoatDong
            FROM TAIKHOAN tk
            INNER JOIN VAITRO vt
                ON tk.MaVaiTro = vt.MaVaiTro
            WHERE tk.TenDangNhap = @TenDangNhap
        `);

    return result.recordset[0] || null;
};


const findByEmail = async (email) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "Email",
            sql.VarChar(150),
            email
        )
        .query(`
            SELECT MaTaiKhoan
            FROM TAIKHOAN
            WHERE Email = @Email
        `);

    return result.recordset[0] || null;
};


const findByCCCD = async (cccd) => {
    const pool = await sql.connect();

    const result = await pool
        .request()
        .input(
            "CCCD",
            sql.VarChar(20),
            cccd
        )
        .query(`
            SELECT MaNguoiDan
            FROM NGUOIDAN
            WHERE CCCD = @CCCD
        `);

    return result.recordset[0] || null;
};


const createCitizenAccount = async (data) => {

    const pool = await sql.connect();

    const transaction = new sql.Transaction(pool);

    try {

        await transaction.begin();

        // Lấy vai trò Người dân
        const roleRequest = new sql.Request(transaction);

        const roleResult = await roleRequest.query(`
            SELECT MaVaiTro
            FROM VAITRO
            WHERE TenVaiTro = N'Người dân' AND TrangThai = 1
        `);

        if (roleResult.recordset.length === 0) {
            throw new Error("Không tìm thấy vai trò Người dân");
        }

        const maVaiTro =
            roleResult.recordset[0].MaVaiTro;


        // Tạo tài khoản
        const accountRequest =
            new sql.Request(transaction);

        accountRequest.input(
            "TenDangNhap",
            sql.VarChar(100),
            data.tenDangNhap
        );

        accountRequest.input(
            "MatKhau",
            sql.VarChar(255),
            data.matKhau
        );

        accountRequest.input(
            "Email",
            sql.VarChar(150),
            data.email
        );

        accountRequest.input(
            "SoDienThoai",
            sql.VarChar(20),
            data.soDienThoai
        );

        accountRequest.input(
            "MaVaiTro",
            sql.Int,
            maVaiTro
        );

        const accountResult =
            await accountRequest.query(`
                DECLARE @Created TABLE (MaTaiKhoan INT);
                INSERT INTO TAIKHOAN
                (
                    TenDangNhap,
                    MatKhau,
                    Email,
                    SoDienThoai,
                    MaVaiTro
                )
                OUTPUT INSERTED.MaTaiKhoan INTO @Created
                VALUES
                (
                    @TenDangNhap,
                    @MatKhau,
                    @Email,
                    @SoDienThoai,
                    @MaVaiTro
                );
                SELECT MaTaiKhoan FROM @Created;
            `);

        const maTaiKhoan =
            accountResult.recordset[0].MaTaiKhoan;


        // Tạo hồ sơ người dân
        const citizenRequest =
            new sql.Request(transaction);

        citizenRequest.input(
            "MaTaiKhoan",
            sql.Int,
            maTaiKhoan
        );

        citizenRequest.input(
            "HoTen",
            sql.NVarChar(150),
            data.hoTen
        );

        citizenRequest.input(
            "NgaySinh",
            sql.Date,
            new Date(`${data.ngaySinh}T00:00:00.000Z`)
        );

        citizenRequest.input(
            "GioiTinh",
            sql.NVarChar(20),
            data.gioiTinh
        );

        citizenRequest.input(
            "CCCD",
            sql.VarChar(20),
            data.cccd
        );

        citizenRequest.input(
            "SoDienThoai",
            sql.VarChar(20),
            data.soDienThoai
        );

        citizenRequest.input(
            "Email",
            sql.VarChar(150),
            data.email
        );

        citizenRequest.input(
            "DiaChi",
            sql.NVarChar(255),
            data.diaChi || null
        );

        citizenRequest.input(
            "PhuongXa",
            sql.NVarChar(100),
            data.phuongXa || null
        );

        citizenRequest.input(
            "QuanHuyen",
            sql.NVarChar(100),
            data.quanHuyen || null
        );

        citizenRequest.input(
            "TinhThanh",
            sql.NVarChar(100),
            data.tinhThanh || null
        );

        const citizenResult =
            await citizenRequest.query(`
                DECLARE @Created TABLE (MaNguoiDan INT);
                INSERT INTO NGUOIDAN
                (
                    MaTaiKhoan,
                    HoTen,
                    NgaySinh,
                    GioiTinh,
                    CCCD,
                    SoDienThoai,
                    Email,
                    DiaChi,
                    PhuongXa,
                    QuanHuyen,
                    TinhThanh
                )
                OUTPUT INSERTED.MaNguoiDan INTO @Created
                VALUES
                (
                    @MaTaiKhoan,
                    @HoTen,
                    @NgaySinh,
                    @GioiTinh,
                    @CCCD,
                    @SoDienThoai,
                    @Email,
                    @DiaChi,
                    @PhuongXa,
                    @QuanHuyen,
                    @TinhThanh
                );
                SELECT MaNguoiDan FROM @Created;
            `);

        await transaction.commit();

        return {
            maTaiKhoan,
            maNguoiDan:
                citizenResult.recordset[0].MaNguoiDan
        };

    } catch (error) {

        try { await transaction.rollback(); } catch (_) { }
        throw error;
    }
};


const updateLastLogin = async (maTaiKhoan) => {

    const pool = await sql.connect();

    await pool
        .request()
        .input(
            "MaTaiKhoan",
            sql.Int,
            maTaiKhoan
        )
        .query(`
            UPDATE TAIKHOAN
            SET LanDangNhapCuoi = GETDATE()
            WHERE MaTaiKhoan = @MaTaiKhoan
        `);
};

const findAccountById = async (maTaiKhoan) => {
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
                MaTaiKhoan,
                TenDangNhap,
                MatKhau,
                TrangThai
            FROM TAIKHOAN
            WHERE MaTaiKhoan = @MaTaiKhoan
        `);

    return result.recordset[0] || null;
};


const updatePassword = async (
    maTaiKhoan,
    matKhauMoi,
    matKhauHienTai
) => {
    const pool = await sql.connect();

    const transaction =
        new sql.Transaction(pool);

    try {
        await transaction.begin();

        const request =
            new sql.Request(transaction);

        request.input(
            "MaTaiKhoan",
            sql.Int,
            maTaiKhoan
        );

        request.input(
            "MatKhau",
            sql.VarChar(255),
            matKhauMoi
        );

        request.input("MatKhauHienTai", sql.VarChar(255), matKhauHienTai);
        await request.query(`
            UPDATE TAIKHOAN
            SET MatKhau = @MatKhau
            WHERE MaTaiKhoan = @MaTaiKhoan AND MatKhau COLLATE Latin1_General_100_BIN2 = @MatKhauHienTai COLLATE Latin1_General_100_BIN2;
            IF @@ROWCOUNT <> 1 THROW 51003, N'Mật khẩu vừa thay đổi. Vui lòng đăng nhập lại.', 1;
        `);


        const history =
            new sql.Request(transaction);

        history.input(
            "TenBang",
            sql.VarChar(100),
            "TAIKHOAN"
        );

        history.input(
            "MaBanGhi",
            sql.Int,
            maTaiKhoan
        );

        history.input(
            "HanhDong",
            sql.NVarChar(50),
            "Đổi mật khẩu"
        );

        history.input(
            "MaTaiKhoan",
            sql.Int,
            maTaiKhoan
        );

        await history.query(`
            INSERT INTO LICHSUHIEUCHINH
            (
                TenBang,
                MaBanGhi,
                HanhDong,
                MaTaiKhoan
            )
            VALUES
            (
                @TenBang,
                @MaBanGhi,
                @HanhDong,
                @MaTaiKhoan
            )
        `);

        await transaction.commit();

        return true;

    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) { }

        throw error;
    }
};

// Retrieve credentials internally, but only current non-sensitive fields are copied to req.user.
const findAuthenticatedAccount = async (maTaiKhoan) => {
    const pool = await sql.connect();
    const result = await pool.request()
        .input("MaTaiKhoan", sql.Int, maTaiKhoan)
        .query(`SELECT tk.MaTaiKhoan, tk.TenDangNhap, tk.MatKhau, tk.Email,
            tk.SoDienThoai, tk.MaVaiTro, tk.TrangThai, vt.TenVaiTro,
            vt.TrangThai AS VaiTroHoatDong
            FROM TAIKHOAN tk INNER JOIN VAITRO vt ON vt.MaVaiTro=tk.MaVaiTro
            WHERE tk.MaTaiKhoan=@MaTaiKhoan`);
    return result.recordset[0] || null;
};

module.exports = {
    findByUsername,
    findAuthenticatedAccount,
    findByEmail,
    findByCCCD,
    createCitizenAccount,
    updateLastLogin,
    findAccountById,
    updatePassword
};
