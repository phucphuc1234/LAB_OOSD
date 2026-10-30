import { useEffect, useState } from "react";
import { MapPin, CalendarDays, ShieldCheck } from "lucide-react";
import { EmptyState } from "../../components/common/DashboardUI";
import scheduleService from "../../services/scheduleService";
import vaccineService from "../../services/vaccineService";
import { getFacilities } from "../../services/facilityService";

const emptyForm = () => ({ maVaccine: "", muiSo: 1, ngayDuKien: "", maCoSoTiem: "", ghiChu: "" });
const formatDate = value => value ? new Date(value).toLocaleString("vi-VN") : "—";
const badge = status => ["Đã tiêm", "Hoàn thành"].includes(status) ? "bg-success" :
    ["Đã hủy", "Vắng mặt"].includes(status) ? "bg-secondary" : status === "Đã xác nhận" ? "bg-primary" : "bg-warning text-dark";

export default function SchedulePage() {
    const [schedules, setSchedules] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [choices, setChoices] = useState({ key: "", rows: [], loading: false, error: "" });
    const choiceKey = `${form.maVaccine}|${form.ngayDuKien}`;
    const currentChoices = choices.key === choiceKey ? choices.rows : [];
    const selectedFacility = currentChoices.find(site => String(site.MaCoSoTiem) === String(form.maCoSoTiem));

    async function loadData() {
        setLoading(true);
        try {
            const [appointments, catalog] = await Promise.all([scheduleService.getMySchedules(), vaccineService.getAllVaccines()]);
            setSchedules(appointments.data || []); setVaccines(catalog.data || []);
        } catch (failure) { setError(failure.response?.data?.message || "Không thể tải lịch tiêm. Vui lòng thử lại."); }
        finally { setLoading(false); }
    }
    useEffect(() => { loadData(); }, []);
    useEffect(() => {
        if (!showForm || !form.maVaccine || !form.ngayDuKien) return;
        const date = new Date(form.ngayDuKien);
        if (!Number.isFinite(date.getTime()) || date <= new Date()) return;
        const controller = new AbortController();
        setChoices({ key: choiceKey, rows: [], loading: true, error: "" });
        getFacilities({ maVaccine: Number(form.maVaccine), ngayDuKien: date.toISOString() }, { signal: controller.signal })
            .then(response => { if (!controller.signal.aborted) setChoices({ key: choiceKey, rows: response.data || [], loading: false, error: "" }); })
            .catch(failure => { if (!controller.signal.aborted) setChoices({ key: choiceKey, rows: [], loading: false,
                error: failure.response?.data?.message || "Chưa tải được cơ sở tiêm. Hãy chọn lại vaccine hoặc thời gian để thử lại." }); });
        return () => controller.abort();
    }, [showForm, form.maVaccine, form.ngayDuKien, choiceKey]);

    function change(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value,
            ...(["maVaccine", "ngayDuKien"].includes(name) ? { maCoSoTiem: "" } : {}) }));
        if (["maVaccine", "ngayDuKien"].includes(name)) setChoices({ key: "", rows: [], loading: false, error: "" });
    }
    function reset() { setForm(emptyForm()); setShowForm(false); setChoices({ key: "", rows: [], loading: false, error: "" }); }
    async function submit(event) {
        event.preventDefault(); setMessage(""); setError("");
        const date = new Date(form.ngayDuKien);
        if (!Number.isFinite(date.getTime()) || date <= new Date()) { setError("Ngày tiêm phải lớn hơn thời điểm hiện tại."); return; }
        if (!selectedFacility || choices.loading) { setError("Vui lòng chọn một cơ sở tiêm trong danh sách phù hợp với vaccine và thời gian đã chọn."); return; }
        setSubmitting(true);
        try {
            const response = await scheduleService.createMySchedule({ maVaccine: Number(form.maVaccine), muiSo: Number(form.muiSo),
                ngayDuKien: date.toISOString(), maCoSoTiem: Number(form.maCoSoTiem), ghiChu: form.ghiChu || null });
            reset(); await loadData(); setMessage(response.message || "Đăng ký lịch tiêm thành công.");
        } catch (failure) { setError(failure.response?.data?.message || "Chưa thể đăng ký. Dữ liệu vaccine có thể đã thay đổi; vui lòng tải lại danh sách cơ sở."); }
        finally { setSubmitting(false); }
    }
    async function cancel(item) {
        if (!window.confirm("Bạn muốn hủy lịch tiêm này?")) return;
        setCancellingId(item.MaLichTiem); setError(""); setMessage("");
        try { await scheduleService.cancelMySchedule(item.MaLichTiem); await loadData(); setMessage("Đã hủy lịch tiêm."); }
        catch (failure) { setError(failure.response?.data?.message || "Chưa thể hủy lịch tiêm."); }
        finally { setCancellingId(null); }
    }
    if (loading) return <div className="text-center py-5" role="status">Đang tải lịch tiêm...</div>;
    return <div className="facility-schedule-page">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div><h2>Lịch tiêm của tôi</h2><p className="text-muted mb-0">Chọn vaccine, thời gian và cơ sở tiêm tại TP. Hồ Chí Minh.</p></div>
            <button type="button" className={`btn ${showForm ? "btn-outline-secondary" : "btn-primary"}`}
                onClick={() => setShowForm(value => !value)} disabled={submitting}>{showForm ? "Đóng" : "+ Đăng ký lịch tiêm"}</button>
        </div>
        {message && <div className="alert alert-success" role="status">{message}</div>}
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {showForm && <section className="card shadow-sm mb-4"><div className="card-header"><strong>Đăng ký lịch tiêm</strong></div>
            <div className="card-body"><div className="facility-context d-flex gap-2 align-items-start mb-4"><ShieldCheck size={20} className="flex-shrink-0" />
                <span>Cơ sở được cung cấp từ danh mục của hệ thống. Bạn chỉ chọn được nơi có vaccine phù hợp và liều khả dụng cho ngày hẹn.</span></div>
                <form onSubmit={submit}><div className="row g-3">
                    <div className="col-md-6"><label htmlFor="schedule-vaccine" className="form-label">Vaccine</label>
                        <select id="schedule-vaccine" name="maVaccine" className="form-select" value={form.maVaccine} onChange={change} required disabled={submitting}>
                            <option value="">— Chọn vaccine —</option>{vaccines.filter(item => item.TrangThai).map(item => <option key={item.MaVaccine} value={item.MaVaccine}>{item.TenVaccine}</option>)}
                        </select></div>
                    <div className="col-md-6"><label htmlFor="schedule-dose" className="form-label">Mũi tiêm</label>
                        <input id="schedule-dose" className="form-control" type="number" min="1" max="20" name="muiSo" value={form.muiSo} onChange={change} required disabled={submitting} />
                        <div className="form-text">Mũi số theo hướng dẫn của nhân viên y tế.</div></div>
                    <div className="col-md-6"><label htmlFor="schedule-date" className="form-label">Ngày giờ tiêm mong muốn</label>
                        <input id="schedule-date" name="ngayDuKien" className="form-control" type="datetime-local" value={form.ngayDuKien} onChange={change} required disabled={submitting} /></div>
                    <div className="col-md-6"><label htmlFor="schedule-facility" className="form-label">Cơ sở tiêm</label>
                        <select id="schedule-facility" name="maCoSoTiem" className="form-select" value={form.maCoSoTiem} onChange={change}
                            disabled={submitting || choices.loading || !currentChoices.length} required>
                            <option value="">{choices.loading ? "Đang tìm cơ sở phù hợp..." : "— Chọn cơ sở tiêm —"}</option>
                            {currentChoices.map(site => <option key={site.MaCoSoTiem} value={site.MaCoSoTiem}>{site.TenCoSo} — {site.PhuongXa || site.TenKhuVuc}</option>)}
                        </select><div className="form-text">Chỉ trong Thành phố Hồ Chí Minh. Đổi vaccine hoặc thời gian sẽ cần chọn lại cơ sở.</div></div>
                    {choices.error && <div className="col-12"><div className="alert alert-danger mb-0" role="alert">{choices.error}</div></div>}
                    {form.maVaccine && form.ngayDuKien && choices.key === choiceKey && !choices.loading && !choices.error && !currentChoices.length &&
                        <div className="col-12"><div className="alert alert-warning mb-0">Chưa có cơ sở phù hợp còn liều vaccine cho ngày đã chọn. Bạn có thể đổi vaccine/thời gian hoặc liên hệ cơ sở y tế.</div></div>}
                    {selectedFacility && <div className="col-12"><div className="facility-card p-3 rounded-4 border" aria-live="polite">
                        <div className="d-flex gap-2 align-items-center mb-2"><MapPin size={20} /><strong>{selectedFacility.TenCoSo}</strong></div>
                        <p className="mb-1">{[selectedFacility.DiaChi, selectedFacility.PhuongXa, "Thành phố Hồ Chí Minh"].filter(Boolean).join(", ")}</p>
                        {selectedFacility.SoDienThoai && <small>Liên hệ: {selectedFacility.SoDienThoai}</small>}
                    </div></div>}
                    <div className="col-12"><label htmlFor="schedule-note" className="form-label">Ghi chú</label>
                        <textarea id="schedule-note" name="ghiChu" className="form-control" rows="3" maxLength="1000" value={form.ghiChu} onChange={change} disabled={submitting} /></div>
                </div><div className="d-flex gap-2 mt-4"><button className="btn btn-primary" type="submit" disabled={submitting || choices.loading || !selectedFacility}>
                    <CalendarDays size={17} className="me-2" />{submitting ? "Đang đăng ký..." : "Đăng ký"}</button>
                    <button type="button" className="btn btn-outline-secondary" onClick={reset} disabled={submitting}>Hủy</button></div></form>
            </div></section>}
        <section className="card shadow-sm"><div className="card-header"><strong>Danh sách lịch tiêm</strong></div><div className="card-body">
            {!schedules.length ? <EmptyState title="Bạn chưa có lịch tiêm" description="Chọn đăng ký lịch tiêm để bắt đầu và theo dõi trạng thái xác nhận tại đây." /> :
                <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Mã lịch</th><th>Vaccine</th><th>Mũi số</th><th>Ngày dự kiến</th><th>Cơ sở tiêm</th><th>Trạng thái</th><th>Ghi chú</th><th>Thao tác</th></tr></thead>
                    <tbody>{schedules.map(item => <tr key={item.MaLichTiem}><td>#{item.MaLichTiem}</td><td><strong>{item.TenVaccine || "—"}</strong></td><td>{item.MuiSo}</td>
                        <td>{formatDate(item.NgayDuKien)}</td><td>{item.TenCoSo || item.CoSoTiem || "—"}</td><td><span className={`badge ${badge(item.TrangThai)}`}>{item.TrangThai}</span></td>
                        <td>{item.GhiChu || "—"}</td><td>{["Đã lên lịch", "Đã xác nhận"].includes(item.TrangThai) ?
                            <button type="button" className="btn btn-sm btn-outline-danger" disabled={cancellingId !== null} onClick={() => cancel(item)}>{cancellingId === item.MaLichTiem ? "Đang hủy…" : "Hủy lịch"}</button> : "—"}</td></tr>)}</tbody>
                </table></div>}
        </div></section>
    </div>;
}
