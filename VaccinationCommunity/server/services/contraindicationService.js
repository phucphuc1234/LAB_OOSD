const repository = require("../repositories/contraindicationRepository");
const citizens = require("../repositories/citizenRepository");
const { object, integer, text, date, choice, fail } = require("../utils/validation");
const getAll = () => repository.findAll();
const getById = async (id) => {
    const row = await repository.findById(integer(id, "Mã chống chỉ định"));
    if (!row) fail("Không tìm thấy chống chỉ định.", 404);
    return row;
};
const getMyContraindications = async (account) => {
    const citizen = await citizens.findByAccountId(integer(account, "Tài khoản"));
    if (!citizen) fail("Không tìm thấy hồ sơ người dân.", 404);
    return repository.findByCitizenId(citizen.MaNguoiDan);
};
const normalize = (body, current = {}) => {
    object(body);
    const data = {
        maNguoiDan: integer(body.maNguoiDan ?? current.MaNguoiDan, "Người dân"),
        noiDung: text(body.noiDung ?? current.NoiDung, "Nội dung chống chỉ định", 500, true),
        ngayXacNhan: date(body.ngayXacNhan ?? current.NgayXacNhan ?? new Date(), "Ngày xác nhận"),
        trangThai: choice(body.trangThai ?? current.TrangThai ?? "Đã xác nhận", ["Đã xác nhận", "Đã hủy"]),
        ghiChu: text(body.ghiChu ?? current.GhiChu, "Ghi chú", 500),
    };
    if (data.ngayXacNhan > new Date(Date.now()+5*60000)) fail("Ngày xác nhận không được ở tương lai.");
    return data;
};
const createContraindication = async (body, staff) => {
    const data = normalize(body);
    if (data.trangThai !== "Đã xác nhận") fail("Bản ghi mới phải được xác nhận.");
    if (!await citizens.findById(data.maNguoiDan)) fail("Không tìm thấy người dân.", 404);
    return repository.create(data, integer(staff, "Người xác nhận"));
};
const updateContraindication = async (id, body, staff) => {
    const current = await getById(id);
    const data = normalize(body, current);
    if (data.maNguoiDan !== current.MaNguoiDan) fail("Không được chuyển chống chỉ định sang người dân khác.", 409);
    return repository.update(current.MaChongChiDinh, data, integer(staff, "Người cập nhật"));
};
module.exports = { getAll, getById, getMyContraindications, createContraindication, updateContraindication };
