const service = require("../services/batchService");
const { action } = require("../utils/http");
module.exports = {
    getAllBatches: action(() => service.getAllBatches()),
    getBatchById: action(req => service.getBatchById(req.params.id)),
    createBatch: action(req => service.createBatch(req.body), "Thêm lô vaccine thành công.", 201),
    updateBatch: action(req => service.updateBatch(req.params.id, req.body), "Cập nhật lô vaccine thành công."),
    changeStatus: action(req => service.changeStatus(req.params.id, req.body.trangThai), "Cập nhật trạng thái lô vaccine thành công."),
};
