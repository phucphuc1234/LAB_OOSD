const citizenRepository = require('../repositories/citizenRepository');
const v = require('../utils/authValidation');
const getMyProfile = async (accountId) => {
    const profile = await citizenRepository.findByAccountId(v.id(accountId, 'Mã tài khoản'));
    if (!profile) throw v.error('Không tìm thấy hồ sơ người dân.', 404);
    return profile;
};
const updateMyProfile = async (accountId, input) => {
    const id = v.id(accountId, 'Mã tài khoản');
    v.object(input);
    await getMyProfile(id);
    const data = {};
    const limits = { diaChi: ['địa chỉ', 255], phuongXa: ['phường/xã', 100], quanHuyen: ['quận/huyện', 100], tinhThanh: ['tỉnh/thành', 100] };
    if (Object.hasOwn(input, 'email')) data.email = v.email(input.email);
    if (Object.hasOwn(input, 'soDienThoai')) data.soDienThoai = v.phone(input.soDienThoai);
    for (const [key, [label, limit]] of Object.entries(limits)) {
        if (Object.hasOwn(input, key)) data[key] = v.text(input[key], label, limit, true) || '';
    }
    if (!Object.keys(data).length) throw v.error('Không có thông tin liên hệ hoặc địa chỉ để cập nhật.');
    return citizenRepository.updateOwnProfile(id, data);
};
const getAllCitizens = () => citizenRepository.findAll();
const getCitizenById = async (citizenId) => {
    const citizen = await citizenRepository.findById(v.id(citizenId, 'Mã người dân'));
    if (!citizen) throw v.error('Không tìm thấy người dân.', 404);
    return citizen;
};
module.exports = { getMyProfile, updateMyProfile, getAllCitizens, getCitizenById };
