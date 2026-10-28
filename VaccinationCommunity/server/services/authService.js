const bcrypt = require('bcrypt');
const authRepository = require('../repositories/authRepository');
const { generateToken } = require('../utils/jwt');
const v = require('../utils/authValidation');

const register = async (input) => {
    const source = v.object(input);
    const data = {
        tenDangNhap: v.text(source.tenDangNhap, 'tên đăng nhập', 100),
        matKhau: v.password(source.matKhau),
        email: v.email(source.email),
        soDienThoai: v.phone(source.soDienThoai),
        hoTen: v.text(source.hoTen, 'họ tên', 150),
        ngaySinh: v.birthDate(source.ngaySinh),
        gioiTinh: v.text(source.gioiTinh, 'giới tính', 20),
        cccd: v.text(source.cccd, 'CCCD/CMND', 20),
        diaChi: v.text(source.diaChi, 'địa chỉ', 255, true),
        phuongXa: v.text(source.phuongXa, 'phường/xã', 100, true),
        quanHuyen: v.text(source.quanHuyen, 'quận/huyện', 100, true),
        tinhThanh: v.text(source.tinhThanh, 'tỉnh/thành', 100, true)
    };
    if (!/^[A-Za-z0-9_.-]{3,100}$/.test(data.tenDangNhap)) throw v.error('Tên đăng nhập cần 3–100 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.');
    if (!['Nam', 'Nữ', 'Khác'].includes(data.gioiTinh)) throw v.error('Giới tính phải là Nam, Nữ hoặc Khác.');
    if (!/^(?:\d{9}|\d{12})$/.test(data.cccd)) throw v.error('CCCD/CMND cần có 9 hoặc 12 chữ số.');
    // Only the allowlisted citizen fields reach the repository; role/account IDs from a public request are ignored.
    if (await authRepository.findByUsername(data.tenDangNhap)) throw v.error('Tên đăng nhập đã tồn tại.', 409);
    if (await authRepository.findByEmail(data.email)) throw v.error('Email đã được sử dụng.', 409);
    if (await authRepository.findByCCCD(data.cccd)) throw v.error('CCCD/CMND đã tồn tại.', 409);
    data.matKhau = await bcrypt.hash(data.matKhau, 12);
    try {
        const result = await authRepository.createCitizenAccount(data);
        return { message: 'Đăng ký tài khoản người dân thành công.', ...result };
    } catch (failure) {
        if ([2601, 2627].includes(failure.number)) throw v.error('Tên đăng nhập, email hoặc CCCD/CMND đã tồn tại.', 409);
        throw failure;
    }
};
const login = async (username, password) => {
    const tenDangNhap = v.text(username, 'tên đăng nhập', 100);
    const matKhau = v.password(password, 'Mật khẩu', false);
    const account = await authRepository.findByUsername(tenDangNhap);
    if (!account || !(await bcrypt.compare(matKhau, account.MatKhau || ''))) throw v.error('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
    if (!account.TrangThai || !account.VaiTroHoatDong || !v.roles.includes(account.TenVaiTro)) throw v.error('Tài khoản hoặc vai trò đã bị khóa.', 403);
    const token = generateToken(account);
    await authRepository.updateLastLogin(account.MaTaiKhoan);
    return { token, user: v.publicAccount(account) };
};
const changePassword = async (accountId, current, next) => {
    const id = v.id(accountId, 'Mã tài khoản');
    const currentPassword = v.password(current, 'Mật khẩu hiện tại', false);
    const nextPassword = v.password(next, 'Mật khẩu mới');
    if (currentPassword === nextPassword) throw v.error('Mật khẩu mới phải khác mật khẩu hiện tại.');
    const account = await authRepository.findAccountById(id);
    if (!account) throw v.error('Không tìm thấy tài khoản.', 404);
    if (!account.TrangThai) throw v.error('Tài khoản đã bị khóa.', 403);
    if (!(await bcrypt.compare(currentPassword, account.MatKhau || ''))) throw v.error('Mật khẩu hiện tại không đúng.');
    await authRepository.updatePassword(id, await bcrypt.hash(nextPassword, 12), account.MatKhau);
    return { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại trên các thiết bị.' };
};
module.exports = { register, login, changePassword };
