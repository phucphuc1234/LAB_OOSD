import api from "./api";

const getAllBatches = async () => {
    const response = await api.get("/batches");
    return response.data;
};

const getBatchById = async (id) => {
    const response = await api.get(
        `/batches/${id}`
    );

    return response.data;
};

const createBatch = async (data) => {
    const response = await api.post(
        "/batches",
        data
    );

    return response.data;
};

const updateBatch = async (id, data) => {
    const response = await api.put(
        `/batches/${id}`,
        data
    );

    return response.data;
};

const updateBatchStatus = async (
    id,
    trangThai
) => {
    const response = await api.patch(
        `/batches/${id}/status`,
        {
            trangThai
        }
    );

    return response.data;
};

export default {
    getAllBatches,
    getBatchById,
    createBatch,
    updateBatch,
    updateBatchStatus,
};
