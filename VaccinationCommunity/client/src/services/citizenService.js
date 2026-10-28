import api from "./api";

const getMyProfile = async () => {
    const response = await api.get("/citizens/me");
    return response.data;
};

const updateMyProfile = async (data) => {
    const response = await api.put(
        "/citizens/me",
        data
    );

    return response.data;
};

// Nhân viên xem danh sách người dân
const getAllCitizens = async () => {
    const response = await api.get("/citizens");
    return response.data;
};

// Nhân viên xem chi tiết người dân
const getCitizenById = async (id) => {
    const response = await api.get(
        `/citizens/${id}`
    );

    return response.data;
};

export default {
    getMyProfile,
    updateMyProfile,
    getAllCitizens,
    getCitizenById,
};
