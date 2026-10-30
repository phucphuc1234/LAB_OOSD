import { useEffect, useState } from "react";
import { MapPin, CalendarPlus } from "lucide-react";
import { EmptyState } from "../../components/common/DashboardUI";
import scheduleService from "../../services/scheduleService";
import citizenService from "../../services/citizenService";
import vaccineService from "../../services/vaccineService";
import { getFacilities, getFacilityVaccines } from "../../services/facilityService";

const activeStatuses = ["Đã lên lịch", "Đã xác nhận"];
const emptyForm = () => ({ maNguoiDan: "", maVaccine: "", maCoSoTiem: "", muiSo: 1, ngayDuKien: "", ghiChu: "" });
const formatDate = value => value ? new Date(value).toLocaleString("vi-VN") : "—";
const localDate = value => { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const badge = status => ["Đã tiêm", "Hoàn thành"].includes(status) ? "bg-success" : activeStatuses.includes(status) ? "bg-primary" : "bg-secondary";

export default function ScheduleManagementPage() {
    const [schedules, setSchedules] = useState([]);
    const [citizens, setCitizens] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [offerings, setOfferings] = useState({ site: "", rows: [], loading: false, error: "" });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    async function loadData() {
        setLoading(true);
        try {
            const [appointments, people, catalog, sites] = await Promise.all([scheduleService.getAllSchedules(), citizenService.getAllCitizens(), vaccineService.getAllVaccines(), getFacilities()]);
            setSchedules(appointments.data || []); setCitizens(people.data || []); setVaccines(catalog.data || []); setFacilities(sites.data || []);
        } catch (failure) { setError(failure.response?.data?.message || "Không thể tải dữ liệu lịch tiêm."); }
        finally { setLoading(false); }
    }
    useEffect(() => { loadData(); }, []);
    useEffect(() => {
        if (!form.maCoSoTiem) return;
        let cancelled = false;
        const site = String(form.maCoSoTiem);
        setOfferings({ site, rows: [], loading: true, error: "" });
        getFacilityVaccines(site).then(response => { if (!cancelled) setOfferings({ site, rows: response.data || [], loading: false, error: "" }); })
            .catch(failure => { if (!cancelled) setOfferings({ site, rows: [], loading: false, error: failure.response?.data?.message || "Không tải được vaccine của cơ sở." }); });
        return () => { cancelled = true; };
    }, [form.maCoSoTiem]);
    const selectedSite = facilities.find(site => Number(site.MaCoSoTiem) === Number(form.maCoSoTiem));
    const siteVaccines = offerings.site === String(form.maCoSoTiem) ? vaccines.filter(vaccine => vaccine.TrangThai && offerings.rows.some(offer => Number(offer.MaVaccine) === Number(vaccine.MaVaccine) && offer.TrangThai)) : [];
    const siteName = item => item.TenCoSo || facilities.find(site => Number(site.MaCoSoTiem) === Number(item.MaCoSoTiem))?.TenCoSo || item.CoSoTiem || "—";
    function change(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value, ...(name === "maCoSoTiem" ? { maVaccine: "" } : {}) }));
    }
    function edit(item) {
        setEditingId(item.MaLichTiem); setForm({ maNguoiDan: item.MaNguoiDan, maVaccine: item.MaVaccine, maCoSoTiem: item.MaCoSoTiem || "", muiSo: item.MuiSo,
            ngayDuKien: localDate(item.NgayDuKien), ghiChu: item.GhiChu || "" });
        setError(""); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function reset() { setEditingId(null); setForm(emptyForm()); setOfferings({ site: "", rows: [], loading: false, error: "" }); }
    async function submit(event) {
        event.preventDefault(); setError(""); setMessage("");
        if (!selectedSite || !siteVaccines.some(item => Number(item.MaVaccine) === Number(form.maVaccine))) {
            setError("Vui lòng chọn cơ sở được phân công và vaccine đang triển khai tại cơ sở đó."); return;
        }
        const date = new Date(form.ngayDuKien);
        if (!Number.isFinite(date.getTime()) || date <= new Date()) { setError("Ngày tiêm phải lớn hơn thời điểm hiện tại."); return; }
        setSaving(true);
        try {
            const data = { maNguoiDan: Number(form.maNguoiDan), maVaccine: Number(form.maVaccine), maCoSoTiem: Number(form.maCoSoTiem),
                muiSo: Number(form.muiSo), ngayDuKien: date.toISOString(), ghiChu: form.ghiChu };
            if (editingId) await scheduleService.updateSchedule(editingId, data); else await scheduleService.createSchedule(data);
            setMessage(editingId ? "Cập nhật lịch tiêm thành công." : "Tạo lịch tiêm thành công."); reset(); await loadData();
        } catch (failure) { setError(failure.response?.data?.message || "Không thể lưu lịch tiêm."); }
        finally { setSaving(false); }
    }
    async function changeStatus(item, status) {
        if (status === "Đã hủy" && !window.confirm("Bạn muốn hủy lịch tiêm này và giải phóng liều đã giữ?")) return;
        setBusyId(item.MaLichTiem); setMessage(""); setError("");
        try { await scheduleService.updateScheduleStatus(item.MaLichTiem, status); await loadData(); setMessage("Cập nhật trạng thái lịch tiêm thành công."); }
        catch (failure) { setError(failure.response?.data?.message || "Không thể cập nhật trạng thái lịch."); }
        finally { setBusyId(null); }
    }
    if (loading) return <div className="text-center py-5" role="status">Đang tải lịch tiêm...</div>;
    return <div><div className="mb-4"><h2>Quản lý lịch tiêm</h2><p className="text-muted">Tạo lịch, xác nhận và theo dõi lịch tại các cơ sở được phân công ở TP. Hồ Chí Minh.</p></div>
        {message && <div className="alert alert-success" role="status">{message}</div>}{error && <div className="alert alert-danger" role="alert">{error}</div>}
        {!facilities.length && <div className="alert alert-info">Bạn chưa được phân công cơ sở tiêm. Hãy liên hệ quản trị viên trước khi tạo hoặc xử lý lịch.</div>}
        <section className="card shadow-sm mb-4"><div className="card-header"><strong>{editingId ? "Cập nhật lịch tiêm" : "Tạo lịch tiêm"}</strong></div><div className="card-body">
            <div className="facility-context mb-4">Danh sách người dân được giới hạn theo phạm vi quản lý. Người dân mới có thể tự đặt lịch để được tiếp nhận tại cơ sở.</div>
            <form onSubmit={submit}><div className="row g-3">
                <div className="col-md-6"><label className="form-label" htmlFor="manage-schedule-facility">Cơ sở tiêm</label>
                    <select id="manage-schedule-facility" className="form-select" name="maCoSoTiem" value={form.maCoSoTiem} onChange={change} required disabled={saving}>
                        <option value="">— Chọn cơ sở được phân công —</option>{facilities.filter(site => site.TrangThai || Number(site.MaCoSoTiem) === Number(form.maCoSoTiem)).map(site => <option key={site.MaCoSoTiem} value={site.MaCoSoTiem}>{site.TenCoSo}{!site.TrangThai ? " (ngừng hoạt động)" : ""}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="manage-schedule-citizen">Người dân</label>
                    <select id="manage-schedule-citizen" className="form-select" name="maNguoiDan" value={form.maNguoiDan} onChange={change} disabled={Boolean(editingId) || saving} required>
                        <option value="">— Chọn người dân —</option>{citizens.map(person => <option key={person.MaNguoiDan} value={person.MaNguoiDan}>{person.HoTen} — {person.CCCD || `#${person.MaNguoiDan}`}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="manage-schedule-vaccine">Vaccine</label>
                    <select id="manage-schedule-vaccine" className="form-select" name="maVaccine" value={form.maVaccine} onChange={change} disabled={saving || !form.maCoSoTiem || offerings.loading} required>
                        <option value="">{offerings.loading ? "Đang tải vaccine của cơ sở..." : "— Chọn vaccine tại cơ sở —"}</option>{siteVaccines.map(item => <option key={item.MaVaccine} value={item.MaVaccine}>{item.TenVaccine}</option>)}</select>
                    {offerings.error && <div className="text-danger small" role="alert">{offerings.error}</div>}
                    {form.maCoSoTiem && !offerings.loading && !offerings.error && !siteVaccines.length && <div className="form-text">Chưa triển khai vaccine tại cơ sở này. Cập nhật tại mục Cơ sở tiêm được phân công.</div>}</div>
                <div className="col-md-3"><label className="form-label" htmlFor="manage-schedule-dose">Mũi số</label>
                    <input id="manage-schedule-dose" name="muiSo" className="form-control" type="number" min="1" max="20" value={form.muiSo} onChange={change} required disabled={saving} /></div>
                <div className="col-md-3"><label className="form-label" htmlFor="manage-schedule-date">Ngày giờ dự kiến</label>
                    <input id="manage-schedule-date" name="ngayDuKien" className="form-control" type="datetime-local" value={form.ngayDuKien} onChange={change} required disabled={saving} /></div>
                {selectedSite && <div className="col-12"><div className="facility-context d-flex gap-2"><MapPin size={18} className="flex-shrink-0" /><span>{[selectedSite.DiaChi, selectedSite.PhuongXa, "Thành phố Hồ Chí Minh"].filter(Boolean).join(", ")}</span></div></div>}
                <div className="col-12"><label className="form-label" htmlFor="manage-schedule-note">Ghi chú</label><textarea id="manage-schedule-note" className="form-control" name="ghiChu" rows="2" maxLength="1000" value={form.ghiChu} onChange={change} disabled={saving} /></div>
            </div><div className="d-flex gap-2 mt-4"><button className="btn btn-primary" type="submit" disabled={saving || !facilities.length || offerings.loading}><CalendarPlus size={17} className="me-2" />{saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo lịch tiêm"}</button>
                {editingId && <button type="button" className="btn btn-outline-secondary" onClick={reset} disabled={saving}>Hủy sửa</button>}</div></form>
        </div></section>
        <section className="card shadow-sm"><div className="card-header d-flex justify-content-between"><strong>Danh sách lịch tiêm</strong><span className="badge bg-primary">{schedules.length} lịch</span></div><div className="card-body">
            {!schedules.length ? <EmptyState title="Chưa có lịch tiêm" description="Lịch thuộc cơ sở được phân công sẽ xuất hiện tại đây." /> : <div className="table-responsive"><table className="table table-hover align-middle">
                <thead><tr><th>Mã / Người dân</th><th>Vaccine / Mũi</th><th>Ngày dự kiến</th><th>Cơ sở tiêm</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{schedules.map(item =>
                    <tr key={item.MaLichTiem}><td><strong>{item.HoTen}</strong><div className="small text-muted">#{item.MaLichTiem}</div></td><td>{item.TenVaccine}<div className="small text-muted">Mũi {item.MuiSo}</div></td>
                        <td>{formatDate(item.NgayDuKien)}</td><td>{siteName(item)}</td><td><span className={`badge ${badge(item.TrangThai)}`}>{item.TrangThai}</span></td><td>
                            {activeStatuses.includes(item.TrangThai) ? <div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => edit(item)} disabled={saving || busyId !== null}>Sửa</button>
                                {item.TrangThai === "Đã lên lịch" && <button className="btn btn-sm btn-outline-success" type="button" onClick={() => changeStatus(item, "Đã xác nhận")} disabled={busyId !== null}>Xác nhận</button>}
                                <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => changeStatus(item, "Đã hủy")} disabled={busyId !== null}>Hủy lịch</button>
                                {new Date(item.NgayDuKien) <= new Date() && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => changeStatus(item, "Vắng mặt")} disabled={busyId !== null}>Vắng mặt</button>}</div> : "—"}</td></tr>)}</tbody></table></div>}
        </div></section>
    </div>;
}
