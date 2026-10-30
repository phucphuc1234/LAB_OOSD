const { test, expect } = require("@playwright/test");

const city = "Thành phố Hồ Chí Minh";
const areas = [{ MaKhuVuc: 1, TenKhuVuc: "Khu vực Trung tâm", TrangThai: true }, { MaKhuVuc: 2, TenKhuVuc: "Khu vực phía Đông", TrangThai: true }, { MaKhuVuc: 3, TenKhuVuc: "Khu vực tạm ngừng", TrangThai: false }];
const sites = [
    { MaCoSoTiem: 1, MaKhuVuc: 1, TenKhuVuc: areas[0].TenKhuVuc, TenCoSo: "Điểm tiêm Bến Thành · Demo", DiaChi: "12 Đường cộng đồng", PhuongXa: "Phường Bến Thành", TinhThanh: city, TrangThai: true },
    { MaCoSoTiem: 2, MaKhuVuc: 2, TenKhuVuc: areas[1].TenKhuVuc, TenCoSo: "Điểm tiêm Thủ Đức · Demo", DiaChi: "48 Đường chăm sóc", PhuongXa: "Phường Thủ Đức", TinhThanh: city, TrangThai: true },
    { MaCoSoTiem: 3, MaKhuVuc: 3, TenKhuVuc: areas[2].TenKhuVuc, TenCoSo: "Điểm tiêm tạm ngừng · Demo", DiaChi: "70 Đường cộng đồng", PhuongXa: "Phường Bình Thạnh", TinhThanh: city, TrangThai: false },
];
async function signIn(page, role) {
    await page.addInitScript(value => {
        localStorage.setItem("token", "facility-ui-contract-token");
        localStorage.setItem("user", JSON.stringify({ maTaiKhoan: value === "Quản trị viên" ? 1 : 2, tenDangNhap: value === "Quản trị viên" ? "admin.demo" : "nv01", tenVaiTro: value }));
    }, role);
}
async function mockNetwork(page, { empty = false, rejectOffering = false, inactiveAssigned = false } = {}) {
    const writes = [];
    let assignments = [{ MaTaiKhoan: 2, MaCoSoTiem: inactiveAssigned ? 3 : 1 }];
    await page.route("**/api/**", async route => {
        const request = route.request(), path = new URL(request.url()).pathname;
        let data = [];
        if (request.method() !== "GET") {
            const body = request.postDataJSON(); writes.push({ path, body });
            if (path.includes("/assignments/")) assignments = body.maCoSoTiemIds.map(id => ({ MaTaiKhoan: 2, MaCoSoTiem: id }));
            if (rejectOffering && /\/facilities\/\d+\/vaccines\/\d+$/.test(path)) return route.fulfill({ status: 403, json: { success: false, message: "Cơ sở không còn trong phạm vi phân công." } });
            data = {};
        } else if (path.endsWith("/areas")) data = areas;
        else if (path.endsWith("/assignments")) data = { staff: [{ MaTaiKhoan: 2, TenDangNhap: "nv01", HoTen: "Nguyễn Minh An" }], assignments };
        else if (/\/facilities\/\d+\/vaccines$/.test(path)) data = [{ MaVaccine: 7, TenVaccine: "Influvac Tetra", TrangThai: false, VaccineHoatDong: true }];
        else if (path === "/api/facilities") data = empty ? [] : sites;
        else if (path === "/api/vaccines") data = [{ MaVaccine: 7, TenVaccine: "Influvac Tetra", TrangThai: true, SoMuiKhuyenNghi: 1, KhoangCachMui: 0 }];
        await route.fulfill({ json: { success: true, data } });
    });
    return writes;
}

test("Admin creates a listed HCM facility and assigns multiple facilities, then revokes them", async ({ page }) => {
    await signIn(page, "Quản trị viên");
    const writes = await mockNetwork(page);
    await page.goto("/admin/facilities");
    await page.getByRole("button", { name: "Thêm cơ sở", exact: true }).click();
    await expect(page.getByLabel("Tỉnh / thành phố", { exact: true })).toHaveValue(city);
    await expect(page.getByLabel("Tỉnh / thành phố", { exact: true })).toHaveAttribute("readonly", "");
    await page.getByLabel("Tên cơ sở *", { exact: true }).fill("Điểm tiêm Bình Thạnh · Demo");
    await page.getByLabel("Khu vực phục vụ *", { exact: true }).selectOption("1");
    await page.getByLabel("Địa chỉ *", { exact: true }).fill("30 Đường cộng đồng");
    await page.getByLabel("Phường / xã *", { exact: true }).fill("Phường Bình Thạnh");
    await page.getByRole("button", { name: "Lưu cơ sở", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đã lưu cơ sở tiêm");
    expect(writes[0]).toMatchObject({ path: "/api/facilities", body: { maKhuVuc: 1, tenCoSo: "Điểm tiêm Bình Thạnh · Demo", phuongXa: "Phường Bình Thạnh" } });
    expect(writes[0].body).not.toHaveProperty("tinhThanh");
    await page.getByRole("button", { name: "Phân công nhân viên", exact: true }).click();
    await page.getByLabel("Nhân viên y tế", { exact: true }).selectOption("2");
    await expect(page.getByLabel(/Điểm tiêm tạm ngừng/)).toBeDisabled();
    await page.getByLabel(/Điểm tiêm Thủ Đức/).check();
    await page.getByRole("button", { name: "Lưu phân công", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Đã cập nhật phân công");
    expect(writes.at(-1)).toEqual({ path: "/api/facilities/assignments/2", body: { maCoSoTiemIds: [1, 2] } });
    await page.getByLabel(/Điểm tiêm Bến Thành/).uncheck();
    await page.getByLabel(/Điểm tiêm Thủ Đức/).uncheck();
    await page.getByRole("button", { name: "Lưu phân công", exact: true }).click();
    await expect.poll(() => writes.at(-1)?.body.maCoSoTiemIds).toEqual([]);
});

test("Staff configures vaccine offering at the selected assigned facility and handles revoked access", async ({ page }) => {
    await signIn(page, "Nhân viên");
    const writes = await mockNetwork(page, { rejectOffering: true });
    await page.goto("/staff/facilities");
    await page.getByLabel("Cơ sở đang làm việc", { exact: true }).selectOption("2");
    const toggle = page.getByLabel("Bật tiếp nhận Influvac Tetra", { exact: true });
    await toggle.click();
    await expect(page.getByRole("alert")).toContainText("Cơ sở không còn trong phạm vi phân công");
    await expect(toggle).not.toBeChecked();
    expect(writes.at(-1)).toEqual({ path: "/api/facilities/2/vaccines/7", body: { trangThai: true } });
    await page.goto("/staff/vaccines");
    await expect(page.getByRole("heading", { name: "Danh mục vaccine", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Thêm vaccine", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Cơ sở phụ trách", exact: true }).last()).toBeVisible();
});

test("Staff without assigned facilities sees an actionable empty state", async ({ page }) => {
    await signIn(page, "Nhân viên");
    await mockNetwork(page, { empty: true });
    await page.goto("/staff/facilities");
    await expect(page.getByRole("heading", { name: "Chưa có cơ sở được phân công", exact: true })).toBeVisible();
    await expect(page.getByLabel("Cơ sở đang làm việc", { exact: true })).toHaveCount(0);
});

test("Facility assignment page stays within a phone viewport and respects reduced motion", async ({ page }) => {
    await signIn(page, "Quản trị viên");
    await mockNetwork(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/admin/facilities");
    await page.getByRole("button", { name: "Phân công nhân viên", exact: true }).click();
    await page.getByLabel("Nhân viên y tế", { exact: true }).selectOption("2");
    const bounds = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(bounds.scroll).toBeLessThanOrEqual(bounds.viewport + 2);
    const duration = await page.locator(".route-stage").evaluate(element => parseFloat(getComputedStyle(element).animationDuration));
    expect(duration).toBeLessThan(0.001);
});


test("Admin may retain or remove an existing assignment to an inactive facility", async ({ page }) => {
    await signIn(page, "Quản trị viên");
    const writes = await mockNetwork(page, { inactiveAssigned: true });
    await page.goto("/admin/facilities");
    await page.getByRole("button", { name: "Phân công nhân viên", exact: true }).click();
    await page.getByLabel("Nhân viên y tế", { exact: true }).selectOption("2");
    const legacy = page.getByLabel(/Điểm tiêm tạm ngừng/);
    await expect(legacy).toBeChecked();
    await expect(legacy).toBeEnabled();
    await legacy.uncheck();
    await page.getByRole("button", { name: "Lưu phân công", exact: true }).click();
    await expect.poll(() => writes.at(-1)?.body.maCoSoTiemIds).toEqual([]);
});
