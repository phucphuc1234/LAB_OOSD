const test = require("node:test");
const assert = require("node:assert/strict");
const { createFollowupService, triage, TRANSITIONS } = require("../services/followupService");
const { createFollowupController, publicError } = require("../controllers/followupController");
const NOW = new Date("2026-10-28T12:00:00Z");
const citizen = { maTaiKhoan: 1, tenVaiTro: "Người dân" };
const staff = { maTaiKhoan: 2, tenVaiTro: "Nhân viên" };

function setup() {
    const actors = new Map([[1, { TrangThai: 1, TenVaiTro: "Người dân" }],
        [2, { TrangThai: 1, TenVaiTro: "Nhân viên" }],
        [3, { TrangThai: 1, TenVaiTro: "Người dân" }],
        [4, { TrangThai: 1, TenVaiTro: "Quản trị viên" }]]);
    const reports = new Map(); const history = []; const calls = [];
    const catalog = [{ MaTrieuChung: "pain", TenTrieuChung: "Đau tại chỗ", LaDauHieuCanhBao: 0 },
        { MaTrieuChung: "breathing_difficulty", TenTrieuChung: "Khó thở", LaDauHieuCanhBao: 1 }];
    const vaccines = [{ MaMuiTiem: 10, NgayTiem: new Date("2026-10-27T00:00:00Z"), MuiSo: 1 }];
    const repo = {
        findActor: async (id) => actors.get(id),
        listSymptoms: async () => catalog,
        findVaccination: async (id, accountId) => accountId === 1 ? vaccines.find((v) => v.MaMuiTiem === id) : null,
        listVaccinations: async (id) => id === 1 ? vaccines : [],
        checkInTimes: async () => [...reports.values()].map((r) => ({ MaMuiTiem: r.MaMuiTiem, ThoiDiemBaoCao: r.ThoiDiemBaoCao })),
        findReport: async (id, owner) => {
            const row = reports.get(id);
            return row && (!owner || row.MaTaiKhoanNguoiDan === owner) ? row : null;
        },
        listReports: async (filters, owner) => {
            calls.push({ action: "list", filters, owner });
            const rows = [...reports.values()].filter((r) => !owner || r.MaTaiKhoanNguoiDan === owner);
            return { items: rows, total: rows.length };
        },
        reportSymptoms: async (ids) => [...reports.values()].filter((r) => ids.includes(r.MaTheoDoi))
            .flatMap((r) => r.codes.map((code) => ({ ...catalog.find((s) => s.MaTrieuChung === code), MaTheoDoi: r.MaTheoDoi }))),
        history: async (id) => history.filter((r) => r.MaTheoDoi === id),
        submit: async (owner, data) => {
            calls.push({ action: "submit", owner, data });
            const reportId = reports.size + 1;
            const row = { MaTheoDoi: reportId, MaMuiTiem: data.vaccinationId, MaNguoiDan: 1,
                MaTaiKhoanNguoiDan: owner, HoTen: "Người dân", NgayTiem: vaccines[0].NgayTiem,
                ThoiDiemBaoCao: NOW, KhoiPhatLuc: data.onsetAt, ThoiLuongGio: data.durationHours,
                NhietDo: data.temperature, TrieuChung: data.description, MucDo: data.severity,
                CoDauHieuCanhBao: data.symptoms.includes("breathing_difficulty"),
                TrangThai: ["severe", "emergency"].includes(data.severity) ? "escalated" : "new",
                LanCapNhat: 1, NgayTao: NOW, NgayCapNhat: NOW, codes: data.symptoms };
            reports.set(reportId, row); return row;
        },
        review: async (accountId, reportId, data) => {
            calls.push({ action: "review", accountId, reportId, data });
            const row = reports.get(reportId);
            if (row.LanCapNhat !== data.expectedRevision) throw Object.assign(new Error("stale"), { number: 51003 });
            history.push({ MaTheoDoi: reportId, MaLichSu: history.length + 1, MaTaiKhoan: accountId,
                TrangThaiCu: row.TrangThai, TrangThaiMoi: data.status, LanCapNhat: row.LanCapNhat + 1,
                HanhDong: "review", NoiDung: data.staffAdvice, NgayTao: NOW });
            Object.assign(row, { TrangThai: data.status, HuongXuLy: data.staffAdvice,
                HenTheoDoiLuc: data.nextFollowupAt, LanCapNhat: row.LanCapNhat + 1 });
            return row;
        },
    };
    return { api: createFollowupService(repo, { now: () => new Date(NOW) }), repo, actors, reports, calls, history, vaccines };
}
const checkin = (extra = {}) => ({ vaccinationId: 10, symptoms: [], ...extra });
const update = (extra = {}) => ({ status: "reviewing", staffAdvice: "Đã tiếp nhận, tiếp tục theo dõi.", expectedRevision: 1, ...extra });

test("citizen ownership is enforced on submit and detail, with no unauthorized write", async () => {
    const { api, calls } = setup();
    await assert.rejects(api.submit({ maTaiKhoan: 3 }, checkin()), { statusCode: 404 });
    assert.equal(calls.filter((c) => c.action === "submit").length, 0);
    const report = await api.submit(citizen, checkin());
    await assert.rejects(api.detail({ maTaiKhoan: 3 }, report.id), { statusCode: 404 });
    assert.equal((await api.detail(staff, report.id)).id, report.id);
});
test("live account role/activity overrides stale JWT claims", async () => {
    const { api, actors } = setup();
    actors.get(2).TenVaiTro = "Người dân";
    await assert.rejects(api.listAll(staff), { statusCode: 403 });
    actors.get(1).TrangThai = 0;
    await assert.rejects(api.listMine(citizen), { statusCode: 401 });
});
test("citizens cannot set clinical intake priority, staff fields or review cases", async () => {
    const { api } = setup();
    for (const injected of [{ severity: "none" }, { status: "resolved" }, { staffAdvice: "tự xử lý" }, { maNguoiDan: 3 }]) {
        await assert.rejects(api.submit(citizen, checkin(injected)), { statusCode: 400 });
    }
    await assert.rejects(api.review(citizen, 1, update()), { statusCode: 403 });
});
test("red flags and fever derive priority; a symptom-free check-in is not a reaction", async () => {
    const { api } = setup();
    const none = await api.submit(citizen, checkin());
    assert.equal(none.severity, "none"); assert.equal(none.advice.urgent, false);
    const urgent = await api.submit(citizen, checkin({ symptoms: ["breathing_difficulty"] }));
    assert.equal(urgent.severity, "emergency"); assert.equal(urgent.status, "escalated");
    assert.match(urgent.advice.message, /115/); assert.match(urgent.advice.message, /Không chờ/);
    const fever = await api.submit(citizen, checkin({ temperature: 38.96 }));
    assert.equal(fever.temperature, 39); assert.equal(fever.severity, "severe");
    assert.equal(fever.advice.urgent, true);
    assert.equal(triage({ temperature: 34, symptoms: [], description: "" }).severity, "severe");
});
test("multiple check-ins preserve separate observations for the same vaccination", async () => {
    const { api } = setup();
    const a = await api.submit(citizen, checkin());
    const b = await api.submit(citizen, checkin({ symptoms: ["pain"] }));
    assert.notEqual(a.id, b.id); assert.equal(a.vaccinationId, b.vaccinationId);
    assert.equal((await api.listMine(citizen)).total, 2);
});
test("invalid chronology, duplicates, unknown symptoms and malformed numbers are rejected", async () => {
    const { api } = setup();
    for (const data of [
        { onsetAt: "2026-10-26T23:00:00Z" }, { onsetAt: "2026-10-29T12:00:00Z" },
        { onsetAt: "2026-10-28T09:00" }, { onsetAt: "2026-02-30T12:00:00Z" },
        { temperature: 50 }, { temperature: true },
        { symptoms: ["pain", "pain"] }, { symptoms: ["invented"] }, { durationHours: -1 }, { durationHours: 8761 },
    ]) await assert.rejects(api.submit(citizen, checkin(data)), { statusCode: 400 });
});
test("state transitions prevent skipping review and require planned monitoring", async () => {
    const { api } = setup();
    const row = await api.submit(citizen, checkin());
    await assert.rejects(api.review(staff, row.id, update({ status: "resolved" })), { statusCode: 409 });
    await api.review(staff, row.id, update());
    await assert.rejects(api.review(staff, row.id, update({ expectedRevision: 2, status: "monitoring" })), { statusCode: 400 });
    const monitored = await api.review(staff, row.id, update({ expectedRevision: 2, status: "monitoring", nextFollowupAt: "2026-10-29T12:00:00Z" }));
    assert.equal(monitored.status, "monitoring"); assert.equal(monitored.revision, 3);
});
test("review, correction and reopening preserve revisions and history; stale update is rejected", async () => {
    const { api, history } = setup();
    const row = await api.submit(citizen, checkin());
    await api.review(staff, row.id, update());
    await assert.rejects(api.review(staff, row.id, update()), { statusCode: 409 });
    await api.review(staff, row.id, update({ status: "resolved", expectedRevision: 2 }));
    const reopened = await api.review({ maTaiKhoan: 4 }, row.id, update({ status: "reviewing", expectedRevision: 3 }));
    assert.equal(reopened.history.length, 3); assert.equal(reopened.revision, 4);
    assert.deepEqual(history.map((h) => h.TrangThaiMoi), ["reviewing", "resolved", "reviewing"]);
    await assert.rejects(api.review(staff, row.id, update({ status: "monitoring", expectedRevision: 4,
        nextFollowupAt: "2026-10-28T00:00:00Z" })), { statusCode: 400 });
});
test("all state pairs follow the published workflow, including same-state audited corrections", async () => {
    for (const from of Object.keys(TRANSITIONS)) for (const to of Object.keys(TRANSITIONS)) {
        const { api, reports, calls } = setup();
        await api.submit(citizen, checkin()); reports.get(1).TrangThai = from;
        const input = update({ status: to, nextFollowupAt: to === "monitoring" ? "2026-10-29T12:00:00Z" : null });
        if (from === to || TRANSITIONS[from].includes(to)) {
            assert.equal((await api.review(staff, 1, input)).status, to);
        } else {
            await assert.rejects(api.review(staff, 1, input), { statusCode: 409 });
            assert.equal(calls.filter((c) => c.action === "review").length, 0);
        }
    }
});
test("pagination is bounded and citizen scope cannot be overridden by query fields", async () => {
    const { api, calls } = setup();
    await api.listMine(citizen, { page: "2", limit: "10", vaccinationId: "10" });
    assert.equal(calls.at(-1).owner, 1); assert.equal(calls.at(-1).filters.page, 2);
    for (const query of [{ limit: "101" }, { page: "-1" }, { accountId: "3" }, { status: "fake" }]) {
        await assert.rejects(api.listMine(citizen, query), { statusCode: 400 });
    }
});
test("check-in prompts stay independent and early reports do not clear future prompts", async () => {
    const { api, repo } = setup();
    repo.checkInTimes = async () => [{ MaMuiTiem: 10, ThoiDiemBaoCao: "2026-10-27T01:00:00Z" }];
    let schedule = (await api.vaccinations(citizen))[0].checkInSchedule;
    assert.deepEqual(schedule.map((s) => s.status), ["due", "upcoming", "upcoming"]);
    repo.checkInTimes = async () => [{ MaMuiTiem: 10, ThoiDiemBaoCao: "2026-10-28T01:00:00Z" }];
    schedule = (await api.vaccinations(citizen))[0].checkInSchedule;
    assert.deepEqual(schedule.map((s) => s.status), ["completed", "upcoming", "upcoming"]);
    assert.equal(schedule[0].dueAt, "2026-10-28T00:00:00.000Z");
});
test("controller maps DB concurrency errors and does not leak unexpected SQL details", async () => {
    assert.equal(publicError({ number: 51003, message: "Đã có thay đổi" }).status, 409);
    assert.doesNotMatch(publicError(new Error("server=password; SQL internals")).message, /password|SQL internals/);
    const controller = createFollowupController({ submit: async () => { throw Object.assign(new Error("not owner"), { statusCode: 404 }); } });
    let status; let body;
    await controller.submit({ user: citizen, body: checkin() }, { status: (value) => {
        status = value; return { json: (value) => { body = value; } };
    } });
    assert.equal(status, 404); assert.equal(body.success, false);
});
