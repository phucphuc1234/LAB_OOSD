import { useEffect, useMemo, useState } from "react";
import { MapPin, Syringe, ShieldCheck } from "lucide-react";
import vaccinationService from "../../services/vaccinationService";
import scheduleService from "../../services/scheduleService";
import citizenService from "../../services/citizenService";
import vaccineService from "../../services/vaccineService";
import batchService from "../../services/batchService";
import { getFacilities } from "../../services/facilityService";

const localNow = () => { const date = new Date(); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const emptyForm = () => ({ maLichTiem: "", maNguoiDan: "", maVaccine: "", maLo: "", maCoSoTiem: "", muiSo: 1,
    ngayTiem: localNow(), ketQua: "Đã tiêm thành công", phanUngSauTiem: "", ghiChu: "" });

export default function VaccinationManagementPage() {
    const [form, setForm] = useState(emptyForm);
    const [schedules, setSchedules] = useState([]);
    const [citizens, setCitizens] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [batches, setBatches] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [created, setCreated] = useState(null);
    async function loadData() {
        setLoading(true);
        try {
            const [appointments, people, catalog, stock, sites] = await Promise.all([scheduleService.getAllSchedules(), citizenService.getAllCitizens(),
                vaccineService.getAllVaccines(), batchService.getAllBatches(), getFacilities()]);
            setSchedules(appointments.data || []); setCitizens(people.data || []); setVaccines(catalog.data || []); setBatches(stock.data || []); setFacilities(sites.data || []);
        } catch (failure) { setError(failure.response?.data?.message || "Không thể tải dữ liệu ghi nhận mũi tiêm."); }
        finally { setLoading(false); }
    }
    useEffect(() => { loadData(); }, []);
    const availableSchedules = useMemo(() => schedules.filter(item => ["Đã lên lịch", "Đã xác nhận"].includes(item.TrangThai)), [schedules]);
    const availableBatches = useMemo(() => {
        if (!form.maVaccine || !form.maCoSoTiem) return [];
        const today = new Date().toISOString().slice(0, 10);
        const selectedSchedule = schedules.find(item => Number(item.MaLichTiem) === Number(form.maLichTiem));
        return batches.filter(item => {
            const reservedForThisSchedule = selectedSchedule && Number(selectedSchedule.MaLoDuKien) === Number(item.MaLo);
            const usable = Number(item.SoLuongCon) - Number(item.SoLuongDatTruoc || 0) > 0 || (reservedForThisSchedule && Number(item.SoLuongCon) > 0);
            return Number(item.MaVaccine) === Number(form.maVaccine) && Number(item.MaCoSoTiem) === Number(form.maCoSoTiem) &&
                usable && item.TrangThai === "Đang sử dụng" && String(item.HanSuDung).slice(0, 10) >= today;
        });
    }, [batches, form.maVaccine, form.maCoSoTiem, form.maLichTiem, schedules]);
    const selectedSite = facilities.find(site => Number(site.MaCoSoTiem) === Number(form.maCoSoTiem));
    function change(event) {
        const { name, value } = event.target;
        setForm(previous => ({ ...previous, [name]: value, ...(["maVaccine", "maCoSoTiem"].includes(name) ? { maLo: "" } : {}) }));
    }
    function chooseSchedule(event) {
        const schedule = availableSchedules.find(item => Number(item.MaLichTiem) === Number(event.target.value));
        if (!schedule) { setForm(emptyForm()); return; }
        setForm({ ...emptyForm(), maLichTiem: schedule.MaLichTiem, maNguoiDan: schedule.MaNguoiDan, maVaccine: schedule.MaVaccine,
            maCoSoTiem: schedule.MaCoSoTiem || "", maLo: schedule.MaLoDuKien || "", muiSo: schedule.MuiSo || 1 });
    }
    function reset() { setForm(emptyForm()); setMessage(""); setError(""); setCreated(null); }
    async function submit(event) {
        event.preventDefault(); setMessage(""); setError("");
        if (!selectedSite || !availableBatches.some(item => Number(item.MaLo) === Number(form.maLo))) {
            setError("Vui lòng chọn cơ sở được phân công và lô vaccine khả dụng đúng cơ sở đó."); return;
        }
        const date = new Date(form.ngayTiem);
        if (!Number.isFinite(date.getTime()) || date > new Date()) { setError("Ngày giờ tiêm thực tế không được ở tương lai."); return; }
        setSaving(true);
        try {
            const response = await vaccinationService.createVaccination({ maNguoiDan: Number(form.maNguoiDan), maVaccine: Number(form.maVaccine), maLo: Number(form.maLo),
                maCoSoTiem: Number(form.maCoSoTiem), maLichTiem: form.maLichTiem ? Number(form.maLichTiem) : null, muiSo: Number(form.muiSo),
                ngayTiem: date.toISOString(), ketQua: form.ketQua, phanUngSauTiem: form.phanUngSauTiem, ghiChu: form.ghiChu });
            setCreated(response.data || null); setForm(emptyForm()); await loadData(); setMessage("Ghi nhận mũi tiêm thành công.");
        } catch (failure) { setError(failure.response?.data?.message || "Không thể ghi nhận mũi tiêm. Thông tin đang nhập được giữ nguyên để kiểm tra lại."); }
        finally { setSaving(false); }
    }
    if (loading) return <div className="text-center py-5" role="status">Đang tải dữ liệu ghi nhận mũi tiêm...</div>;
    return <div><div className="mb-4"><h2>Ghi nhận mũi tiêm</h2><p className="text-muted">Ghi nhận tiêm thực tế tại cơ sở được phân công, đồng bộ tồn kho và lịch theo dõi sau tiêm.</p></div>
        {message && <div className="alert alert-success" role="status">{message}</div>}{error && <div className="alert alert-danger" role="alert">{error}</div>}
        {!facilities.length && <div className="alert alert-info">Bạn chưa được phân công cơ sở tiêm. Liên hệ quản trị viên để được cấp phạm vi quản lý.</div>}
        {created && <section className="card mb-4 border-success"><div className="card-body"><h3 className="h5">Đã lưu mũi tiêm #{created.MaMuiTiem}</h3>
            <p className="mb-1">{created.HoTen || citizens.find(person => Number(person.MaNguoiDan) === Number(created.MaNguoiDan))?.HoTen} · {created.TenVaccine || vaccines.find(item => Number(item.MaVaccine) === Number(created.MaVaccine))?.TenVaccine} · Mũi {created.MuiSo}</p>
            <p className="mb-0 text-muted">{created.TenCoSo || created.CoSoTiem || facilities.find(site => Number(site.MaCoSoTiem) === Number(created.MaCoSoTiem))?.TenCoSo}. Người dân có thể cập nhật sức khỏe tại mục Theo dõi sau tiêm.</p>
        </div></section>}
        <section className="card shadow-sm"><div className="card-header"><strong>Thông tin mũi tiêm thực tế</strong></div><div className="card-body">
            <div className="facility-context d-flex align-items-start gap-2 mb-4"><ShieldCheck size={20} className="flex-shrink-0" /><span>Chọn lịch hẹn để lấy đúng người dân, vaccine và cơ sở đã đăng ký. Khi ghi trực tiếp, chỉ sử dụng lô tồn kho thuộc cơ sở được phân công.</span></div>
            <form onSubmit={submit}><fieldset disabled={saving}><div className="row g-3">
                <div className="col-12"><label className="form-label" htmlFor="vaccination-schedule">Lịch tiêm</label>
                    <select id="vaccination-schedule" className="form-select" name="maLichTiem" value={form.maLichTiem} onChange={chooseSchedule}>
                        <option value="">— Ghi nhận trực tiếp, không qua lịch —</option>{availableSchedules.map(item => <option key={item.MaLichTiem} value={item.MaLichTiem}>#{item.MaLichTiem} — {item.HoTen} — {item.TenVaccine} — {item.TenCoSo || item.CoSoTiem}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="vaccination-facility">Cơ sở tiêm</label>
                    <select id="vaccination-facility" className="form-select" name="maCoSoTiem" value={form.maCoSoTiem} onChange={change} disabled={Boolean(form.maLichTiem)} required>
                        <option value="">— Chọn cơ sở được phân công —</option>{facilities.filter(site => site.TrangThai || Number(site.MaCoSoTiem) === Number(form.maCoSoTiem)).map(site => <option key={site.MaCoSoTiem} value={site.MaCoSoTiem}>{site.TenCoSo}</option>)}</select>
                    {form.maLichTiem && <div className="form-text">Cơ sở lấy từ lịch hẹn và không được đổi khi ghi mũi.</div>}</div>
                <div className="col-md-6"><label className="form-label" htmlFor="vaccination-citizen">Người dân</label>
                    <select id="vaccination-citizen" className="form-select" name="maNguoiDan" value={form.maNguoiDan} onChange={change} disabled={Boolean(form.maLichTiem)} required>
                        <option value="">— Chọn người dân —</option>{citizens.map(person => <option key={person.MaNguoiDan} value={person.MaNguoiDan}>{person.HoTen} — {person.CCCD || `#${person.MaNguoiDan}`}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="vaccination-vaccine">Vaccine</label>
                    <select id="vaccination-vaccine" className="form-select" name="maVaccine" value={form.maVaccine} onChange={change} disabled={Boolean(form.maLichTiem)} required>
                        <option value="">— Chọn vaccine —</option>{vaccines.filter(item => item.TrangThai || Number(item.MaVaccine) === Number(form.maVaccine)).map(item => <option key={item.MaVaccine} value={item.MaVaccine}>{item.TenVaccine}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="vaccination-batch">Lô vaccine</label>
                    <select id="vaccination-batch" className="form-select" name="maLo" value={form.maLo} onChange={change} required>
                        <option value="">— Chọn lô khả dụng tại cơ sở —</option>{availableBatches.map(item => <option key={item.MaLo} value={item.MaLo}>{item.MaLoVaccine} — HSD {new Date(item.HanSuDung).toLocaleDateString("vi-VN")}{Number(item.MaLo) === Number(schedules.find(schedule => Number(schedule.MaLichTiem) === Number(form.maLichTiem))?.MaLoDuKien) ? " (đã giữ cho lịch này)" : ""}</option>)}</select>
                    {form.maCoSoTiem && form.maVaccine && !availableBatches.length && <div className="form-text text-warning">Chưa có lô đủ hạn và khả dụng tại cơ sở đã chọn.</div>}</div>
                <div className="col-md-3"><label className="form-label" htmlFor="vaccination-dose">Mũi số</label>
                    <input id="vaccination-dose" name="muiSo" className="form-control" type="number" min="1" max="20" value={form.muiSo} onChange={change} disabled={Boolean(form.maLichTiem)} required /></div>
                <div className="col-md-5"><label className="form-label" htmlFor="vaccination-date">Ngày giờ tiêm thực tế</label>
                    <input id="vaccination-date" name="ngayTiem" className="form-control" type="datetime-local" value={form.ngayTiem} onChange={change} max={localNow()} required /></div>
                <div className="col-md-4"><label className="form-label" htmlFor="vaccination-result">Kết quả</label>
                    <input id="vaccination-result" name="ketQua" className="form-control" value={form.ketQua} onChange={change} maxLength="255" required /></div>
                {selectedSite && <div className="col-12"><div className="facility-context d-flex gap-2"><MapPin size={18} className="flex-shrink-0" /><span>{[selectedSite.DiaChi, selectedSite.PhuongXa, "Thành phố Hồ Chí Minh"].filter(Boolean).join(", ")}</span></div></div>}
                <div className="col-md-6"><label className="form-label" htmlFor="vaccination-reaction">Phản ứng ghi nhận ban đầu</label>
                    <textarea id="vaccination-reaction" className="form-control" name="phanUngSauTiem" rows="3" maxLength="2000" value={form.phanUngSauTiem} onChange={change} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="vaccination-note">Ghi chú</label>
                    <textarea id="vaccination-note" className="form-control" name="ghiChu" rows="3" maxLength="1000" value={form.ghiChu} onChange={change} /></div>
            </div></fieldset><div className="d-flex flex-wrap gap-2 mt-4"><button className="btn btn-primary" type="submit" disabled={saving || !facilities.length || !form.maCoSoTiem || !form.maLo}><Syringe size={17} className="me-2" />{saving ? "Đang lưu..." : "Ghi nhận mũi tiêm"}</button>
                <button type="button" className="btn btn-outline-secondary" onClick={reset} disabled={saving}>Làm mới biểu mẫu</button></div></form>
        </div></section>
    </div>;
}
