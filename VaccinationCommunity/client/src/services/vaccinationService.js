import api from "./api";

const createVaccination = async (data) => {
    const response = await api.post(
        "/vaccinations",
        data
    );

    return response.data;
};

const getVaccinationById = async (id) => {
    const response = await api.get(
        `/vaccinations/${id}`
    );

    return response.data;
};

export default {
    createVaccination,
    getVaccinationById,
};
