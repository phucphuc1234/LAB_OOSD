const userService = require('../services/userService');
const { respondError } = require('../utils/authValidation');
const getAllUsers = async (_req, res) => {
    try { return res.json({ success: true, data: await userService.getAllUsers() }); }
    catch (failure) { return respondError(res, failure); }
};
const getUserById = async (req, res) => {
    try { return res.json({ success: true, data: await userService.getUserById(req.params.id) }); }
    catch (failure) { return respondError(res, failure); }
};
const changeStatus = async (req, res) => {
    try {
        return res.json({ success: true, message: 'Cập nhật trạng thái tài khoản thành công.',
            data: await userService.changeStatus(req.params.id, req.body?.trangThai, req.user.maTaiKhoan) });
    } catch (failure) { return respondError(res, failure); }
};
const changeRole = async (req, res) => {
    try {
        return res.json({ success: true, message: 'Phân quyền tài khoản thành công.',
            data: await userService.changeRole(req.params.id, req.body?.maVaiTro, req.user.maTaiKhoan) });
    } catch (failure) { return respondError(res, failure); }
};
module.exports = { getAllUsers, getUserById, changeStatus, changeRole };
