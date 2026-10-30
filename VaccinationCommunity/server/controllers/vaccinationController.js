const service = require("../services/vaccinationService");
const { action } = require("../utils/http");
module.exports = {
    getVaccinationById: action(req => service.getVaccinationById(req.params.id, req.user.maTaiKhoan)),
    createVaccination: action(req => service.createVaccination(req.body, req.user.maTaiKhoan), "Ghi nhận mũi tiêm thành công.", 201),
};
