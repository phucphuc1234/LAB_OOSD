import api from "./api";

const payload = (response) => response.data;

const followupService = {
    getSymptoms: () => api.get("/followups/symptoms").then(payload),
    getMyVaccinations: () => api.get("/followups/vaccinations/mine").then(payload),
    getMyReports: (params = {}) => api.get("/followups/mine", { params }).then(payload),
    createReport: (data) => api.post("/followups/mine", data).then(payload),
    getReports: (params = {}) => api.get("/followups", { params }).then(payload),
    getReport: (id) => api.get(`/followups/${id}`).then(payload),
    reviewReport: (id, data) => api.patch(`/followups/${id}/review`, data).then(payload),
};

export default followupService;
