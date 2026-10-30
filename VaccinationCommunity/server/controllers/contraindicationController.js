const service = require("../services/contraindicationService");
const { action } = require("../utils/http");
module.exports = {
    getAll: action(req => service.getAll(req.user.maTaiKhoan)),
    getById: action(req => service.getById(req.params.id, req.user.maTaiKhoan)),
    getMyContraindications: action(req => service.getMyContraindications(req.user.maTaiKhoan)),
    createContraindication: action(req => service.createContraindication(req.body, req.user.maTaiKhoan), "Ghi nhận chống chỉ định thành công.", 201),
    updateContraindication: action(req => service.updateContraindication(req.params.id, req.body, req.user.maTaiKhoan), "Cập nhật chống chỉ định thành công."),
};
