// Fictional HTTP fixtures verify facility selection in the browser.
// Database authorization and stock transactions are exercised by test:sql.
const { test, expect } = require("@playwright/test");

const sites = [
    { MaCoSoTiem: 1, MaKhuVuc: 1, TenCoSo: "Điểm tiêm Bến Thành · Demo", DiaChi: "01 Đường mẫu",
        PhuongXa: "Phường Bến Thành", TinhThanh: "Thành phố Hồ Chí Minh", TrangThai: true },
    { MaCoSoTiem: 2, MaKhuVuc: 2, TenCoSo: "Điểm tiêm Thủ Đức · Demo", DiaChi: "02 Đường mẫu",
        PhuongXa: "Phường Thủ Đức", TinhThanh: "Thành phố Hồ Chí Minh", TrangThai: true },
];
const vaccines = [
    { MaVaccine: 2, TenVaccine: "Engerix-B", TrangThai: true },
    { MaVaccine: 3, TenVaccine: "Influvac Tetra", TrangThai: true },
];
function futureLocalInput(days = 2) {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).format(new Date(Date.now() + days * 86400000)).replace(" ", "T");
}
async function session(page, role) {
    await page.addInitScript(value => {
        localStorage.setItem("token", "facility-booking-contract-token");
        localStorage.setItem("user", JSON.stringify({ maTaiKhoan: 1, tenDangNhap: "booking.fixture", tenVaiTro: value }));
    }, role);
}
async function mockBooking(page, { role = "Người dân", unavailable = false, resolveFacilities } = {}) {
    const posted = [];
    const future = new Date(Date.now() + 3 * 86400000).toISOString();
    await session(page, role);
    await page.route("**/api/**", async route => {
        const request = route.request(), url = new URL(request.url()), path = url.pathname;
        const ok = data => route.fulfill({ json: { success: true, data } });
        if (path === "/api/facilities") {
            if (resolveFacilities) return resolveFacilities({ route, url, ok });
            return ok(unavailable ? [] : role === "Người dân"
                ? [sites[url.searchParams.get("maVaccine") === "3" ? 1 : 0]] : sites);
        }
        if (path === "/api/vaccines") return ok(vaccines);
        if (path === "/api/citizens") return ok([{ MaNguoiDan: 1, HoTen: "Nguyễn Minh Anh", CCCD: "000000000001" }]);
        if (path === "/api/schedules/me" && request.method() === "POST") {
            posted.push(request.postDataJSON());
            return route.fulfill({ status: 201, json: { success: true, message: "Đăng ký lịch tiêm thành công.", data: {} } });
        }
        if (path === "/api/schedules") return ok([{
            MaLichTiem: 10, MaNguoiDan: 1, MaVaccine: 2, MaCoSoTiem: 1, MaLoDuKien: 3,
            CoSoTiem: sites[0].TenCoSo, MuiSo: 1, HoTen: "Nguyễn Minh Anh", TenVaccine: vaccines[0].TenVaccine,
            TrangThai: "Đã xác nhận", NgayDuKien: future,
        }]);
        if (path === "/api/batches") return ok([
            { MaLo: 3, MaVaccine: 2, MaCoSoTiem: 1, MaLoVaccine: "DEMO-RESERVED", SoLuongCon: 1,
                SoLuongDatTruoc: 1, TrangThai: "Đang sử dụng", HanSuDung: future },
            { MaLo: 4, MaVaccine: 2, MaCoSoTiem: 2, MaLoVaccine: "DEMO-OTHER-SITE", SoLuongCon: 20,
                SoLuongDatTruoc: 0, TrangThai: "Đang sử dụng", HanSuDung: future },
        ]);
        return ok([]);
    });
    return posted;
}
async function openBooking(page) {
    await page.goto("/citizen/schedules");
    await page.getByRole("button", { name: "+ Đăng ký lịch tiêm", exact: true }).click();
    await page.getByLabel("Vaccine", { exact: true }).selectOption("2");
    await page.getByLabel("Ngày giờ tiêm mong muốn", { exact: true }).fill(futureLocalInput());
}

test("Citizen chooses a listed facility, reselects after vaccine/date changes, and sends its numeric ID", async ({ page }) => {
    const posted = await mockBooking(page);
    await openBooking(page);
    const facility = page.getByLabel("Cơ sở tiêm", { exact: true });
    await expect(page.locator('input[name="coSoTiem"]')).toHaveCount(0);
    await facility.selectOption("1");
    await expect(page.getByText("01 Đường mẫu, Phường Bến Thành, Thành phố Hồ Chí Minh", { exact: true })).toBeVisible();

    await page.getByLabel("Vaccine", { exact: true }).selectOption("3");
    await expect(facility).toHaveValue("");
    await expect(facility.locator('option[value="1"]')).toHaveCount(0);
    await facility.selectOption("2");
    await page.getByLabel("Ngày giờ tiêm mong muốn", { exact: true }).fill(futureLocalInput(3));
    await expect(facility).toHaveValue("");
    await expect(page.getByRole("button", { name: "Đăng ký", exact: true })).toBeDisabled();
    await facility.selectOption("2");
    await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đăng ký lịch tiêm thành công.");
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ maVaccine: 3, maCoSoTiem: 2, muiSo: 1 });
    expect(posted[0]).not.toHaveProperty("coSoTiem");
    expect(new Date(posted[0].ngayDuKien).toISOString()).toBe(posted[0].ngayDuKien);
});

test("A late facility response for the previous vaccine cannot replace the current choices", async ({ page }) => {
    let releaseFirst, firstReceived, firstFinished;
    const gate = new Promise(resolve => { releaseFirst = resolve; });
    const received = new Promise(resolve => { firstReceived = resolve; });
    const finished = new Promise(resolve => { firstFinished = resolve; });
    await mockBooking(page, { resolveFacilities: async ({ url, ok }) => {
        if (url.searchParams.get("maVaccine") !== "2") return ok([sites[1]]);
        firstReceived();
        await gate;
        // AbortController may already have canceled this old browser request.
        try { await ok([sites[0]]); } catch { /* A canceled request has no current UI result. */ }
        finally { firstFinished(); }
    } });
    try {
        await openBooking(page);
        await received;
        await page.getByLabel("Vaccine", { exact: true }).selectOption("3");
        const facility = page.getByLabel("Cơ sở tiêm", { exact: true });
        await expect(facility.locator('option[value="2"]')).toHaveCount(1);
        await facility.selectOption("2");
        releaseFirst();
        await finished;
        await expect(facility).toHaveValue("2");
        await expect(facility.locator('option[value="1"]')).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Đăng ký", exact: true })).toBeEnabled();
    } finally { releaseFirst(); }
});

test("No eligible facility leaves booking disabled and explains how to choose again", async ({ page }) => {
    const posted = await mockBooking(page, { unavailable: true });
    await openBooking(page);
    await expect(page.getByText(/Chưa có cơ sở phù hợp còn liều vaccine cho ngày đã chọn/)).toBeVisible();
    await expect(page.getByLabel("Cơ sở tiêm", { exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Đăng ký", exact: true })).toBeDisabled();
    expect(posted).toEqual([]);
});

test("A scheduled dose locks its facility and uses its reservation without exposing another facility's batches", async ({ page }) => {
    await mockBooking(page, { role: "Nhân viên" });
    await page.goto("/staff/vaccinations");
    const facility = page.getByLabel("Cơ sở tiêm", { exact: true });
    const batch = page.getByLabel("Lô vaccine", { exact: true });
    await facility.selectOption("1");
    await page.getByLabel("Vaccine", { exact: true }).selectOption("2");
    // The final dose is reserved, so an unrelated walk-in cannot take it.
    await expect(batch.locator("option")).toHaveCount(1);
    await facility.selectOption("2");
    await expect(batch.locator('option[value="4"]')).toHaveCount(1);
    await batch.selectOption("4");
    await page.getByLabel("Lịch tiêm", { exact: true }).selectOption("10");
    await expect(facility).toHaveValue("1");
    await expect(facility).toBeDisabled();
    await expect(batch).toHaveValue("3");
    await expect(batch.locator('option[value="3"]')).toHaveCount(1);
    await expect(batch.locator('option[value="4"]')).toHaveCount(0);
});
