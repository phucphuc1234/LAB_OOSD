const service = require("../services/historyService");
const { action } = require("../utils/http");
module.exports = {
    getMyHistory: action(req => service.getMyHistory(req.user.maTaiKhoan)),
    getCitizenHistory: action(req => service.getCitizenHistory(req.params.id, req.user.maTaiKhoan)),
    getHistoryDetail: action(req => service.getHistoryDetail(req.params.id, req.user.maTaiKhoan)),
    getMyHistoryDetail: action(req => service.getMyHistoryDetail(req.user.maTaiKhoan, req.params.id)),
};
