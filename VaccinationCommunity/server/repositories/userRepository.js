const { sql } = require('../config/database');
const { error } = require('../utils/authValidation');
const publicColumns = `tk.MaTaiKhoan, tk.TenDangNhap, tk.Email, tk.SoDienThoai,
    tk.MaVaiTro, vt.TenVaiTro, tk.TrangThai, tk.NgayTao, tk.LanDangNhapCuoi`;
const findAll = async () => {
    const pool = await sql.connect();
    return (await pool.request().query(`SELECT ${publicColumns} FROM TAIKHOAN tk
        INNER JOIN VAITRO vt ON tk.MaVaiTro=vt.MaVaiTro ORDER BY tk.MaTaiKhoan DESC`)).recordset;
};
const findById = async (id) => {
    const pool = await sql.connect();
    return (await pool.request().input('MaTaiKhoan', sql.Int, id).query(`SELECT ${publicColumns}
        FROM TAIKHOAN tk INNER JOIN VAITRO vt ON tk.MaVaiTro=vt.MaVaiTro
        WHERE tk.MaTaiKhoan=@MaTaiKhoan`)).recordset[0] || null;
};
const findRoleById = async (id) => {
    const pool = await sql.connect();
    return (await pool.request().input('MaVaiTro', sql.Int, id).query(`SELECT MaVaiTro,TenVaiTro,TrangThai
        FROM VAITRO WHERE MaVaiTro=@MaVaiTro AND TrangThai=1`)).recordset[0] || null;
};
const updateAccount = async (id, field, value, actorId) => {
    if (!['TrangThai', 'MaVaiTro'].includes(field)) throw error('Không được cập nhật trường này.');
    const pool = await sql.connect();
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        // Recheck the actor inside the same transaction as the account mutation.
        // This prevents two administrators from using stale authorization to disable one another.
        const admins = (await new sql.Request(transaction).query(`SELECT tk.MaTaiKhoan
            FROM TAIKHOAN tk WITH (UPDLOCK,HOLDLOCK) INNER JOIN VAITRO vt ON vt.MaVaiTro=tk.MaVaiTro
            WHERE tk.TrangThai=1 AND vt.TrangThai=1 AND vt.TenVaiTro=N'Quản trị viên'`)).recordset;
        if (!admins.some((a) => a.MaTaiKhoan === actorId)) throw error('Cần quyền quản trị viên đang hoạt động.', 403);
        const previous = (await new sql.Request(transaction).input('MaTaiKhoan', sql.Int, id)
            .query(`SELECT ${publicColumns} FROM TAIKHOAN tk WITH (UPDLOCK,HOLDLOCK)
                INNER JOIN VAITRO vt ON vt.MaVaiTro=tk.MaVaiTro WHERE tk.MaTaiKhoan=@MaTaiKhoan`)).recordset[0];
        if (!previous) throw error('Không tìm thấy tài khoản.', 404);
        if (id === actorId && ((field === 'TrangThai' && !value) || (field === 'MaVaiTro' && previous.MaVaiTro !== value))) {
            throw error('Không thể tự khóa hoặc thay đổi vai trò tài khoản đang đăng nhập.');
        }
        if (field === 'MaVaiTro') {
            const role = (await new sql.Request(transaction).input('MaVaiTro', sql.Int, value)
                .query(`SELECT TenVaiTro FROM VAITRO WITH (HOLDLOCK) WHERE MaVaiTro=@MaVaiTro AND TrangThai=1
                    AND TenVaiTro IN (N'Người dân',N'Nhân viên',N'Quản trị viên')`)).recordset[0];
            if (!role) throw error('Vai trò không tồn tại hoặc không hoạt động.', 404);
            if (role.TenVaiTro === 'Người dân') {
                const citizen = (await new sql.Request(transaction).input('MaTaiKhoan', sql.Int, id)
                    .query('SELECT MaNguoiDan FROM NGUOIDAN WITH (HOLDLOCK) WHERE MaTaiKhoan=@MaTaiKhoan')).recordset[0];
                if (!citizen) throw error('Tài khoản chưa có hồ sơ người dân; sử dụng tài khoản đăng ký công dân hoặc hoàn thiện hồ sơ trước khi đổi quyền.', 409);
            }
        }
        const updated = (await new sql.Request(transaction)
            .input('MaTaiKhoan', sql.Int, id)
            .input('Value', field === 'TrangThai' ? sql.Bit : sql.Int, value)
            .query(`UPDATE TAIKHOAN SET ${field}=@Value WHERE MaTaiKhoan=@MaTaiKhoan;
                SELECT ${publicColumns} FROM TAIKHOAN tk INNER JOIN VAITRO vt ON vt.MaVaiTro=tk.MaVaiTro
                WHERE tk.MaTaiKhoan=@MaTaiKhoan;`)).recordset[0];
        await new sql.Request(transaction)
            .input('MaBanGhi', sql.Int, id)
            .input('HanhDong', sql.NVarChar(50), field === 'TrangThai' ? 'Cập nhật trạng thái' : 'Phân quyền')
            .input('DuLieuCu', sql.NVarChar(sql.MAX), JSON.stringify(previous))
            .input('DuLieuMoi', sql.NVarChar(sql.MAX), JSON.stringify(updated))
            .input('MaTaiKhoan', sql.Int, actorId)
            .query(`INSERT INTO LICHSUHIEUCHINH(TenBang,MaBanGhi,HanhDong,DuLieuCu,DuLieuMoi,MaTaiKhoan)
                VALUES('TAIKHOAN',@MaBanGhi,@HanhDong,@DuLieuCu,@DuLieuMoi,@MaTaiKhoan)`);
        await transaction.commit();
        return updated;
    } catch (failure) {
        try { await transaction.rollback(); } catch (_) { }
        throw failure;
    }
};
const updateStatus = (id, active, actorId) => updateAccount(id, 'TrangThai', active, actorId);
const updateRole = (id, roleId, actorId) => updateAccount(id, 'MaVaiTro', roleId, actorId);
module.exports = { findAll, findById, findRoleById, updateStatus, updateRole };
