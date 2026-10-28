const repository = require("../repositories/vaccinationRepository");
const { object, integer, text, date, fail } = require("../utils/validation");
const getVaccinationById = async (id) => {
    const record = await repository.findById(integer(id, "Mã mũi tiêm"));
    if (!record) fail("Không tìm thấy mũi tiêm.", 404);
    return record;
};
const createVaccination = async (body, staff) => {
    object(body);
    const missing = value => value === undefined || value === null || value === "";
    const data = {
        maNguoiDan: integer(body.maNguoiDan, "Người dân"),
        maVaccine: integer(body.maVaccine, "Vaccine"),
        maLo: integer(body.maLo, "Lô vaccine"),
        maLichTiem: missing(body.maLichTiem) ? null : integer(body.maLichTiem, "Lịch tiêm"),
        muiSo: integer(body.muiSo, "Mũi số", 1, 20),
        ngayTiem: missing(body.ngayTiem) ? new Date() : date(body.ngayTiem, "Ngày tiêm"),
        coSoTiem: text(body.coSoTiem, "Cơ sở tiêm", 255),
        ketQua: text(body.ketQua ?? "Đã tiêm thành công", "Kết quả", 100, true),
        phanUngSauTiem: text(body.phanUngSauTiem, "Phản ứng sau tiêm", 500),
        ghiChu: text(body.ghiChu, "Ghi chú", 500),
    };
    data.ngayTiem = new Date(Math.floor(data.ngayTiem.getTime() / 1000) * 1000);
    if (data.ngayTiem > new Date()) fail("Ngày ghi nhận tiêm không được ở tương lai.");
    // Do not pre-check/decrement inventory in JavaScript: retries must reach the idempotent SP.
    return repository.create(data, integer(staff, "Nhân viên ghi nhận"));
};
module.exports = { getVaccinationById, createVaccination };
