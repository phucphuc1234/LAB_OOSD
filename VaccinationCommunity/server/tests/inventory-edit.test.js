const test = require('node:test');
const assert = require('node:assert/strict');
const configFile = require.resolve('../config/database');
const vaccineFile = require.resolve('../repositories/vaccineRepository');
let state;
const clone = (value) => structuredClone(value);
class Transaction {
    async begin(level) { state.level = level; this.snapshot = clone(state.batch); }
    async commit() { state.committed = true; }
    async rollback() {
        state.rolledBack = true;
        state.batch = this.snapshot;
        if (state.rollbackError) throw state.rollbackError;
    }
}
class Request {
    constructor(transaction) { this.transaction = transaction; this.parameters = {}; }
    input(name, _type, value) { this.parameters[name] = value; return this; }
    async query(query) {
        state.queries.push({ query, parameters: this.parameters, transactional: !!this.transaction });
        if (query.includes('sys.sp_getapplock')) {
            if (state.lockError) throw state.lockError;
            state.lockAcquired = true;
            return { recordset: [] };
        }
        if (query.includes('FROM LOVACCINE lv') && query.includes('WHERE lv.MaLo')) {
            const shown = clone(state.batch);
            // A committed vaccination occurs after the service's initial read, before edit() begins.
            if (state.concurrentVaccination) {
                state.batch.SoLuongCon -= 1;
                state.concurrentVaccination = false;
            }
            return { recordset: shown ? [shown] : [] };
        }
        if (query.includes('FROM LOVACCINE WITH (UPDLOCK,HOLDLOCK)')) return { recordset: state.batch ? [clone(state.batch)] : [] };
        if (query.includes('SELECT MAX(NgayDuKien)')) return { recordset: [{ LastAppointment: state.lastAppointment || null }] };
        if (query.includes('UPDATE LOVACCINE SET')) {
            state.updateCount += 1;
            state.batch.TrangThai = this.parameters.TrangThai;
            if (Object.hasOwn(this.parameters, 'HanSuDung')) state.batch.HanSuDung = this.parameters.HanSuDung;
            if (Object.hasOwn(this.parameters, 'NgaySanXuat')) state.batch.NgaySanXuat = this.parameters.NgaySanXuat;
            if (Object.hasOwn(this.parameters, 'GhiChu')) state.batch.GhiChu = this.parameters.GhiChu;
            if (state.updateError) throw state.updateError;
            return { recordset: [] };
        }
        if (query.includes('SELECT * FROM LOVACCINE WHERE MaLo')) {
            if (state.finalReadError) throw state.finalReadError;
            return { recordset: state.batch ? [clone(state.batch)] : [] };
        }
        throw new Error(`Unexpected SQL in inventory test: ${query}`);
    }
}
const sql = { Transaction, Request, ISOLATION_LEVEL: { SERIALIZABLE: 'serializable' },
    connect: async () => ({ request: () => new Request() }), Int: 'Int', Date: 'Date',
    VarChar: (size) => size, NVarChar: (size) => size };
require.cache[configFile] = { id: configFile, filename: configFile, loaded: true, exports: { sql } };
require.cache[vaccineFile] = { id: vaccineFile, filename: vaccineFile, loaded: true,
    exports: { findById: async () => ({ MaVaccine: 2, TrangThai: true }) } };
const service = require('../services/batchService');
const reset = (overrides = {}) => {
    state = { batch: { MaLo: 17, MaLoVaccine: 'BATCH-2099', MaVaccine: 2,
        NgaySanXuat: new Date('2020-01-01T00:00:00Z'), HanSuDung: new Date('2099-12-31T00:00:00Z'),
        SoLuongNhap: 100, SoLuongCon: 100, SoLuongDatTruoc: 0, TrangThai: 'Đang sử dụng', GhiChu: null,
        ...overrides }, queries: [], updateCount: 0 };
};
const rejectedWithoutWrite = async (operation, status) => {
    await assert.rejects(operation, { statusCode: status });
    assert.equal(state.updateCount, 0);
    assert.equal(state.committed, undefined);
    assert.equal(state.rolledBack, true);
    assert.equal(state.level, 'serializable');
};

test('stale quantity body after a concurrent vaccination cannot restore consumed inventory', async () => {
    reset(); state.concurrentVaccination = true;
    await rejectedWithoutWrite(service.updateBatch(17, { soLuongNhap: 100, soLuongCon: 100, ghiChu: 'new note' }), 409);
    assert.equal(state.batch.SoLuongCon, 99);
    assert.equal(state.batch.GhiChu, null);
    assert.equal(state.lockAcquired, true);
});

test('an explicit inventory quantity edit is rejected before any write', async () => {
    reset();
    await rejectedWithoutWrite(service.updateBatch(17, { soLuongNhap: 150, soLuongCon: 150 }), 409);
    assert.equal(state.batch.SoLuongNhap, 100);
    assert.equal(state.batch.SoLuongCon, 100);
});

test('a batch reserved for an appointment cannot be made inactive', async () => {
    reset({ SoLuongDatTruoc: 7 });
    await rejectedWithoutWrite(service.changeStatus(17, 'Tạm ngừng'), 409);
    assert.equal(state.batch.TrangThai, 'Đang sử dụng');
    assert.equal(state.batch.SoLuongDatTruoc, 7);
});

test('an expiry edit cannot invalidate appointments already holding stock', async () => {
    reset({ SoLuongDatTruoc: 1 }); state.lastAppointment = new Date('2099-06-01T09:00:00Z');
    await rejectedWithoutWrite(service.updateBatch(17, { hanSuDung: '2099-05-31' }), 409);
    assert.equal(state.batch.HanSuDung.toISOString().slice(0, 10), '2099-12-31');
});

test('no available stock means a batch cannot return to in-use state', async () => {
    reset({ SoLuongCon: 0, TrangThai: 'Hết hàng' });
    await rejectedWithoutWrite(service.changeStatus(17, 'Đang sử dụng'), 409);
});

test('an expired batch cannot return to in-use state', async () => {
    reset({ NgaySanXuat: new Date('1999-01-01'), HanSuDung: new Date('2000-01-01'), TrangThai: 'Hết hạn' });
    await rejectedWithoutWrite(service.changeStatus(17, 'Đang sử dụng'), 409);
});

test('status cannot claim out of stock while physical stock remains', async () => {
    reset();
    await rejectedWithoutWrite(service.changeStatus(17, 'Hết hàng'), 409);
});

test('status cannot claim expiry before its actual expiry date', async () => {
    reset();
    await rejectedWithoutWrite(service.changeStatus(17, 'Hết hạn'), 409);
});

test('valid metadata changes commit without changing stock or its reservations', async () => {
    reset({ SoLuongDatTruoc: 2 }); state.lastAppointment = new Date('2099-06-01');
    const row = await service.updateBatch(17, { ghiChu: 'Bảo quản theo hướng dẫn' });
    assert.equal(row.GhiChu, 'Bảo quản theo hướng dẫn');
    assert.equal(row.SoLuongCon, 100);
    assert.equal(row.SoLuongNhap, 100);
    assert.equal(row.SoLuongDatTruoc, 2);
    assert.equal(state.updateCount, 1);
    assert.equal(state.committed, true);
    assert.equal(state.rolledBack, undefined);
});

test('a missing batch rolls back before mutation', async () => {
    reset(); state.batch = null;
    await rejectedWithoutWrite(service.changeStatus(17, 'Tạm ngừng'), 404);
});

test('an error after UPDATE rolls back metadata and keeps the original failure', async () => {
    reset(); const original = new Error('final read failed'); state.finalReadError = original;
    await assert.rejects(service.updateBatch(17, { ghiChu: 'must not persist' }), (failure) => failure === original);
    assert.equal(state.batch.GhiChu, null);
    assert.equal(state.batch.SoLuongCon, 100);
    assert.equal(state.rolledBack, true);
    assert.equal(state.committed, undefined);
});

test('a lock acquisition failure performs no inventory update and is not masked by rollback failure', async () => {
    reset(); const original = Object.assign(new Error('inventory lock unavailable'), { number: 51003 });
    state.lockError = original; state.rollbackError = new Error('rollback interrupted');
    await assert.rejects(service.changeStatus(17, 'Tạm ngừng'), (failure) => failure === original);
    assert.equal(state.updateCount, 0);
    assert.equal(state.committed, undefined);
    assert.equal(state.rolledBack, true);
});
