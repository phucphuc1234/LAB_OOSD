const repository = require("../repositories/vaccineRepository");
const { object, integer, text, fail } = require("../utils/validation");
const normalize = (body, current = {}) => {
    object(body);
    return {
        tenVaccine: text(body.tenVaccine ?? current.TenVaccine, "Tên vaccine", 150, true),
        loaiVaccine: text(body.loaiVaccine ?? current.LoaiVaccine, "Loại vaccine", 100),
        nhaSanXuat: text(body.nhaSanXuat ?? current.NhaSanXuat, "Nhà sản xuất", 150),
        moTa: text(body.moTa ?? current.MoTa, "Mô tả", 500),
        soMuiKhuyenNghi: integer(body.soMuiKhuyenNghi ?? current.SoMuiKhuyenNghi ?? 1, "Số mũi khuyến nghị", 1, 20),
        khoangCachMui: integer(body.khoangCachMui ?? current.KhoangCachMui ?? 0, "Khoảng cách mũi", 0, 3650),
    };
};
const getAllVaccines = () => repository.findAll();
const getVaccineById = async (id) => {
    const row = await repository.findById(integer(id, "Mã vaccine"));
    if (!row) fail("Không tìm thấy vaccine.", 404);
    return row;
};
const uniqueName = async (data, id) => {
    const row = await repository.findByName(data.tenVaccine);
    if (row && row.MaVaccine !== id) fail("Tên vaccine đã tồn tại.", 409);
};
const createVaccine = async (body) => {
    const data = normalize(body);
    await uniqueName(data);
    return repository.create(data);
};
const updateVaccine = async (id, body) => {
    const current = await getVaccineById(id);
    const data = normalize(body, current);
    await uniqueName(data, current.MaVaccine);
    return repository.update(current.MaVaccine, data);
};
const changeStatus = async (id, status) => {
    const current = await getVaccineById(id);
    if (typeof status !== "boolean") fail("Trạng thái phải là true hoặc false.");
    return repository.updateStatus(current.MaVaccine, status);
};
module.exports = { getAllVaccines, getVaccineById, createVaccine, updateVaccine, changeStatus };
