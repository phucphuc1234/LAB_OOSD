import api from "./api";

const getAllVaccines = async () => {
    const response = await api.get("/vaccines");
    return response.data;
};

const getVaccineById = async (id) => {
    const response = await api.get(
        `/vaccines/${id}`
    );

    return response.data;
};

const createVaccine = async (data) => {
    const response = await api.post(
        "/vaccines",
        data
    );

    return response.data;
};

const updateVaccine = async (id, data) => {
    const response = await api.put(
        `/vaccines/${id}`,
        data
    );

    return response.data;
};

const updateVaccineStatus = async (
    id,
    trangThai
) => {
    const response = await api.patch(
        `/vaccines/${id}/status`,
        {
            trangThai
        }
    );

    return response.data;
};

export default {
    getAllVaccines,
    getVaccineById,
    createVaccine,
    updateVaccine,
    updateVaccineStatus,
};
