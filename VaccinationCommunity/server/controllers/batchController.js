const service = require("../services/batchService");
const { action } = require("../utils/http");
module.exports = {
    getAllBatches: action(req => service.getAllBatches(req.user.maTaiKhoan)),
    getBatchById: action(req => service.getBatchById(req.params.id, req.user.maTaiKhoan)),
    createBatch: action(req => service.createBatch(req.body, req.user.maTaiKhoan), "Thêm lô vaccine thành công.", 201),
    updateBatch: action(req => service.updateBatch(req.params.id, req.body, req.user.maTaiKhoan), "Cập nhật lô vaccine thành công."),
    changeStatus: action(req => service.changeStatus(req.params.id, req.body.trangThai, req.user.maTaiKhoan), "Cập nhật trạng thái lô vaccine thành công."),
};
