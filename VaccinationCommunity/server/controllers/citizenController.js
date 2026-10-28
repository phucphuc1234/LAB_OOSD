const citizenService = require('../services/citizenService');
const { respondError } = require('../utils/authValidation');
const getMyProfile = async (req, res) => {
    try { return res.json({ success: true, data: await citizenService.getMyProfile(req.user.maTaiKhoan) }); }
    catch (failure) { return respondError(res, failure); }
};
const updateMyProfile = async (req, res) => {
    try { return res.json({ success: true, message: 'Cập nhật hồ sơ thành công.',
        data: await citizenService.updateMyProfile(req.user.maTaiKhoan, req.body) }); }
    catch (failure) { return respondError(res, failure); }
};
const getAllCitizens = async (_req, res) => {
    try { return res.json({ success: true, data: await citizenService.getAllCitizens() }); }
    catch (failure) { return respondError(res, failure); }
};
const getCitizenById = async (req, res) => {
    try { return res.json({ success: true, data: await citizenService.getCitizenById(req.params.id) }); }
    catch (failure) { return respondError(res, failure); }
};
module.exports = { getMyProfile, updateMyProfile, getAllCitizens, getCitizenById };
