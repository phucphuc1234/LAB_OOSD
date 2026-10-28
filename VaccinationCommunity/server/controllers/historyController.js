const service = require("../services/historyService");
const { action } = require("../utils/http");
module.exports = {
    getMyHistory: action(req => service.getMyHistory(req.user.maTaiKhoan)),
    getCitizenHistory: action(req => service.getCitizenHistory(req.params.id)),
    getHistoryDetail: action(req => service.getHistoryDetail(req.params.id)),
    getMyHistoryDetail: action(req => service.getMyHistoryDetail(req.user.maTaiKhoan, req.params.id)),
};
