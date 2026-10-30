// UI contract tests use explicit fictional HTTP fixtures, not a production mock mode.
// SQL Server integration is checked separately by npm run test:sql.
const { test, expect } = require("@playwright/test");
const roles = { nd001: "Người dân", nv01: "Nhân viên", "admin.demo": "Quản trị viên" };
const vaccinatedAt = new Date(Date.now() - 30 * 3600000).toISOString();
const symptoms = [
    { code: "pain", name: "Đau tại chỗ tiêm", isRedFlag: false },
    { code: "breathing", name: "Khó thở", isRedFlag: true },
];
function report(overrides = {}) {
    return { id: 101, vaccinationId: 1, citizenId: 1, citizenName: "Nguyễn Minh Anh", citizenPhone: "0900000001",
        vaccineName: "Engerix-B", doseNumber: 1, vaccinationDate: vaccinatedAt,
        facilityName: "Trung tâm Tiêm chủng An Tâm", reportedAt: new Date().toISOString(),
        temperature: 37.2, description: "Cập nhật sức khỏe sau tiêm", severity: "mild", hasRedFlag: false,
        status: "new", staffAdvice: "", staffAccountId: null, staffName: null, revision: 1,
        symptoms: [], history: [], ...overrides };
}
async function mockApi(page, options = {}) {
    const state = { reports: options.staff ? [report()] : [], posted: [], reviews: [], revision: 1 };
    await page.route("**/api/**", async route => {
        const request = route.request(), url = new URL(request.url()), method = request.method();
        const pathname = url.pathname.replace(/^\/api/, "");
        const ok = data => route.fulfill({ json: { success: true, data } });
        if (pathname === "/auth/login") {
            const body = request.postDataJSON();
            return route.fulfill({ json: { success: true, token: "ui-fixture-token", user: { maTaiKhoan: 1, tenDangNhap: body.tenDangNhap, tenVaiTro: roles[body.tenDangNhap] } } });
        }
        if (pathname === "/followups/symptoms") return ok(symptoms);
        if (pathname === "/followups/vaccinations/mine") {
            if (options.failVaccinations) return route.fulfill({ status: 503, json: { success: false, message: "Chưa tải được dữ liệu kiểm thử." } });
            return ok([{ MaMuiTiem: 1, TenVaccine: "Engerix-B", MuiSo: 1, NgayTiem: vaccinatedAt, CoSoTiem: "Trung tâm Tiêm chủng An Tâm", checkInSchedule: [24,48,72].map(hours => ({ hours, dueAt: new Date(new Date(vaccinatedAt).getTime()+hours*3600000).toISOString(), status: hours === 24 ? "due" : "upcoming" })) }]);
        }
        if (pathname === "/followups/mine" && method === "POST") {
            const body = request.postDataJSON(); state.posted.push(body);
            if (options.failSubmit) return route.fulfill({ status: 500, json: { success: false, message: "Chưa lưu được phiếu kiểm thử." } });
            const emergency = body.symptoms.includes("breathing");
            const item = report({ description: body.description, severity: emergency ? "emergency" : "none", status: emergency ? "escalated" : "new", hasRedFlag: emergency, symptoms: symptoms.filter(s => body.symptoms.includes(s.code)) });
            state.reports.unshift(item);
            return route.fulfill({ status: 201, json: { success: true, data: item } });
        }
        if (["/followups", "/followups/", "/followups/mine"].includes(pathname)) return ok({ total: state.reports.length, items: state.reports });
        if (pathname === "/followups/101/review") {
            const body = request.postDataJSON(); state.reviews.push(body);
            if (options.conflict && state.reviews.length === 1) {
                state.revision = 2;
                state.reports[0] = report({ revision: 2, status: "reviewing" });
                return route.fulfill({ status: 409, json: { success: false, message: "Phiếu đã được cập nhật bởi người khác." } });
            }
            const item = report({ revision: ++state.revision, status: body.status, staffAdvice: body.staffAdvice, staffName: "nv01", staffAccountId: 2, history: [{ id: 1, action: "reviewed", toStatus: body.status, note: body.staffAdvice, createdAt: new Date().toISOString() }] });
            state.reports[0] = item; return ok(item);
        }
        if (pathname === "/followups/101") return ok(state.reports[0] || report());
        if (pathname === "/citizens/me") return ok({ HoTen: "Nguyễn Minh Anh", MaNguoiDan: 1 });
        return ok([]);
    });
    return state;
}
async function session(page, role = "Người dân") {
    await page.addInitScript(role => {
        localStorage.setItem("token", "ui-fixture-token");
        localStorage.setItem("user", JSON.stringify({ maTaiKhoan: 1, tenDangNhap: "demo", tenVaiTro: role }));
    }, role);
}
for (const [username, destination] of [["nd001", "/citizen"], ["nv01", "/staff"], ["admin.demo", "/admin"]]) {
    test(`login opens the correct workspace for ${username}`, async ({ page }) => {
        await mockApi(page);
        await page.goto("/login");
        await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
        await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@123456");
        await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`${destination}$`));
        await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.getByRole("link", { name: "Theo dõi sau tiêm", exact: true })).toBeVisible();
    });
}
test("red flag is visible before submission and persists after server acknowledgement", async ({ page }) => {
    const state = await mockApi(page); await session(page);
    await page.goto("/citizen/post-vaccination");
    await page.getByRole("checkbox", { name: /Khó thở/ }).check();
    await expect(page.getByRole("heading", { name: /Có dấu hiệu cảnh báo đỏ/ }).first()).toBeVisible();
    expect(state.posted).toHaveLength(0);
    await page.getByLabel("Mô tả thêm").fill("Khó thở xuất hiện sau tiêm, cần liên hệ cơ sở.");
    await page.getByRole("button", { name: "Gửi cập nhật", exact: true }).click();
    await expect(page.getByText(/Đã ghi nhận cập nhật của bạn/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Có dấu hiệu cảnh báo đỏ/ }).first()).toBeVisible();
    expect(state.posted).toHaveLength(1);
    expect(state.posted[0]).not.toHaveProperty("severity");
    expect(state.posted[0]).not.toHaveProperty("status");
});
test("failed report preserves the citizen's input and emergency instructions", async ({ page }) => {
    await mockApi(page, { failSubmit: true }); await session(page);
    await page.goto("/citizen/post-vaccination");
    const input = page.getByRole("checkbox", { name: /Khó thở/ });
    await input.check();
    await page.getByLabel("Mô tả thêm").fill("Nội dung đang nhập cần được giữ lại.");
    await page.getByRole("button", { name: "Gửi cập nhật", exact: true }).click();
    await expect(page.getByText("Chưa lưu được phiếu kiểm thử.")).toBeVisible();
    await expect(input).toBeChecked();
    await expect(page.getByLabel("Mô tả thêm")).toHaveValue("Nội dung đang nhập cần được giữ lại.");
    await expect(page.getByRole("heading", { name: /Có dấu hiệu cảnh báo đỏ/ })).toBeVisible();
});
test("staff conflict reloads revision while preserving a written response", async ({ page }) => {
    const state = await mockApi(page, { staff: true, conflict: true }); await session(page, "Nhân viên");
    await page.goto("/staff/followups");
    await page.getByRole("button", { name: /Xem phiếu 101/ }).click();
    const advice = page.getByLabel(/Phản hồi cho người dân/);
    await advice.fill("Đã liên hệ người dân và hướng dẫn theo quy trình cơ sở.");
    await page.getByRole("button", { name: /Nhận ca và lưu phản hồi/ }).click();
    await expect(page.getByText(/Phiếu đã thay đổi hoặc trạng thái không còn phù hợp/)).toBeVisible();
    await expect(advice).toHaveValue("Đã liên hệ người dân và hướng dẫn theo quy trình cơ sở.");
    await page.getByRole("button", { name: /Nhận ca và lưu phản hồi/ }).click();
    await expect(page.getByText("Đã lưu phản hồi, người phụ trách và nhật ký xử lý.")).toBeVisible();
    expect(state.reviews.map(item => item.expectedRevision)).toEqual([1, 2]);
});
test("mobile navigation closes on selection and the follow-up form fits the viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); await mockApi(page); await session(page);
    await page.goto("/citizen");
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
    await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: "Theo dõi sau tiêm", exact: true }).click();
    await expect(page).toHaveURL(/post-vaccination$/);
    await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByLabel("Mũi tiêm cần theo dõi")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
test("a failed vaccination load shows an error rather than a misleading empty medical history", async ({ page }) => {
    await mockApi(page, { failVaccinations: true }); await session(page);
    await page.goto("/citizen/post-vaccination");
    await expect(page.getByText("Chưa tải được dữ liệu kiểm thử.")).toBeVisible();
    await expect(page.getByText("Chưa có mũi tiêm để theo dõi")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Thử tải lại", exact: true })).toBeVisible();
});

for (const [role, base, paths] of [
    ["Người dân", "/citizen", ["", "/profile", "/schedules", "/post-vaccination", "/history", "/contraindications", "/notifications", "/change-password"]],
    ["Nhân viên", "/staff", ["", "/citizens", "/vaccines", "/batches", "/schedules", "/vaccinations", "/contraindications", "/followups", "/history", "/trace", "/facilities", "/change-password"]],
    ["Quản trị viên", "/admin", ["", "/users", "/citizens", "/schedules", "/vaccinations", "/vaccines", "/batches", "/followups", "/contraindications", "/history", "/trace", "/facilities", "/facility-workspace", "/change-password"]],
]) {
    test(`all ${role} pages render without uncaught browser errors`, async ({ page }) => {
        const errors = []; page.on("pageerror", error => errors.push(error.message));
        await mockApi(page, { staff: role !== "Người dân" }); await session(page, role);
        for (const suffix of paths) {
            await page.goto(base + suffix);
            await expect(page.getByRole("main")).toBeVisible();
            await expect(page).toHaveURL(new RegExp(`${base}${suffix}$`));
            await expect(page.getByRole("main")).not.toBeEmpty();
        }
        expect(errors).toEqual([]);
    });
}

test("a corrupted saved account returns to login instead of crashing", async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem("user", "{broken-json"); localStorage.setItem("token", "invalid"); });
    await page.goto("/citizen");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
});

test("a reserved final dose is selectable for its appointment, but not for an unrelated walk-in", async ({ page }) => {
    await mockApi(page); await session(page, "Nhân viên");
    await page.route("**/api/**", async route => {
        const pathname = new URL(route.request().url()).pathname;
        const data = {
            "/api/facilities": [{MaCoSoTiem:1,TenCoSo:"Cơ sở demo",MaKhuVuc:1,TrangThai:1,TinhThanh:"Thành phố Hồ Chí Minh"}],
            "/api/facilities/1/vaccines": [{MaVaccine:2,TenVaccine:"Engerix-B",TrangThai:1,VaccineHoatDong:1}],
            "/api/schedules": [{ MaLichTiem:10,MaCoSoTiem:1,MaNguoiDan:1,MaVaccine:2,MaLoDuKien:3,MuiSo:1,HoTen:"Nguyễn Minh Anh",TenVaccine:"Engerix-B",TrangThai:"Đã xác nhận",NgayDuKien:new Date(Date.now()+86400000).toISOString() }],
            "/api/citizens": [{ MaNguoiDan:1,HoTen:"Nguyễn Minh Anh" }],
            "/api/vaccines": [{ MaVaccine:2,TenVaccine:"Engerix-B",TrangThai:1 }],
            "/api/batches": [{ MaLo:3,MaCoSoTiem:1,MaVaccine:2,MaLoVaccine:"DEMO-LAST",SoLuongCon:1,SoLuongDatTruoc:1,TrangThai:"Đang sử dụng",HanSuDung:new Date(Date.now()+86400000).toISOString() }],
        }[pathname];
        if (data) return route.fulfill({ json: {success:true,data} });
        return route.fallback();
    });
    await page.goto("/staff/vaccinations");
    await page.locator('select[name="maVaccine"]').selectOption("2");
    await expect(page.locator('select[name="maLo"] option')).toHaveCount(1);
    await page.locator('select[name="maLichTiem"]').selectOption("10");
    await expect(page.locator('select[name="maLo"]')).toHaveValue("3");
    await expect(page.locator('select[name="maLo"] option')).toHaveCount(2);
});
