import api from "./api";

// Truy theo ID lô
const traceBatchById = async (id) => {
    const response = await api.get(
        `/trace/batch/${id}`
    );

    return response.data;
};

// Truy theo mã lô vaccine
const traceBatchByCode = async (code) => {
    const response = await api.get(
        `/trace/batch-code/${encodeURIComponent(code)}`
    );

    return response.data;
};

// Truy từ mũi tiêm -> lô vaccine
const traceVaccination = async (id) => {
    const response = await api.get(
        `/trace/vaccination/${id}`
    );

    return response.data;
};

export default {
    traceBatchById,
    traceBatchByCode,
    traceVaccination,
};
