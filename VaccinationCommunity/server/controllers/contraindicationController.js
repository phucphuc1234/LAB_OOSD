const service = require("../services/contraindicationService");
const { action } = require("../utils/http");
module.exports = {
    getAll: action(() => service.getAll()),
    getById: action(req => service.getById(req.params.id)),
    getMyContraindications: action(req => service.getMyContraindications(req.user.maTaiKhoan)),
    createContraindication: action(req => service.createContraindication(req.body, req.user.maTaiKhoan), "Ghi nhận chống chỉ định thành công.", 201),
    updateContraindication: action(req => service.updateContraindication(req.params.id, req.body, req.user.maTaiKhoan), "Cập nhật chống chỉ định thành công."),
};
