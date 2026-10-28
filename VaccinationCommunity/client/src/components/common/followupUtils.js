export const STATUS_LABELS = {
    new: "Mới tiếp nhận",
    reviewing: "Đang xem xét",
    monitoring: "Đang theo dõi",
    escalated: "Cần xử lý ưu tiên",
    resolved: "Đã kết thúc theo dõi",
};

export const SEVERITY_LABELS = {
    none: "Kiểm tra định kỳ",
    mild: "Thông thường",
    moderate: "Cần chú ý",
    severe: "Ưu tiên cao",
    emergency: "Dấu hiệu cảnh báo đỏ",
};

export const NEXT_STATUSES = {
    new: ["reviewing", "escalated"],
    reviewing: ["monitoring", "escalated", "resolved"],
    monitoring: ["reviewing", "escalated", "resolved"],
    escalated: ["reviewing", "monitoring", "resolved"],
    resolved: ["reviewing", "escalated"],
};

export function formatDate(value) {
    if (!value) return "Chưa có";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Chưa có" : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh",
    }).format(date);
}

export function toLocalInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
}

export function errorMessage(error, fallback = "Không thể thực hiện. Vui lòng thử lại.") {
    return error?.response?.data?.message || fallback;
}
