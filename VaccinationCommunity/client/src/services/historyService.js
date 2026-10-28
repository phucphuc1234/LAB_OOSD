import api from "./api";

// Người dân xem lịch sử của mình
const getMyHistory = async () => {
    const response = await api.get(
        "/history/me"
    );

    return response.data;
};

// Người dân xem chi tiết mũi tiêm của mình
const getMyHistoryDetail = async (id) => {
    const response = await api.get(
        `/history/me/${id}`
    );

    return response.data;
};

// Nhân viên xem lịch sử của một người dân
const getCitizenHistory = async (citizenId) => {
    const response = await api.get(
        `/history/citizen/${citizenId}`
    );

    return response.data;
};

// Nhân viên xem chi tiết một mũi tiêm
const getHistoryDetail = async (id) => {
    const response = await api.get(
        `/history/detail/${id}`
    );

    return response.data;
};

export default {
    getMyHistory,
    getMyHistoryDetail,
    getCitizenHistory,
    getHistoryDetail,
};
