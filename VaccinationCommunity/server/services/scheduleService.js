const repository = require("../repositories/scheduleRepository");
const citizens = require("../repositories/citizenRepository");
const vaccines = require("../repositories/vaccineRepository");
const { assertFacility, assertCitizen } = require("../utils/facilityScope");
const { object, integer, text, date, choice, fail } = require("../utils/validation");
const active = ["Đã lên lịch", "Đã xác nhận"];
const normalize = (body, current = {}) => {
    object(body);
    if (Object.hasOwn(body, "coSoTiem")) fail("Vui lòng chọn cơ sở tiêm trong danh mục; không nhập địa chỉ tự do.");
    const result = {
        maCoSoTiem: integer(body.maCoSoTiem ?? current.MaCoSoTiem, "Cơ sở tiêm"),
        maNguoiDan: integer(body.maNguoiDan ?? current.MaNguoiDan, "Người dân"),
        maVaccine: integer(body.maVaccine ?? current.MaVaccine, "Vaccine"),
        muiSo: integer(body.muiSo ?? current.MuiSo, "Mũi số", 1, 20),
        ngayDuKien: date(body.ngayDuKien ?? current.NgayDuKien, "Ngày dự kiến"),
        ghiChu: text(body.ghiChu ?? current.GhiChu, "Ghi chú", 1000),
        maLoDuKien: body.maLoDuKien === null ? null : (body.maLoDuKien ?? current.MaLoDuKien ?? null),
        trangThai: current.TrangThai || "Đã lên lịch",
    };
    if (((body.maVaccine !== undefined && current.MaVaccine && result.maVaccine !== current.MaVaccine) ||
        (body.maCoSoTiem !== undefined && current.MaCoSoTiem && result.maCoSoTiem !== current.MaCoSoTiem)) && body.maLoDuKien === undefined) {
        result.maLoDuKien = null; // Select a compatible FEFO batch again when changing vaccine.
    }
    if (result.maLoDuKien !== null) result.maLoDuKien = integer(result.maLoDuKien, "Lô vaccine dự kiến");
    if (result.ngayDuKien <= new Date()) fail("Ngày tiêm phải lớn hơn thời điểm hiện tại.");
    return result;
};
const validateReferences = async (data) => {
    const citizen = await citizens.findById(data.maNguoiDan);
    if (!citizen) fail("Không tìm thấy người dân.", 404);
    if (citizen.TrangThai === false || citizen.TrangThai === 0) fail("Hồ sơ người dân đang ngừng hoạt động.", 409);
    const vaccine = await vaccines.findById(data.maVaccine);
    if (!vaccine) fail("Không tìm thấy vaccine.", 404);
    if (!vaccine.TrangThai) fail("Vaccine hiện đang ngừng sử dụng.", 409);
};
const getAllSchedules = (actor) => repository.findAll(integer(actor, "Tài khoản"));
const getScheduleById = async (id, actor) => {
    const row = await repository.findById(integer(id, "Mã lịch tiêm"), integer(actor, "Tài khoản"));
    if (!row) fail("Không tìm thấy lịch tiêm.", 404);
    return row;
};
const ownCitizen = async (account) => {
    const citizen = await citizens.findByAccountId(integer(account, "Tài khoản"));
    if (!citizen) fail("Không tìm thấy hồ sơ người dân.", 404);
    return citizen;
};
const getMySchedules = async (account) => repository.findByCitizenId((await ownCitizen(account)).MaNguoiDan);
const createSchedule = async (body, staff) => {
    staff = integer(staff, "Nhân viên lập lịch");
    const data = normalize(body);
    await assertFacility(staff, data.maCoSoTiem, { active: true });
    await assertCitizen(staff, data.maNguoiDan);
    await validateReferences(data);
    return repository.create(data, staff);
};
const updateSchedule = async (id, body, staff) => {
    staff = integer(staff, "Nhân viên");
    const current = await getScheduleById(id, staff);
    if (!active.includes(current.TrangThai)) fail("Chỉ được sửa lịch chưa hoàn tất hoặc chưa hủy.", 409);
    object(body);
    if (body.maNguoiDan !== undefined && integer(body.maNguoiDan, "Người dân") !== current.MaNguoiDan) {
        fail("Không được chuyển lịch tiêm sang người dân khác.", 409);
    }
    const data = normalize(body, current);
    await assertFacility(staff, data.maCoSoTiem, { active: true });
    await assertCitizen(staff, data.maNguoiDan);
    await validateReferences(data);
    return repository.update(Number(id), data, staff);
};
const changeStatus = async (id, status, account) => {
    integer(id, "Mã lịch tiêm");
    choice(status, ["Đã lên lịch", "Đã xác nhận", "Đã tiêm", "Hoàn thành", "Đã hủy", "Vắng mặt"]);
    account = integer(account, "Tài khoản");
    await getScheduleById(id, account);
    // The procedure rejects terminal-status forgery and releases stock reservations atomically.
    return repository.updateStatus(Number(id), status, account);
};
const createMySchedule = async (account, body) => {
    const citizen = await ownCitizen(account);
    const data = normalize({ ...object(body), maNguoiDan: citizen.MaNguoiDan });
    await validateReferences(data);
    const facility = await repository.findAvailableFacility(data.maCoSoTiem, data.maVaccine, data.ngayDuKien);
    if (!facility) fail("Cơ sở tiêm không cung cấp vaccine này hoặc không còn liều khả dụng vào ngày đã chọn.", 409);
    const row = await repository.createByCitizen(citizen.MaNguoiDan, data, integer(account, "Tài khoản"));
    return { maLichTiem: row.MaLichTiem, message: "Đăng ký lịch tiêm thành công.", schedule: row };
};
const cancelMySchedule = async (account, id) => {
    const citizen = await ownCitizen(account);
    const schedule = await repository.findByIdForCitizen(integer(id, "Mã lịch tiêm"), citizen.MaNguoiDan);
    if (!schedule) fail("Không tìm thấy lịch tiêm thuộc hồ sơ của bạn.", 404);
    if (!active.includes(schedule.TrangThai)) fail("Chỉ được hủy lịch tiêm đang chờ thực hiện.", 409);
    return repository.updateStatus(schedule.MaLichTiem, "Đã hủy", Number(account));
};
module.exports = { getAllSchedules, getScheduleById, getMySchedules, createSchedule, updateSchedule, changeStatus, createMySchedule, cancelMySchedule };
