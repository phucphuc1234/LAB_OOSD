const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createRequire } = require('node:module');
const express = require('express');
function load(file, mocks) {
    const filename = path.join(__dirname, '..', file), unit = new Module(filename, module);
    unit.filename = filename; unit.paths = Module._nodeModulePaths(path.dirname(filename));
    const actual = createRequire(filename);
    unit.require = name => Object.hasOwn(mocks, name) ? mocks[name] : actual(name);
    unit._compile(fs.readFileSync(filename, 'utf8'), filename);
    return unit.exports;
}
const unit = repository => load('services/facilityService.js', {
    '../repositories/facilityRepository': repository,
    '../utils/facilityScope': { actorId: actor => {
        const { integer } = require('../utils/validation');
        return integer(typeof actor === 'object' && actor !== null ? actor.maTaiKhoan : actor, 'Tài khoản');
    }, assertFacility: async () => ({ MaCoSoTiem: 2 }) },
});
const user = { maTaiKhoan: 7, tenVaiTro: 'Quản trị viên' };
const valid = { maKhuVuc: 1, tenCoSo: 'Điểm tiêm kiểm thử', diaChi: 'Địa chỉ minh họa', phuongXa: 'Phường Bến Thành' };
const invalid = e => e.statusCode === 400;

test('facility forms fix the supported city and reject unknown fields, invalid state or missing address', () => {
    const api = unit({});
    assert.equal(api.CITY, 'Thành phố Hồ Chí Minh');
    assert.equal(api.normalizeFacility(valid).trangThai, true);
    assert.equal(api.normalizeFacility({ ...valid, trangThai: false }).trangThai, false);
    for (const patch of [{ tinhThanh: 'Hà Nội' }, { trangThai: 'false' }, { diaChi: '' }, { phuongXa: '' }, { maKhuVuc: true }, { coSoTiem: 'nhập tự do' }]) {
        assert.throws(() => api.normalizeFacility({ ...valid, ...patch }), invalid);
    }
    assert.throws(() => api.normalizeArea({ tenKhuVuc: 'Khu vực', tinhThanh: 'Đồng Nai' }), invalid);
    assert.throws(() => api.normalizeArea({ tenKhuVuc: ' ' }), invalid);
});
test('facility listing passes the current actor and vaccine/date selection; citizens cannot request inactive sites', async () => {
    const calls = [], api = unit({ facilities: async (...args) => { calls.push(args); return []; } });
    const date = new Date(Date.now() + 86400000).toISOString();
    await api.getFacilities({ maTaiKhoan: 9, tenVaiTro: 'Người dân' }, { maVaccine: '4', ngayDuKien: date, includeInactive: '1' });
    assert.equal(calls[0][0], 9);
    assert.equal(calls[0][1].vaccineId, 4);
    assert.equal(calls[0][1].appointmentDate.toISOString(), date);
    assert.equal(calls[0][1].includeInactive, false);
    await api.getFacilities(user, { includeInactive: 'true' });
    assert.equal(calls[1][1].includeInactive, true);
    assert.throws(() => api.getFacilities(user, { maVaccine: '1 OR 1=1' }), invalid);
    assert.throws(() => api.getFacilities(user, { ngayDuKien: '2030-02-30' }), invalid);
    assert.equal(calls.length, 2);
});
test('assignment replacement allows multiple facilities or an empty revoke-all list, never duplicates or forged actor', async () => {
    const calls = [], api = unit({ assign: async (...args) => { calls.push(args); return args; } });
    await api.assignFacilities(user, '8', { maCoSoTiemIds: [1, '2', 3] });
    assert.deepEqual(calls[0], [7, 8, [1, 2, 3]]);
    await api.assignFacilities(user, 8, { maCoSoTiemIds: [] });
    assert.deepEqual(calls[1][2], []);
    for (const body of [{ maCoSoTiemIds: [1, '1'] }, { maCoSoTiemIds: [true] }, { maCoSoTiemIds: '1,2' }, { maCoSoTiemIds: [1], maNguoiPhanCong: 99 }]) {
        assert.throws(() => api.assignFacilities(user, 8, body), invalid);
    }
    assert.throws(() => api.assignFacilities({}, 8, { maCoSoTiemIds: [1] }), invalid);
    assert.equal(calls.length, 2);
});
test('vaccine offerings pass only selected identifiers and an explicit boolean', async () => {
    const calls = [], api = unit({ saveOffering: async (...args) => { calls.push(args); return {}; } });
    await api.setFacilityVaccine(user, '2', '4', { trangThai: false });
    assert.deepEqual(calls[0], [7, 2, 4, false]);
    for (const body of [{}, { trangThai: 0 }, { trangThai: true, coSoTiem: 'forged' }]) {
        assert.throws(() => api.setFacilityVaccine(user, 2, 4, body), invalid);
    }
    assert.equal(calls.length, 1);
});
test('facility routes deny staff/citizen administrative changes while allowing staff offering updates', async t => {
    const calls = [];
    const mockService = Object.fromEntries(['getAreas', 'getFacilities', 'getAssignments', 'saveArea', 'saveFacility', 'assignFacilities', 'getFacilityVaccines', 'setFacilityVaccine']
        .map(name => [name, async (...args) => { calls.push({ name, args }); return []; }]));
    const router = load('routes/facilityRoutes.js', {
        '../services/facilityService': mockService,
        '../middlewares/authMiddleware': (req, _res, next) => { req.user = { maTaiKhoan: 7, tenVaiTro: decodeURIComponent(req.headers['x-test-role']) }; next(); },
    });
    const app = express(); app.use(express.json()); app.use('/api/facilities', router);
    const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    t.after(() => new Promise(resolve => server.close(resolve)));
    const url = `http://127.0.0.1:${server.address().port}/api/facilities`;
    const request = (method, suffix, role) => fetch(url + suffix, { method, headers: { 'x-test-role': encodeURIComponent(role), 'Content-Type': 'application/json' }, body: method === 'GET' ? undefined : '{}' });
    for (const role of ['Người dân', 'Nhân viên']) for (const [method, suffix] of [['POST', ''], ['POST', '/areas'], ['PUT', '/1'], ['PUT', '/areas/1'], ['GET', '/assignments'], ['PUT', '/assignments/3']]) {
        assert.equal((await request(method, suffix, role)).status, 403);
    }
    assert.equal(calls.length, 0);
    assert.equal((await request('PUT', '/1/vaccines/2', 'Người dân')).status, 403);
    assert.equal((await request('PUT', '/1/vaccines/2', 'Nhân viên')).status, 200);
    assert.equal(calls[0].name, 'setFacilityVaccine');
    assert.equal((await request('PUT', '/assignments/3', 'Quản trị viên')).status, 200);
    assert.equal(calls[1].name, 'assignFacilities');
});
