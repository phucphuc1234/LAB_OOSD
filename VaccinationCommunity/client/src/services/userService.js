import api from "./api";

// Danh sách tài khoản
const getAllUsers = async () => {
    const response = await api.get("/users");
    return response.data;
};

// Chi tiết tài khoản
const getUserById = async (id) => {
    const response = await api.get(
        `/users/${id}`
    );

    return response.data;
};

// Khóa / mở khóa tài khoản
const updateStatus = async (
    id,
    trangThai
) => {
    const response = await api.patch(
        `/users/${id}/status`,
        {
            trangThai
        }
    );

    return response.data;
};

// Phân quyền
const updateRole = async (
    id,
    maVaiTro
) => {
    const response = await api.patch(
        `/users/${id}/role`,
        {
            maVaiTro
        }
    );

    return response.data;
};

export default {
    getAllUsers,
    getUserById,
    updateStatus,
    updateRole,
};
