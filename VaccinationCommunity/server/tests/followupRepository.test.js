const test = require("node:test");
const assert = require("node:assert/strict");
const { createFollowupRepository } = require("../repositories/followupRepository");

function setup() {
    const calls = [];
    const sql = { Int: "Int", DateTime2: "DateTime2", MAX: -1,
        VarChar: (n) => `VarChar(${n})`, NVarChar: (n) => `NVarChar(${n})`, Decimal: (p, s) => `Decimal(${p},${s})` };
    const connect = async () => ({ request: () => {
        const params = {};
        const req = { input(name, type, value) { params[name] = { type, value }; return req; },
            async execute(procedure) { calls.push({ procedure, params }); return { recordset: [{ MaTheoDoi: 7 }] }; },
            async query(query) { calls.push({ query, params }); return { recordsets: [[{ Total: 0 }], []], recordset: [] }; } };
        return req;
    } });
    return { repo: createFollowupRepository({ sql, connect }), calls };
}
test("submission calls the actual stored procedure with caller identity and normalized codes", async () => {
    const { repo, calls } = setup();
    await repo.submit(5, { vaccinationId: 12, onsetAt: null, durationHours: null, temperature: 39,
        description: "Sốt", severity: "severe", symptoms: ["fever"] });
    const call = calls[0];
    assert.equal(call.procedure, "dbo.usp_BaoCaoSauTiem");
    assert.equal(call.params.MaTaiKhoan.value, 5);
    assert.deepEqual(JSON.parse(call.params.TrieuChungJson.value), ["fever"]);
    assert.equal(call.params.NhietDo.type, "Decimal(4,1)");
});
test("review uses stored procedure optimistic concurrency, not a direct unlogged UPDATE", async () => {
    const { repo, calls } = setup();
    await repo.review(2, 7, { status: "reviewing", staffAdvice: "Đã liên hệ", nextFollowupAt: null, expectedRevision: 3 });
    assert.equal(calls[0].procedure, "dbo.usp_XuLyTheoDoi");
    assert.equal(calls[0].params.LanCapNhatMongDoi.value, 3);
});
test("list reads the SQL view and binds owner, filters and paging without SQL interpolation", async () => {
    const { repo, calls } = setup();
    const attack = "%' OR 1=1 --";
    await repo.listReports({ page: 2, limit: 20, search: attack, status: "new" }, 1);
    assert.match(calls[0].query, /vw_TheoDoiSauTiemChiTiet/);
    assert.match(calls[0].query, /MaTaiKhoanNguoiDan=@AccountId/);
    assert.doesNotMatch(calls[0].query, /OR 1=1 --/);
    assert.equal(calls[0].params.AccountId.value, 1);
    assert.equal(calls[0].params.Offset.value, 20);
    assert.match(calls[0].params.Search.value, /~%/);
});

test("staff lists scope both the total and page to assigned dose facilities", async () => {
    const { repo, calls } = setup();
    await repo.listReports({ page: 1, limit: 20 }, null, 8);
    const call = calls[0];
    assert.equal(call.params.AccountId.value, null);
    assert.equal(call.params.StaffAccountId.value, 8);
    assert.equal((call.query.match(/fn_CoSoDuocPhep\(@StaffAccountId,scopeMt\.MaCoSoTiem\)=1/g) || []).length, 2);
    assert.doesNotMatch(call.query, /\(@AccountId IS NULL OR MaTaiKhoanNguoiDan/);
});

test("report detail without either owner or staff identity stays fail-closed", async () => {
    const { repo, calls } = setup();
    await repo.findReport(7);
    assert.equal(calls[0].params.AccountId.value, null);
    assert.equal(calls[0].params.StaffAccountId.value, null);
    assert.match(calls[0].query, /fn_CoSoDuocPhep\(@StaffAccountId,scopeMt\.MaCoSoTiem\)=1/);
    await repo.findReport(7, null, 8);
    assert.equal(calls[1].params.StaffAccountId.value, 8);
    assert.equal(calls[1].params.ReportId.value, 7);
});
