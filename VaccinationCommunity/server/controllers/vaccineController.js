const service = require("../services/vaccineService");
const { action } = require("../utils/http");
module.exports = {
    getAllVaccines: action(() => service.getAllVaccines()),
    getVaccineById: action(req => service.getVaccineById(req.params.id)),
    createVaccine: action(req => service.createVaccine(req.body), "Thêm vaccine thành công.", 201),
    updateVaccine: action(req => service.updateVaccine(req.params.id, req.body), "Cập nhật vaccine thành công."),
    changeStatus: action(req => service.changeStatus(req.params.id, req.body.trangThai), "Cập nhật trạng thái vaccine thành công."),
};
