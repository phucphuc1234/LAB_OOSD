const test = require('node:test');
const assert = require('node:assert/strict');
const configFile = require.resolve('../config/database');
let state;
class Transaction {
    async begin(level) { state.level = level; state.beginAssignments = structuredClone(state.assignments); }
    async commit() { state.committed = true; }
    async rollback() { state.rolledBack = true; state.assignments = state.beginAssignments; }
}
class Request {
    constructor() { this.parameters = {}; }
    input(name, _type, value) { this.parameters[name] = value; return this; }
    async query(query) {
        state.queries.push({ query, parameters: this.parameters });
        if (query.includes("vt.TenVaiTro=N'Quản trị viên'")) return { recordset: state.admins };
        if (query.includes('SELECT TenVaiTro FROM VAITRO')) return { recordset: state.role ? [state.role] : [] };
        if (query.includes('SELECT MaNguoiDan FROM NGUOIDAN')) return { recordset: state.citizen ? [state.citizen] : [] };
        if (query.includes('FROM dbo.PHANCONG_COSOTIEM WITH')) return { recordset: structuredClone(state.assignments) };
        if (query.startsWith('DELETE dbo.PHANCONG_COSOTIEM')) { state.assignments = []; return { recordset: [] }; }
        if (query.startsWith('UPDATE TAIKHOAN')) return { recordset: [state.updated] };
        if (query.includes('INSERT INTO LICHSUHIEUCHINH')) {
            if (state.failAccountAudit && query.includes("VALUES('TAIKHOAN'")) throw new Error('audit unavailable');
            return { recordset: [] };
        }
        if (query.includes('FROM TAIKHOAN tk WITH (UPDLOCK,HOLDLOCK)')) return { recordset: state.target ? [state.target] : [] };
        throw new Error('Unexpected SQL query in repository test');
    }
}
const sql = { Transaction, Request, ISOLATION_LEVEL: { SERIALIZABLE: 'serializable' },
    connect: async () => ({}), Int: 'Int', Bit: 'Bit', MAX: 'MAX', NVarChar: (size) => size };
require.cache[configFile] = { id: configFile, filename: configFile, loaded: true, exports: { sql } };
const repository = require('../repositories/userRepository');
const reset = () => {
    state = { admins: [{ MaTaiKhoan: 3 }], target: { MaTaiKhoan: 7, TenDangNhap: 'staff', MaVaiTro: 2, TenVaiTro: 'Nhân viên', TrangThai: true },
        role: { TenVaiTro: 'Người dân' }, citizen: null, updated: null, queries: [],
        assignments: [{ MaCoSoTiem: 11 }, { MaCoSoTiem: 22 }] };
};

test('changing a staff account without citizen profile into citizen is a conflict, with no account write', async () => {
    reset();
    await assert.rejects(repository.updateRole(7, 1, 3), { statusCode: 409 });
    assert.equal(state.level, 'serializable');
    assert.equal(state.rolledBack, true);
    assert.equal(state.committed, undefined);
    assert.equal(state.queries.some((q) => q.query.startsWith('UPDATE')), false);
});

test('an actor who lost admin privileges before account transaction cannot mutate another account', async () => {
    reset(); state.admins = [{ MaTaiKhoan: 4 }];
    await assert.rejects(repository.updateStatus(7, false, 3), { statusCode: 403 });
    assert.equal(state.rolledBack, true);
    assert.equal(state.queries.length, 1);
});

test('a citizen profile can be restored to citizen role and an audit event commits with account changes', async () => {
    reset(); state.citizen = { MaNguoiDan: 21 };
    state.updated = { ...state.target, MaVaiTro: 1, TenVaiTro: 'Người dân' };
    assert.deepEqual(await repository.updateRole(7, 1, 3), state.updated);
    assert.equal(state.committed, true);
    assert.equal(state.rolledBack, undefined);
    const write = state.queries.find((q) => q.query.startsWith('UPDATE TAIKHOAN'));
    assert.equal(write.parameters.MaTaiKhoan, 7);
    assert.equal(write.parameters.Value, 1);
    const audit = state.queries.find((q) => q.query.includes("VALUES('TAIKHOAN'"));
    assert.equal(audit.parameters.MaTaiKhoan, 3);
    assert.equal(JSON.parse(audit.parameters.DuLieuCu).TenVaiTro, 'Nhân viên');
    assert.equal(JSON.parse(audit.parameters.DuLieuMoi).TenVaiTro, 'Người dân');
    assert.equal(audit.parameters.DuLieuCu.includes('MatKhau'), false);
    assert.deepEqual(state.assignments, []);
    const assignmentAudit = state.queries.find(q => q.query.includes("VALUES('PHANCONG_COSOTIEM'"));
    assert.deepEqual(JSON.parse(assignmentAudit.parameters.DuLieuCu).map(row => row.MaCoSoTiem), [11, 22]);
    assert.deepEqual(JSON.parse(assignmentAudit.parameters.DuLieuMoi), []);
    assert.equal(assignmentAudit.parameters.MaTaiKhoan, 3);
});

test('demotion and later promotion require a fresh facility assignment', async () => {
    reset(); state.citizen = { MaNguoiDan: 21 };
    state.updated = { ...state.target, MaVaiTro: 1, TenVaiTro: 'Người dân' };
    await repository.updateRole(7, 1, 3);
    assert.deepEqual(state.assignments, []);
    state.target = state.updated;
    state.role = { TenVaiTro: 'Nhân viên' };
    state.updated = { ...state.target, MaVaiTro: 2, TenVaiTro: 'Nhân viên' };
    await repository.updateRole(7, 2, 3);
    assert.deepEqual(state.assignments, []);
    assert.equal(state.queries.some(q => /INSERT.*PHANCONG_COSOTIEM/.test(q.query) && !q.query.includes('LICHSUHIEUCHINH')), false);
});

test('an unchanged staff role and account locking retain explicitly configured facilities', async () => {
    reset(); state.role = { TenVaiTro: 'Nhân viên' }; state.updated = { ...state.target };
    await repository.updateRole(7, 2, 3);
    assert.deepEqual(state.assignments.map(row => row.MaCoSoTiem), [11, 22]);
    await repository.updateStatus(7, false, 3);
    assert.equal(state.queries.some(q => q.query.startsWith('DELETE dbo.PHANCONG_COSOTIEM')), false);
});

test('a failed account audit rolls back the role change and assignment removal together', async () => {
    reset(); state.citizen = { MaNguoiDan: 21 }; state.failAccountAudit = true;
    state.updated = { ...state.target, MaVaiTro: 1, TenVaiTro: 'Người dân' };
    await assert.rejects(repository.updateRole(7, 1, 3), /audit unavailable/);
    assert.equal(state.rolledBack, true);
    assert.equal(state.committed, undefined);
    assert.deepEqual(state.assignments.map(row => row.MaCoSoTiem), [11, 22]);
});
