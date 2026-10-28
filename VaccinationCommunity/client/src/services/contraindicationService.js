import api from "./api";

// Người dân xem chống chỉ định của mình
const getMyContraindications = async () => {
    const response = await api.get(
        "/contraindications/me"
    );

    return response.data;
};

// Nhân viên xem tất cả
const getAllContraindications = async () => {
    const response = await api.get(
        "/contraindications"
    );

    return response.data;
};

// Xem chi tiết
const getContraindicationById = async (id) => {
    const response = await api.get(
        `/contraindications/${id}`
    );

    return response.data;
};

// Thêm chống chỉ định
const createContraindication = async (data) => {
    const response = await api.post(
        "/contraindications",
        data
    );

    return response.data;
};

// Cập nhật chống chỉ định
const updateContraindication = async (
    id,
    data
) => {
    const response = await api.put(
        `/contraindications/${id}`,
        data
    );

    return response.data;
};

export default {
    getMyContraindications,
    getAllContraindications,
    getContraindicationById,
    createContraindication,
    updateContraindication,
};
