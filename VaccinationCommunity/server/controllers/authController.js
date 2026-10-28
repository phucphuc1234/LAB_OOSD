const authService = require('../services/authService');
const { respondError } = require('../utils/authValidation');
const register = async (req, res) => {
    try { return res.status(201).json({ success: true, ...await authService.register(req.body) }); }
    catch (failure) { return respondError(res, failure); }
};
const login = async (req, res) => {
    try {
        return res.json({ success: true, message: 'Đăng nhập thành công.',
            ...await authService.login(req.body?.tenDangNhap, req.body?.matKhau) });
    } catch (failure) { return respondError(res, failure); }
};
const logout = async (_req, res) => res.json({ success: true, message: 'Đã nhận yêu cầu đăng xuất.' });
const changePassword = async (req, res) => {
    try {
        const result = await authService.changePassword(req.user.maTaiKhoan,
            req.body?.matKhauHienTai, req.body?.matKhauMoi);
        return res.json({ success: true, message: result.message });
    } catch (failure) { return respondError(res, failure); }
};
module.exports = { register, login, logout, changePassword };
