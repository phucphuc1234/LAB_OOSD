const { integer } = require("../utils/validation");
const notificationRepository =
    require("../repositories/notificationRepository");


const createError = (
    message,
    statusCode = 400
) => {
    const error = new Error(message);
    error.statusCode = statusCode;

    return error;
};


// Người dân xem thông báo
const getMyNotifications = async (
    maTaiKhoan
) => {
    maTaiKhoan = integer(maTaiKhoan, "Tài khoản");
    return await notificationRepository
        .findByAccountId(maTaiKhoan);
};


// Đánh dấu đã đọc
const markMyNotificationRead = async (
    maTaiKhoan,
    maThongBao
) => {
    maThongBao = integer(maThongBao, "Mã thông báo");
    const citizen =
        await notificationRepository
            .findCitizenByAccountId(
                maTaiKhoan
            );

    if (!citizen) {
        throw createError(
            "Không tìm thấy hồ sơ người dân.",
            404
        );
    }

    const notification =
        await notificationRepository
            .findById(maThongBao);

    if (!notification) {
        throw createError(
            "Không tìm thấy thông báo.",
            404
        );
    }

    if (
        notification.MaNguoiDan !==
        citizen.MaNguoiDan
    ) {
        throw createError(
            "Bạn không có quyền xem thông báo này.",
            403
        );
    }

    return await notificationRepository
        .markAsRead(maThongBao);
};


// Sinh thông báo nhắc lịch



const formatDateTime = (date) => {
    return new Date(date).toLocaleString(
        "vi-VN",
        {
            timeZone: "Asia/Ho_Chi_Minh",

            hour: "2-digit",
            minute: "2-digit",

            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
};


// =====================================
// TẠO THÔNG BÁO NHẮC LỊCH TIÊM
// =====================================
const generateReminders = async (daysAhead = 3) => {
    daysAhead = integer(daysAhead, "Số ngày nhắc trước", 0, 30);

    const schedules =
        await notificationRepository
            .findUpcomingSchedules(daysAhead);

    let createdCount = 0;

    for (const schedule of schedules) {

        const ngayGio =
            formatDateTime(
                schedule.NgayDuKien
            );


        const tieuDe =
            "Nhắc lịch tiêm";


        const noiDung =
            `Bạn có lịch tiêm ${schedule.TenVaccine}` +
            ` - Mũi ${schedule.MuiSo}` +
            ` vào lúc ${ngayGio}` +
            ` tại ${schedule.CoSoTiem || "cơ sở đã đăng ký"}. ` +
            `Vui lòng đến đúng giờ.`;


        const created = await notificationRepository
            .createReminder({

                maNguoiDan:
                    schedule.MaNguoiDan,

                maLichTiem:
                    schedule.MaLichTiem,

                tieuDe,

                noiDung

            });


        if (created) createdCount++;
    }


    return {
        checked:
            schedules.length,

        created:
            createdCount
    };
};


module.exports = {
    getMyNotifications,
    markMyNotificationRead,
    generateReminders
};
