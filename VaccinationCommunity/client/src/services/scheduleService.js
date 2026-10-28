import api from "./api";

// Người dân xem lịch của mình
const getMySchedules = async () => {
    const response = await api.get("/schedules/me");
    return response.data;
};

// Nhân viên xem toàn bộ lịch
const getAllSchedules = async () => {
    const response = await api.get("/schedules");
    return response.data;
};

// Xem chi tiết lịch
const getScheduleById = async (id) => {
    const response = await api.get(
        `/schedules/${id}`
    );

    return response.data;
};

// Tạo lịch
const createSchedule = async (data) => {
    const response = await api.post(
        "/schedules",
        data
    );

    return response.data;
};

// Cập nhật lịch
const updateSchedule = async (id, data) => {
    const response = await api.put(
        `/schedules/${id}`,
        data
    );

    return response.data;
};

// Cập nhật trạng thái
const updateScheduleStatus = async (
    id,
    trangThai
) => {
    const response = await api.patch(
        `/schedules/${id}/status`,
        {
            trangThai
        }
    );

    return response.data;
};
const createMySchedule = async (data) => {
    const response = await api.post(
        "/schedules/me",
        data
    );

    return response.data;
};
export default {
    cancelMySchedule: async (id) => (await api.patch(`/schedules/me/${id}/cancel`)).data,
    getMySchedules,
    getAllSchedules,
    getScheduleById,
    createSchedule,
    createMySchedule,
    updateSchedule,
    updateScheduleStatus,
};
