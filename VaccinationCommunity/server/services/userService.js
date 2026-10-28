const userRepository = require('../repositories/userRepository');
const v = require('../utils/authValidation');
const getAllUsers = () => userRepository.findAll();
const getUserById = async (value) => {
    const account = await userRepository.findById(v.id(value, 'Mã tài khoản'));
    if (!account) throw v.error('Không tìm thấy tài khoản.', 404);
    return account;
};
const changeStatus = async (accountId, active, actorId) => {
    const id = v.id(accountId, 'Mã tài khoản');
    const actor = v.id(actorId, 'Mã quản trị viên');
    if (typeof active !== 'boolean') throw v.error('Trạng thái phải là true hoặc false.');
    if (id === actor && !active) throw v.error('Bạn không thể tự khóa tài khoản đang đăng nhập.');
    await getUserById(id);
    return userRepository.updateStatus(id, active, actor);
};
const changeRole = async (accountId, roleId, actorId) => {
    const id = v.id(accountId, 'Mã tài khoản');
    const role = v.id(roleId, 'Mã vai trò');
    const actor = v.id(actorId, 'Mã quản trị viên');
    const account = await getUserById(id);
    const targetRole = await userRepository.findRoleById(role);
    if (!targetRole || !v.roles.includes(targetRole.TenVaiTro)) throw v.error('Vai trò không tồn tại hoặc không hoạt động.', 404);
    if (id === actor && account.MaVaiTro !== role) throw v.error('Không thể tự thay đổi vai trò của tài khoản đang đăng nhập.');
    return userRepository.updateRole(id, role, actor);
};
module.exports = { getAllUsers, getUserById, changeStatus, changeRole };
