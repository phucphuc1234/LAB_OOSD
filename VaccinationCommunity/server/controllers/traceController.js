const service = require("../services/traceService");
const { action } = require("../utils/http");
module.exports = {
    traceBatchById: action(req => service.traceBatchById(req.params.id, req.user.maTaiKhoan)),
    traceBatchByCode: action(req => service.traceBatchByCode(req.params.code, req.user.maTaiKhoan)),
    traceVaccination: action(req => service.traceVaccination(req.params.id, req.user.maTaiKhoan)),
};
