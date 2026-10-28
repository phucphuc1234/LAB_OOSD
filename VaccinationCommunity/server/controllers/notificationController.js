const service = require("../services/notificationService");
const { action } = require("../utils/http");
module.exports = {
    getMyNotifications: action(req => service.getMyNotifications(req.user.maTaiKhoan)),
    markAsRead: action(req => service.markMyNotificationRead(req.user.maTaiKhoan, req.params.id), "Đã đánh dấu thông báo là đã đọc."),
    generateReminders: action(req => service.generateReminders(req.body.daysAhead ?? 3), "Đã xử lý nhắc lịch tiêm."),
};
