const service = require("../services/scheduleService");
const { action, errorResponse } = require("../utils/http");
module.exports = {
    getAllSchedules: action(req => service.getAllSchedules(req.user.maTaiKhoan)),
    getScheduleById: action(req => service.getScheduleById(req.params.id, req.user.maTaiKhoan)),
    getMySchedules: action(req => service.getMySchedules(req.user.maTaiKhoan)),
    createSchedule: action(req => service.createSchedule(req.body, req.user.maTaiKhoan), "Tạo lịch tiêm thành công.", 201),
    updateSchedule: action(req => service.updateSchedule(req.params.id, req.body, req.user.maTaiKhoan), "Cập nhật lịch tiêm thành công."),
    changeStatus: action(req => service.changeStatus(req.params.id, req.body.trangThai, req.user.maTaiKhoan), "Cập nhật trạng thái lịch tiêm thành công."),
    cancelMySchedule: action(req => service.cancelMySchedule(req.user.maTaiKhoan, req.params.id), "Đã hủy lịch tiêm."),
    createMySchedule: async (req, res) => {
        try {
            const data = await service.createMySchedule(req.user.maTaiKhoan, req.body);
            return res.status(201).json({ success: true, message: data.message, data: { maLichTiem: data.maLichTiem, schedule: data.schedule } });
        } catch (error) { return errorResponse(res, error); }
    },
};
