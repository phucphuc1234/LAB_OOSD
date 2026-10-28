const repository = require("../repositories/batchRepository");
const vaccines = require("../repositories/vaccineRepository");
const { object, integer, text, date, choice, fail } = require("../utils/validation");
const statuses = ["Đang sử dụng", "Tạm ngừng", "Hết hàng", "Hết hạn"];
const normalize = (body, current = {}) => {
    object(body);
    const result = {
        maLoVaccine: text(body.maLoVaccine ?? current.MaLoVaccine, "Mã lô vaccine", 50, true),
        maVaccine: integer(body.maVaccine ?? current.MaVaccine, "Vaccine"),
        ngaySanXuat: (body.ngaySanXuat ?? current.NgaySanXuat) ? date(body.ngaySanXuat ?? current.NgaySanXuat, "Ngày sản xuất") : null,
        hanSuDung: date(body.hanSuDung ?? current.HanSuDung, "Hạn sử dụng"),
        soLuongNhap: integer(body.soLuongNhap ?? current.SoLuongNhap, "Số lượng nhập", 1, 10000000),
        ghiChu: text(body.ghiChu ?? current.GhiChu, "Ghi chú", 255),
        trangThai: choice(body.trangThai ?? current.TrangThai ?? "Đang sử dụng", statuses),
    };
    result.soLuongCon = integer(body.soLuongCon ?? current.SoLuongCon ?? result.soLuongNhap, "Số lượng còn", 0, result.soLuongNhap);
    if (result.ngaySanXuat && result.hanSuDung <= result.ngaySanXuat) fail("Hạn sử dụng phải sau ngày sản xuất.");
    if (result.ngaySanXuat && result.ngaySanXuat > new Date()) fail("Ngày sản xuất không được ở tương lai.");
    return result;
};
const getAllBatches = () => repository.findAll();
const getBatchById = async (id) => {
    const row = await repository.findById(integer(id, "Mã lô"));
    if (!row) fail("Không tìm thấy lô vaccine.", 404);
    return row;
};
const createBatch = async (body) => {
    const data = normalize(body);
    if (!/^[A-Za-z0-9._/-]+$/.test(data.maLoVaccine)) fail("Mã lô chỉ được dùng chữ Latin, số và các dấu . _ / -.");
    const vaccine = await vaccines.findById(data.maVaccine);
    if (!vaccine) fail("Không tìm thấy vaccine.", 404);
    if (!vaccine.TrangThai) fail("Vaccine đang ngừng sử dụng.", 409);
    if (data.soLuongCon !== data.soLuongNhap) fail("Lô mới phải có số lượng còn bằng số lượng nhập.");
    if (data.hanSuDung.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10)) fail("Không được nhập lô đã hết hạn.");
    if (data.trangThai === "Hết hàng" || data.trangThai === "Hết hạn") fail("Trạng thái không phù hợp với lô mới.");
    if (await repository.findByCode(data.maLoVaccine)) fail("Mã lô vaccine đã tồn tại.", 409);
    return repository.create(data);
};
const updateBatch = async (id, body) => {
    const current = await getBatchById(id);
    const data = normalize(body, current);
    if (data.maVaccine !== current.MaVaccine || data.maLoVaccine !== current.MaLoVaccine) fail("Không được đổi vaccine hoặc mã của lô đã tạo.", 409);
    // The repository rechecks under lock, so a concurrent vaccination cannot be overwritten.
    return repository.update(current.MaLo, data);
};
const changeStatus = async (id, status) => {
    integer(id, "Mã lô");
    choice(status, statuses);
    return repository.updateStatus(Number(id), status);
};
module.exports = { getAllBatches, getBatchById, createBatch, updateBatch, changeStatus };
