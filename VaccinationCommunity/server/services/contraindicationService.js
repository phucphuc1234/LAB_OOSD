const repository = require("../repositories/contraindicationRepository");
const citizens = require("../repositories/citizenRepository");
const scope = require("../utils/facilityScope");
const { object, integer, text, date, choice, fail } = require("../utils/validation");
const getAll = actorId => repository.findAll(integer(actorId, "Tài khoản nhân viên"));
const getById = async (id, actorId) => {
    const row = await repository.findById(integer(id, "Mã chống chỉ định"), integer(actorId, "Tài khoản nhân viên"));
    if (!row) fail("Không tìm thấy chống chỉ định được phép xem.", 404);
    return row;
};
const getMyContraindications = async account => {
    const owner = integer(account, "Tài khoản");
    const citizen = await citizens.findByAccountId(owner);
    if (!citizen) fail("Không tìm thấy hồ sơ người dân.", 404);
    return repository.findByCitizenId(citizen.MaNguoiDan, owner);
};
const normalize = (body, current = {}) => {
    object(body);
    if (Object.hasOwn(body, "coSoTiem")) fail("Vui lòng chọn cơ sở tiêm trong danh mục, không nhập địa chỉ tự do.");
    const data = {
        maNguoiDan: integer(body.maNguoiDan ?? current.MaNguoiDan, "Người dân"),
        maCoSoTiem: integer(body.maCoSoTiem ?? current.MaCoSoTiem, "Cơ sở tiêm"),
        noiDung: text(body.noiDung ?? current.NoiDung, "Nội dung chống chỉ định", 500, true),
        ngayXacNhan: date(body.ngayXacNhan ?? current.NgayXacNhan ?? new Date(), "Ngày xác nhận"),
        trangThai: choice(body.trangThai ?? current.TrangThai ?? "Đã xác nhận", ["Đã xác nhận", "Đã hủy"]),
        ghiChu: text(body.ghiChu ?? current.GhiChu, "Ghi chú", 500),
    };
    if (data.ngayXacNhan > new Date(Date.now() + 5 * 60000)) fail("Ngày xác nhận không được ở tương lai.");
    return data;
};
const createContraindication = async (body, actorId) => {
    actorId = integer(actorId, "Người xác nhận");
    const data = normalize(body);
    if (data.trangThai !== "Đã xác nhận") fail("Bản ghi mới phải được xác nhận.");
    await scope.assertFacility(actorId, data.maCoSoTiem, { active: true });
    await scope.assertCitizen(actorId, data.maNguoiDan);
    return repository.create(data, actorId);
};
const updateContraindication = async (id, body, actorId) => {
    actorId = integer(actorId, "Người cập nhật");
    const current = await getById(id, actorId);
    const data = normalize(body, current);
    if (data.maNguoiDan !== current.MaNguoiDan) fail("Không được chuyển chống chỉ định sang người dân khác.", 409);
    if (data.maCoSoTiem !== current.MaCoSoTiem) fail("Không được chuyển chống chỉ định sang cơ sở tiêm khác.", 409);
    await scope.assertFacility(actorId, data.maCoSoTiem);
    await scope.assertCitizen(actorId, data.maNguoiDan);
    return repository.update(current.MaChongChiDinh, data, actorId);
};
module.exports = { getAll, getById, getMyContraindications, createContraindication, updateContraindication };
