import api from "./api";

export const getAreas = async (params = {}) => (await api.get("/facilities/areas", { params })).data;
export const getFacilities = async (params = {}, options = {}) => (await api.get("/facilities", { ...options, params })).data;
export const createFacility = async (data) => (await api.post("/facilities", data)).data;
export const updateFacility = async (id, data) => (await api.put(`/facilities/${id}`, data)).data;
export const createArea = async (data) => (await api.post("/facilities/areas", data)).data;
export const updateArea = async (id, data) => (await api.put(`/facilities/areas/${id}`, data)).data;
export const getAssignments = async () => (await api.get("/facilities/assignments")).data;
export const assignFacilities = async (accountId, maCoSoTiemIds) => (await api.put(`/facilities/assignments/${accountId}`,
    Array.isArray(maCoSoTiemIds) ? { maCoSoTiemIds } : maCoSoTiemIds)).data;
export const getFacilityVaccines = async (id) => (await api.get(`/facilities/${id}/vaccines`)).data;
export const setFacilityVaccine = async (id, vaccineId, trangThai) => (await api.put(`/facilities/${id}/vaccines/${vaccineId}`,
    typeof trangThai === "object" ? trangThai : { trangThai: Boolean(trangThai) })).data;

export default { getAreas, getFacilities, createFacility, updateFacility, createArea, updateArea,
    getAssignments, assignFacilities, getFacilityVaccines, setFacilityVaccine };
