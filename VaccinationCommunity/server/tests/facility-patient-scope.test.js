const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { createRequire } = require("node:module");
function load(file, mocks) {
    const filename = path.join(__dirname, "..", file);
    const unit = new Module(filename, module);
    unit.filename = filename;
    unit.paths = Module._nodeModulePaths(path.dirname(filename));
    const actual = createRequire(filename);
    unit.require = key => Object.hasOwn(mocks, key) ? mocks[key] : actual(key);
    unit._compile(fs.readFileSync(filename, "utf8"), filename);
    return unit.exports;
}
const unavailable = () => Object.assign(new Error("outside assigned facility"), { statusCode: 403 });

test("citizen lookup forwards the authenticated actor and rejects unassigned people", async () => {
    const calls = [];
    const service = load("services/citizenService.js", {
        "../repositories/citizenRepository": {
            findAll: async actor => { calls.push(actor); return [{ MaNguoiDan: 12 }]; },
            findScopedById: async (id, actor) => id === 12 && actor === 8 ? { MaNguoiDan: 12 } : null,
        },
    });
    assert.equal((await service.getAllCitizens(8))[0].MaNguoiDan, 12);
    assert.deepEqual(calls, [8]);
    assert.equal((await service.getCitizenById(12, 8)).MaNguoiDan, 12);
    await assert.rejects(service.getCitizenById(99, 8), { statusCode: 404 });
    assert.throws(() => service.getAllCitizens(), { statusCode: 400 });
    await assert.rejects(service.getCitizenById(12), { statusCode: 400 });
});

test("staff history is restricted per record even when the person also visited other facilities", async () => {
    const records = [{ MaMuiTiem: 1, MaCoSoTiem: 11 }, { MaMuiTiem: 2, MaCoSoTiem: 22 }];
    const allowed = (row, scope) => scope?.ownerAccountId === 4 || (scope?.actorId === 8 && row.MaCoSoTiem === 11);
    const service = load("services/historyService.js", {
        "../repositories/citizenRepository": {
            findByAccountId: async id => id === 4 ? { MaNguoiDan: 12 } : null,
            findScopedById: async (id, actor) => id === 12 && actor === 8 ? { MaNguoiDan: 12 } : null,
        },
        "../repositories/historyRepository": {
            findByCitizenId: async (_id, scope) => records.filter(row => allowed(row, scope)),
            findByVaccinationId: async (id, scope) => records.find(row => row.MaMuiTiem === id && allowed(row, scope)) || null,
        },
    });
    assert.deepEqual((await service.getCitizenHistory(12, 8)).map(row => row.MaMuiTiem), [1]);
    assert.deepEqual((await service.getMyHistory(4)).map(row => row.MaMuiTiem), [1, 2]);
    await assert.rejects(service.getHistoryDetail(2, 8), { statusCode: 404 });
    assert.equal((await service.getMyHistoryDetail(4, 2)).MaMuiTiem, 2);
    await assert.rejects(service.getCitizenHistory(99, 8), { statusCode: 404 });
    await assert.rejects(service.getHistoryDetail(1), { statusCode: 400 });
});

test("trace by code, batch ID and dose ID never falls back to an unscoped record", async () => {
    const record = { MaLo: 41, MaLoVaccine: "SITE-11", MaCoSoTiem: 11, TenCoSo: "Cơ sở 11", MaMuiTiem: 1 };
    const service = load("services/traceService.js", {
        "../repositories/traceRepository": {
            traceByBatchId: async (id, actor) => id === 41 && actor === 8 ? [record] : [],
            traceByBatchCode: async (code, actor) => code === "SITE-11" && actor === 8 ? [record] : [],
            traceByVaccinationId: async (id, actor) => id === 1 && actor === 8 ? record : null,
        },
    });
    assert.equal((await service.traceBatchById(41, 8)).soMuiTiemDaSuDung, 1);
    assert.equal((await service.traceBatchByCode("SITE-11", 8)).batch.maCoSoTiem, 11);
    await assert.rejects(service.traceBatchByCode("SITE-11", 9), { statusCode: 404 });
    await assert.rejects(service.traceBatchById(41, 9), { statusCode: 404 });
    await assert.rejects(service.traceVaccination(1, 9), { statusCode: 404 });
    await assert.rejects(service.traceVaccination(1), { statusCode: 400 });
});

test("contraindication writes reject foreign facilities, arbitrary citizens and facility reassignment", async () => {
    const writes = [];
    const current = { MaChongChiDinh: 7, MaNguoiDan: 12, MaCoSoTiem: 11, NoiDung: "Theo hồ sơ xác nhận", TrangThai: "Đã xác nhận" };
    const service = load("services/contraindicationService.js", {
        "../repositories/contraindicationRepository": {
            findById: async (_id, actor) => actor === 8 ? current : null,
            create: async (data, actor) => { writes.push({ data, actor }); return data; },
            update: async (_id, data, actor) => { writes.push({ data, actor }); return data; },
        },
        "../repositories/citizenRepository": {},
        "../utils/facilityScope": {
            assertFacility: async (actor, site) => { if (actor !== 8 || site !== 11) throw unavailable(); },
            assertCitizen: async (actor, citizen) => { if (actor !== 8 || citizen !== 12) throw unavailable(); },
        },
    });
    const valid = { maNguoiDan: 12, maCoSoTiem: 11, noiDung: "Theo hồ sơ xác nhận", maNguoiXacNhan: 999 };
    await service.createContraindication(valid, 8);
    assert.equal(writes[0].actor, 8);
    await assert.rejects(service.createContraindication({ ...valid, maCoSoTiem: 22 }, 8), { statusCode: 403 });
    await assert.rejects(service.createContraindication({ ...valid, maNguoiDan: 99 }, 8), { statusCode: 403 });
    await assert.rejects(service.createContraindication({ ...valid, coSoTiem: "Địa chỉ tự điền" }, 8), { statusCode: 400 });
    await assert.rejects(service.createContraindication({ ...valid, maCoSoTiem: undefined }, 8), { statusCode: 400 });
    await assert.rejects(service.updateContraindication(7, { maCoSoTiem: 22 }, 8), { statusCode: 409 });
    await assert.rejects(service.updateContraindication(7, { maNguoiDan: 99 }, 8), { statusCode: 409 });
    await assert.rejects(service.getById(7, 9), { statusCode: 404 });
    assert.equal(writes.length, 1);
});
