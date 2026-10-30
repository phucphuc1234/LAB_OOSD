const service = require("../services/vaccineService");
const { action } = require("../utils/http");
module.exports = {
    getAllVaccines: action(() => service.getAllVaccines()),
    getVaccineById: action(req => service.getVaccineById(req.params.id)),
    createVaccine: action(req => service.createVaccine(req.body, req.user.maTaiKhoan), "Thêm vaccine thành công.", 201),
    updateVaccine: action(req => service.updateVaccine(req.params.id, req.body, req.user.maTaiKhoan), "Cập nhật vaccine thành công."),
    changeStatus: action(req => service.changeStatus(req.params.id, req.body.trangThai, req.user.maTaiKhoan), "Cập nhật trạng thái vaccine thành công."),
};
