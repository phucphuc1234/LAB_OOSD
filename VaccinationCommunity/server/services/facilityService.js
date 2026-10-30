const repository = require('../repositories/facilityRepository');
const { object, integer, text, date, fail } = require('../utils/validation');
const { actorId, assertFacility } = require('../utils/facilityScope');
const CITY = 'Thành phố Hồ Chí Minh';
function keys(input, allowed) {
    object(input);
    if (Object.keys(input).some(k => !allowed.includes(k))) fail('Yêu cầu chứa trường không được phép thay đổi.');
    if (input.tinhThanh !== undefined && input.tinhThanh !== CITY) fail('Chỉ hỗ trợ cơ sở tiêm trong Thành phố Hồ Chí Minh.');
}
function flag(value, fallback = true) {
    if (value === undefined) return fallback;
    if (typeof value !== 'boolean') fail('Trạng thái phải là true hoặc false.');
    return value;
}
function normalizeArea(input) {
    keys(input, ['tenKhuVuc', 'trangThai', 'tinhThanh']);
    return { tenKhuVuc: text(input.tenKhuVuc, 'Tên khu vực', 150, true), trangThai: flag(input.trangThai) };
}
function normalizeFacility(input) {
    keys(input, ['maKhuVuc', 'tenCoSo', 'diaChi', 'phuongXa', 'soDienThoai', 'trangThai', 'ghiChu', 'tinhThanh']);
    const phone = text(input.soDienThoai, 'Số điện thoại', 20);
    if (phone && !/^\+?[0-9 ()-]{8,20}$/.test(phone)) fail('Số điện thoại cơ sở không hợp lệ.');
    return { maKhuVuc: integer(input.maKhuVuc, 'Khu vực'), tenCoSo: text(input.tenCoSo, 'Tên cơ sở', 150, true),
        diaChi: text(input.diaChi, 'Địa chỉ', 255, true), phuongXa: text(input.phuongXa, 'Phường/xã', 100, true),
        soDienThoai: phone, trangThai: flag(input.trangThai), ghiChu: text(input.ghiChu, 'Ghi chú', 1000) };
}
const includeInactive = (user, query) => user.tenVaiTro !== 'Người dân' && ['1', 'true'].includes(query.includeInactive);
const getAreas = (user, query = {}) => repository.areas(includeInactive(user, query));
const getFacilities = (user, query = {}) => repository.facilities(actorId(user), {
    vaccineId: query.maVaccine === undefined ? null : integer(query.maVaccine, 'Vaccine'),
    appointmentDate: query.ngayDuKien ? date(query.ngayDuKien, 'Ngày dự kiến') : null,
    includeInactive: includeInactive(user, query),
});
const saveArea = (user, id, input) => repository.saveArea(actorId(user), id == null ? null : integer(id, 'Khu vực'), normalizeArea(input));
const saveFacility = (user, id, input) => repository.saveFacility(actorId(user), id == null ? null : integer(id, 'Cơ sở tiêm'), normalizeFacility(input));
const getAssignments = () => repository.assignments();
const assignFacilities = (user, account, input) => {
    keys(input, ['maCoSoTiemIds']);
    if (!Array.isArray(input.maCoSoTiemIds) || input.maCoSoTiemIds.length > 200) fail('Cần gửi danh sách tối đa 200 cơ sở.');
    const ids = input.maCoSoTiemIds.map(id => integer(id, 'Cơ sở tiêm'));
    if (new Set(ids).size !== ids.length) fail('Danh sách cơ sở bị trùng.');
    return repository.assign(actorId(user), integer(account, 'Nhân viên'), ids);
};
async function getFacilityVaccines(user, id) {
    id = integer(id, 'Cơ sở tiêm');
    await assertFacility(user, id);
    return repository.offerings(actorId(user), id);
}
const setFacilityVaccine = (user, facility, vaccine, input) => {
    keys(input, ['trangThai']);
    if (input.trangThai === undefined) fail('Cần chọn trạng thái cung cấp vaccine.');
    return repository.saveOffering(actorId(user), integer(facility, 'Cơ sở tiêm'), integer(vaccine, 'Vaccine'), flag(input.trangThai));
};
module.exports = { CITY, normalizeArea, normalizeFacility, flag, getAreas, getFacilities, saveArea, saveFacility,
    getAssignments, assignFacilities, getFacilityVaccines, setFacilityVaccine };
