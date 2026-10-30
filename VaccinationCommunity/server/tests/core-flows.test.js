const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { createRequire } = require("node:module");
const server = path.join(__dirname, "..");
const load = (file, mocks) => {
    const filename = path.join(server, file);
    const unit = new Module(filename, module);
    unit.filename = filename;
    unit.paths = Module._nodeModulePaths(path.dirname(filename));
    const actualRequire = createRequire(filename);
    unit.require = name => Object.prototype.hasOwnProperty.call(mocks, name) ? mocks[name] : actualRequire(name);
    unit._compile(fs.readFileSync(filename, "utf8"), filename);
    return unit.exports;
};
const future = () => new Date(Date.now() + 86400000).toISOString();
const own = { MaNguoiDan: 12, MaTaiKhoan: 4, TrangThai: true };
const scheduleUnit = (repository = {}) => load("services/scheduleService.js", {
    "../repositories/scheduleRepository": { findAvailableFacility: async () => ({ MaCoSoTiem: 2 }), ...repository },
    "../utils/facilityScope": { assertFacility: async () => ({ MaCoSoTiem: 2 }), assertCitizen: async () => own },
    "../repositories/citizenRepository": { findByAccountId: async () => own, findById: async () => own },
    "../repositories/vaccineRepository": { findById: async () => ({ MaVaccine: 3, TrangThai: true }) },
});
const validationError = error => error.statusCode === 400;

test("calendar and ID validation rejects normalized dates, booleans, fractions and objects", () => {
    const { date, integer } = require("../utils/validation");
    for (const value of [true, {}, 1.2, "1 OR 1=1", "-1", ""]) assert.throws(() => integer(value), validationError);
    for (const value of ["2027-02-30", "not-a-date", "12/11/2099", 123, null]) assert.throws(() => date(value), validationError);
    assert.equal(integer("12"), 12);
    assert.equal(date("2028-02-29").toISOString().slice(0, 10), "2028-02-29");
});

test("citizen booking uses own profile and server status, ignoring forged owner/status", async () => {
    let received;
    const service = scheduleUnit({ createByCitizen: async (citizen, data) => { received = { citizen, data }; return { MaLichTiem: 99 }; } });
    const result = await service.createMySchedule(4, { maNguoiDan: 777, maVaccine: 3, maCoSoTiem: 2, muiSo: 1, ngayDuKien: future(), trangThai: "Đã tiêm" });
    assert.equal(received.citizen, own.MaNguoiDan);
    assert.equal(received.data.maNguoiDan, own.MaNguoiDan);
    assert.equal(received.data.trangThai, "Đã lên lịch");
    assert.equal(result.maLichTiem, 99);
});

test("booking invalid date, negative dose and noninteger vaccine never reaches persistence", async () => {
    let writes = 0;
    const service = scheduleUnit({ createByCitizen: async () => writes++ });
    const valid = { maVaccine: 3, maCoSoTiem: 2, muiSo: 1, ngayDuKien: future() };
    for (const patch of [{ ngayDuKien: "2027-02-30" }, { ngayDuKien: new Date(Date.now()-1000).toISOString() }, { muiSo: -1 }, { maVaccine: 2.2 }]) {
        await assert.rejects(service.createMySchedule(4, { ...valid, ...patch }), validationError);
    }
    assert.equal(writes, 0);
});

test("citizen cannot cancel an appointment outside own profile", async () => {
    let writes = 0;
    const service = scheduleUnit({ findByIdForCitizen: async () => null, updateStatus: async () => writes++ });
    await assert.rejects(service.cancelMySchedule(4, 5), error => error.statusCode === 404);
    assert.equal(writes, 0);
});

test("citizen cancellation passes actor to atomic procedure; completed appointments cannot cancel", async () => {
    const calls = [];
    let status = "Đã xác nhận";
    const service = scheduleUnit({ findByIdForCitizen: async () => ({ MaLichTiem: 5, MaNguoiDan: 12, TrangThai: status }), updateStatus: async (...args) => { calls.push(args); return { TrangThai: args[1] }; } });
    assert.equal((await service.cancelMySchedule(4, 5)).TrangThai, "Đã hủy");
    assert.deepEqual(calls, [[5, "Đã hủy", 4]]);
    status = "Đã tiêm";
    await assert.rejects(service.cancelMySchedule(4, 5), error => error.statusCode === 409);
    assert.equal(calls.length, 1);
});

test("staff cannot rewrite terminal appointments or transfer their citizen", async () => {
    let row = { MaLichTiem: 5, MaNguoiDan: 12, MaVaccine: 3, MaCoSoTiem: 2, MuiSo: 1, NgayDuKien: future(), TrangThai: "Đã tiêm" };
    const service = scheduleUnit({ findById: async () => row });
    await assert.rejects(service.updateSchedule(5, {}, 8), error => error.statusCode === 409);
    row.TrangThai = "Đã xác nhận";
    await assert.rejects(service.updateSchedule(5, { maNguoiDan: 99 }, 8), error => error.statusCode === 409);
});

test("changing vaccine clears old default batch so SQL can reserve a compatible batch", async () => {
    let written;
    const service = scheduleUnit({
        findById: async () => ({ MaLichTiem: 5, MaNguoiDan: 12, MaVaccine: 2, MaCoSoTiem: 2, MaLoDuKien: 41, MuiSo: 1, NgayDuKien: future(), TrangThai: "Đã xác nhận" }),
        update: async (id, data) => { written = data; return data; },
    });
    await service.updateSchedule(5, { maVaccine: 3 }, 8);
    assert.equal(written.maLoDuKien, null);
    assert.equal(written.trangThai, "Đã xác nhận");
});

test("vaccination retries reach the idempotent SQL procedure without stale inventory prechecks", async () => {
    const calls = [];
    const saved = { MaMuiTiem: 50, MaLichTiem: 5 };
    const service = load("services/vaccinationService.js", { "../repositories/vaccinationRepository": { create: async (...args) => { calls.push(args); return saved; } }, "../utils/facilityScope": { assertFacility: async () => ({ MaCoSoTiem: 2 }), assertCitizen: async () => own } });
    const data = { maNguoiDan: 12, maVaccine: 3, maCoSoTiem: 2, maLo: 41, maLichTiem: 5, muiSo: 1, ngayTiem: new Date(Date.now()-60000).toISOString() };
    assert.equal((await service.createVaccination(data, 8)).MaMuiTiem, 50);
    assert.equal((await service.createVaccination(data, 8)).MaMuiTiem, 50);
    assert.equal(calls.length, 2);
    assert.equal(calls[0][1], 8);
    await assert.rejects(service.createVaccination({ ...data, ngayTiem: future() }, 8), validationError);
    assert.equal(calls.length, 2);
    assert.equal(calls[0][0].ngayTiem.getMilliseconds(), 0);
    await assert.rejects(service.createVaccination({ ...data, maLichTiem: false }, 8), validationError);
    await assert.rejects(service.createVaccination({ ...data, maLichTiem: 0 }, 8), validationError);
});

test("reminder generation validates its horizon and counts only newly inserted reminders", async () => {
    const rows = [1,2].map(id => ({ MaLichTiem: id, MaNguoiDan: 12, TenVaccine: "Vaccine", MuiSo: 1, NgayDuKien: future() }));
    let count = 0;
    const service = load("services/notificationService.js", { "../repositories/notificationRepository": {
        findUpcomingSchedules: async () => rows,
        createReminder: async () => (++count === 1 ? { MaThongBao: 1 } : null),
    } });
    assert.deepEqual(await service.generateReminders(3), { checked: 2, created: 1 });
    await assert.rejects(service.generateReminders(-1), validationError);
    await assert.rejects(service.generateReminders(2.5), validationError);
});

test("notification read protects ownership before updating", async () => {
    let writes = 0;
    const service = load("services/notificationService.js", { "../repositories/notificationRepository": {
        findCitizenByAccountId: async () => ({ MaNguoiDan: 12 }), findById: async () => ({ MaNguoiDan: 99 }), markAsRead: async () => writes++,
    } });
    await assert.rejects(service.markMyNotificationRead(4, 9), error => error.statusCode === 403);
    assert.equal(writes, 0);
});

test("controllers map stored-procedure conflicts and hide unexpected SQL errors", () => {
    const { errorResponse } = require("../utils/http");
    const res = { status(value) { this.statusCode=value; return this; }, json(value) { this.body=value; return this; } };
    errorResponse(res, { number: 51004, message: "Lô không đủ số lượng." });
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, "Lô không đủ số lượng.");
    errorResponse(res, new Error("raw SQL connection password detail"));
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body.message, /password|SQL/);
});
