const STATUSES = ["new", "reviewing", "monitoring", "escalated", "resolved"];
const SEVERITIES = ["none", "mild", "moderate", "severe", "emergency"];
const STAFF_ROLES = ["Nhân viên", "Quản trị viên"];
const ALL_ROLES = ["Người dân", ...STAFF_ROLES];
const TRANSITIONS = {
    new: ["reviewing", "escalated"],
    reviewing: ["monitoring", "escalated", "resolved"],
    monitoring: ["reviewing", "escalated", "resolved"],
    escalated: ["reviewing", "monitoring", "resolved"],
    resolved: ["reviewing", "escalated"],
};
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
function id(value, label = "Mã") {
    if (!((typeof value === "number" && Number.isInteger(value)) ||
        (typeof value === "string" && /^\d+$/.test(value)))) throw fail(`${label} không hợp lệ.`);
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < 1 || n > 2147483647) throw fail(`${label} không hợp lệ.`);
    return n;
}
function onlyKeys(data, allowed) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw fail("Dữ liệu không hợp lệ.");
    if (Object.keys(data).some((key) => !allowed.includes(key))) {
        throw fail("Yêu cầu chứa trường không được phép thay đổi.");
    }
}
function text(value, label, max, required = false) {
    if (value === undefined || value === null) value = "";
    if (typeof value !== "string") throw fail(`${label} phải là văn bản.`);
    value = value.trim();
    if ((required && !value) || value.length > max) throw fail(`${label} không hợp lệ (tối đa ${max} ký tự).`);
    return value;
}
function decimal(value, label, min, max, precision) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
        throw fail(`${label} phải từ ${min} đến ${max}.`);
    }
    const scale = 10 ** precision;
    return Math.round((value + Number.EPSILON) * scale) / scale;
}
function date(value, label) {
    if (value === undefined || value === null || value === "") return null;
    const parts = typeof value === "string" && value.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/i,
    );
    if (!parts) {
        throw fail(`${label} cần có múi giờ hợp lệ.`);
    }
    const [, year, month, day, hour, minute, second] = parts;
    const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
    if (Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > daysInMonth ||
        Number(hour) > 23 || Number(minute) > 59 || Number(second || 0) > 59) {
        throw fail(`${label} không hợp lệ.`);
    }
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) throw fail(`${label} không hợp lệ.`);
    return parsed;
}
const iso = (value) => value ? new Date(value).toISOString() : null;

// These are conservative intake priorities, not diagnosis or attribution to a vaccine.
function triage({ temperature, symptoms, description }) {
    const hasRedFlag = symptoms.some((symptom) => Boolean(symptom.isRedFlag));
    let severity = "none";
    if (hasRedFlag) severity = "emergency";
    else if (temperature !== null && (temperature >= 39 || temperature < 35)) severity = "severe";
    else if (temperature !== null && temperature >= 38.5) severity = "moderate";
    else if (symptoms.length || description || (temperature !== null && temperature >= 38)) severity = "mild";
    return { severity, hasRedFlag };
}
function advice(severity, hasRedFlag) {
    if (hasRedFlag || severity === "emergency") return {
        urgent: true,
        message: "Nếu dấu hiệu cảnh báo đang xuất hiện, gọi 115 hoặc đến cấp cứu ngay. Không chờ phản hồi trên cổng theo dõi.",
    };
    if (severity === "severe") return {
        urgent: true,
        message: "Liên hệ cơ sở y tế để được đánh giá sớm, không chờ phản hồi trên cổng. Nếu khó thở, co giật, mất ý thức hoặc diễn biến nhanh, gọi 115 hoặc đến cấp cứu ngay.",
    };
    return {
        urgent: false,
        message: "Tiếp tục theo dõi theo hướng dẫn của cơ sở tiêm. Nếu có dấu hiệu bất thường hoặc diễn biến nặng, liên hệ cơ sở y tế; tình huống cấp cứu gọi 115. Phiếu này không chẩn đoán hoặc xác nhận đã an toàn.",
    };
}
function symptom(row) {
    return { code: row.MaTrieuChung, name: row.TenTrieuChung, isRedFlag: Boolean(row.LaDauHieuCanhBao) };
}
function caseDto(row, symptoms = []) {
    return {
        id: row.MaTheoDoi, vaccinationId: row.MaMuiTiem, citizenId: row.MaNguoiDan,
        citizenName: row.HoTen, vaccineName: row.TenVaccine, doseNumber: row.MuiSo,
        citizenPhone: row.SoDienThoai || null, citizenEmail: row.Email || null,
        facilityName: row.CoSoTiem || null,
        facilityId: row.MaCoSoTiem || null,
        vaccinationDate: iso(row.NgayTiem), batchNumber: row.MaLoVaccine || null,
        reportedAt: iso(row.ThoiDiemBaoCao), onsetAt: iso(row.KhoiPhatLuc),
        durationHours: row.ThoiLuongGio == null ? null : Number(row.ThoiLuongGio),
        temperature: row.NhietDo == null ? null : Number(row.NhietDo),
        description: row.TrieuChung || "", severity: row.MucDo,
        hasRedFlag: Boolean(row.CoDauHieuCanhBao), status: row.TrangThai,
        staffAdvice: row.HuongXuLy || "", staffName: row.NhanVienXuLy || null,
        staffAccountId: row.MaNhanVienXuLy || null,
        reviewedAt: iso(row.ThoiDiemXuLy), nextFollowupAt: iso(row.HenTheoDoiLuc),
        isFollowupOverdue: Boolean(row.QuaHenTheoDoi),
        revision: Number(row.LanCapNhat), createdAt: iso(row.NgayTao), updatedAt: iso(row.NgayCapNhat),
        symptoms, advice: advice(row.MucDo, Boolean(row.CoDauHieuCanhBao)),
    };
}
function filters(query = {}) {
    onlyKeys(query, ["page", "limit", "status", "severity", "search", "vaccinationId"]);
    const result = { page: query.page === undefined ? 1 : id(query.page, "Trang"),
        limit: query.limit === undefined ? 20 : id(query.limit, "Số dòng") };
    if (result.limit > 100 || result.page > 1000000) throw fail("Phân trang vượt giới hạn.");
    if (query.status && !STATUSES.includes(query.status)) throw fail("Trạng thái không hợp lệ.");
    if (query.severity && !SEVERITIES.includes(query.severity)) throw fail("Mức ưu tiên không hợp lệ.");
    result.status = query.status || null; result.severity = query.severity || null;
    result.search = text(query.search, "Từ khóa", 120);
    result.vaccinationId = query.vaccinationId ? id(query.vaccinationId, "Mũi tiêm") : null;
    return result;
}

function createFollowupService(repository, { now = () => new Date() } = {}) {
    async function authorize(user, roles) {
        if (!user?.maTaiKhoan) throw fail("Bạn chưa đăng nhập.", 401);
        const accountId = id(user.maTaiKhoan, "Tài khoản");
        // Re-read role/activity: a stale JWT must not preserve staff access after demotion/locking.
        const actor = await repository.findActor(accountId);
        if (!actor || !actor.TrangThai) throw fail("Tài khoản không còn hoạt động.", 401);
        if (!roles.includes(actor.TenVaiTro)) throw fail("Bạn không có quyền thực hiện chức năng này.", 403);
        return { accountId, role: actor.TenVaiTro };
    }
    async function hydrate(row, withHistory = false) {
        const symptoms = await repository.reportSymptoms([row.MaTheoDoi]);
        const result = caseDto(row, symptoms.map(symptom));
        if (withHistory) result.history = (await repository.history(row.MaTheoDoi)).map((h) => ({
            id: h.MaLichSu, actorAccountId: h.MaTaiKhoan, fromStatus: h.TrangThaiCu,
            toStatus: h.TrangThaiMoi, revision: h.LanCapNhat, action: h.HanhDong,
            note: h.NoiDung || "", createdAt: iso(h.NgayTao),
        }));
        return result;
    }
    async function getReportFor(actor, reportId, withHistory = true) {
        const own = actor.role === "Người dân";
        const row = await repository.findReport(reportId, own ? actor.accountId : null, own ? null : actor.accountId);
        if (!row) throw fail("Không tìm thấy phiếu theo dõi được phép xem.", 404);
        return hydrate(row, withHistory);
    }
    async function list(user, query = {}, own = false) {
        const actor = await authorize(user, own ? ["Người dân"] : STAFF_ROLES);
        const options = filters(query);
        const result = await repository.listReports(options, own ? actor.accountId : null, own ? null : actor.accountId);
        const symptoms = await repository.reportSymptoms(result.items.map((row) => row.MaTheoDoi));
        return { ...options, total: result.total, items: result.items.map((row) =>
            caseDto(row, symptoms.filter((s) => s.MaTheoDoi === row.MaTheoDoi).map(symptom))) };
    }
    async function submit(user, input) {
        const actor = await authorize(user, ["Người dân"]);
        onlyKeys(input, ["vaccinationId", "onsetAt", "durationHours", "temperature", "symptoms", "description"]);
        const vaccinationId = id(input.vaccinationId, "Mũi tiêm");
        const vaccination = await repository.findVaccination(vaccinationId, actor.accountId);
        if (!vaccination) throw fail("Không tìm thấy mũi tiêm thuộc hồ sơ của bạn.", 404);
        const clock = now();
        const vaccinatedAt = new Date(vaccination.NgayTiem);
        if (!Number.isFinite(vaccinatedAt.getTime()) || vaccinatedAt > clock) throw fail("Mũi tiêm chưa xảy ra.");
        const onsetAt = date(input.onsetAt, "Thời điểm khởi phát");
        if (onsetAt && (onsetAt < vaccinatedAt || onsetAt > clock)) {
            throw fail("Thời điểm khởi phát phải từ lúc tiêm đến hiện tại.");
        }
        const durationHours = decimal(input.durationHours, "Thời gian kéo dài", 0, 8760, 2);
        const temperature = decimal(input.temperature, "Nhiệt độ", 30, 45, 1);
        const description = text(input.description, "Mô tả", 2000);
        if (!Array.isArray(input.symptoms) || input.symptoms.length > 30 ||
            input.symptoms.some((v) => typeof v !== "string") || new Set(input.symptoms).size !== input.symptoms.length) {
            throw fail("Danh sách triệu chứng không hợp lệ.");
        }
        const catalog = (await repository.listSymptoms()).map(symptom);
        const selected = input.symptoms.map((code) => catalog.find((s) => s.code === code));
        if (selected.some((s) => !s)) throw fail("Triệu chứng không còn hợp lệ; hãy tải lại danh mục.");
        const priority = triage({ temperature, symptoms: selected, description });
        const created = await repository.submit(actor.accountId, { vaccinationId, onsetAt, durationHours,
            temperature, description, symptoms: input.symptoms, severity: priority.severity });
        return getReportFor(actor, id(created?.MaTheoDoi, "Phiếu theo dõi"));
    }
    async function review(user, reportId, input) {
        const actor = await authorize(user, STAFF_ROLES);
        reportId = id(reportId, "Phiếu theo dõi");
        onlyKeys(input, ["status", "staffAdvice", "nextFollowupAt", "expectedRevision"]);
        if (!STATUSES.includes(input.status)) throw fail("Trạng thái không hợp lệ.");
        const staffAdvice = text(input.staffAdvice, "Hướng dẫn xử lý", 2000, true);
        const expectedRevision = id(input.expectedRevision, "Phiên bản phiếu");
        const nextFollowupAt = date(input.nextFollowupAt, "Lịch theo dõi tiếp");
        if (nextFollowupAt && nextFollowupAt <= now()) throw fail("Lịch theo dõi tiếp phải ở tương lai.");
        if (input.status === "monitoring" && !nextFollowupAt) throw fail("Cần hẹn thời điểm theo dõi tiếp.");
        if (input.status === "resolved" && nextFollowupAt) throw fail("Phiếu đã xử lý không giữ lịch theo dõi tiếp.");
        const current = await repository.findReport(reportId, null, actor.accountId);
        if (!current) throw fail("Không tìm thấy phiếu theo dõi.", 404);
        if (Number(current.LanCapNhat) !== expectedRevision) throw fail("Phiếu đã thay đổi; hãy tải lại trước khi xử lý.", 409);
        if (input.status !== current.TrangThai && !TRANSITIONS[current.TrangThai]?.includes(input.status)) {
            throw fail("Không thể chuyển trạng thái theo thứ tự này.", 409);
        }
        await repository.review(actor.accountId, reportId, { status: input.status, staffAdvice,
            nextFollowupAt, expectedRevision });
        return getReportFor(actor, reportId);
    }
    async function vaccinations(user) {
        const actor = await authorize(user, ["Người dân"]);
        const [rows, reports] = await Promise.all([
            repository.listVaccinations(actor.accountId), repository.checkInTimes(actor.accountId),
        ]);
        const clock = now().getTime();
        return rows.map((row) => {
            const vaccinatedAt = new Date(row.NgayTiem).getTime();
            return { ...row, checkInSchedule: [24, 48, 72].map((hours) => {
                const due = vaccinatedAt + hours * 3600000;
                // A check-in before a prompt becomes due must not complete that future prompt.
                const intervalEnd = due + 24 * 3600000;
                const completed = reports.some((report) => report.MaMuiTiem === row.MaMuiTiem &&
                    new Date(report.ThoiDiemBaoCao).getTime() >= due &&
                    new Date(report.ThoiDiemBaoCao).getTime() < intervalEnd);
                return { hours, dueAt: new Date(due).toISOString(),
                    status: completed ? "completed" : clock >= due ? "due" : "upcoming" };
            }) };
        });
    }
    return {
        submit, review, vaccinations,
        listMine: (user, query) => list(user, query, true),
        listAll: (user, query) => list(user, query, false),
        detail: async (user, reportId) => getReportFor(await authorize(user, ALL_ROLES), id(reportId, "Phiếu theo dõi")),
        symptoms: async (user) => { await authorize(user, ALL_ROLES); return (await repository.listSymptoms()).map(symptom); },
    };
}
let instance;
function defaultService() {
    if (!instance) instance = createFollowupService(require("../repositories/followupRepository"));
    return instance;
}
const methods = ["submit", "review", "vaccinations", "listMine", "listAll", "detail", "symptoms"];
module.exports = { createFollowupService, STATUSES, SEVERITIES, TRANSITIONS, triage, advice,
    ...Object.fromEntries(methods.map((name) => [name, (...args) => defaultService()[name](...args)])) };
