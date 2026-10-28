import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, HeartPulse, RefreshCw, Send, Syringe } from "lucide-react";
import followupService from "../../services/followupService";
import { CheckInSchedule, EmergencyNotice, EmptyState, FollowupTimeline, LoadingState, ReportSummary, StatusBadge } from "../../components/common/FollowupShared";
import { errorMessage, formatDate, toLocalInput } from "../../components/common/followupUtils";

const emptyForm = () => ({ symptoms: [], onsetAt: "", durationHours: "", temperature: "", description: "", routine: false });
const PAGE_SIZE = 8;

export default function PostVaccinationPage() {
    const [searchParams] = useSearchParams();
    const [vaccinations, setVaccinations] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [selectedId, setSelectedId] = useState(searchParams.get("vaccinationId") || "");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [catalogError, setCatalogError] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [message, setMessage] = useState("");
    const [submittedSeverity, setSubmittedSeverity] = useState(null);
    const [reports, setReports] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [reportsError, setReportsError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const initialRequest = useRef(0);
    const reportsRequest = useRef(0);
    const detailRequest = useRef(0);
    const submitting = useRef(false);
    const formNotice = useRef(null);
    const selected = vaccinations.find((item) => String(item.MaMuiTiem) === String(selectedId));
    const selectedSymptoms = catalog.filter((item) => form.symptoms.includes(item.code));
    const redFlag = selectedSymptoms.some((item) => item.isRedFlag);
    const temperature = form.temperature === "" ? null : Number(form.temperature);
    const priorityTemperature = temperature != null && Number.isFinite(temperature) && temperature >= 30 && temperature <= 45 && (temperature >= 39 || temperature < 35);

    const loadInitial = useCallback(async () => {
        const request = ++initialRequest.current;
        setLoading(true);
        setLoadError("");
        const [vaccinationsResult, symptomsResult] = await Promise.allSettled([
            followupService.getMyVaccinations(), followupService.getSymptoms(),
        ]);
        if (request !== initialRequest.current) return;
        if (vaccinationsResult.status === "fulfilled") {
            const items = vaccinationsResult.value.data || [];
            setVaccinations(items);
            setSelectedId((current) => items.some((item) => String(item.MaMuiTiem) === String(current)) ? current : String(items[0]?.MaMuiTiem || ""));
        } else {
            setLoadError(errorMessage(vaccinationsResult.reason, "Chưa tải được các mũi tiêm của bạn."));
        }
        if (symptomsResult.status === "fulfilled") {
            setCatalog(symptomsResult.value.data || []);
            setCatalogError("");
        } else {
            setCatalogError(errorMessage(symptomsResult.reason, "Chưa tải được danh sách triệu chứng. Vui lòng tải lại trước khi gửi."));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadInitial();
        return () => { initialRequest.current += 1; reportsRequest.current += 1; detailRequest.current += 1; };
    }, [loadInitial]);

    useEffect(() => {
        setForm(emptyForm());
        setFormError("");
        setMessage("");
        setSubmittedSeverity(null);
        setDetail(null);
        setDetailError("");
        detailRequest.current += 1;
        setDetailLoading(false);
    }, [selectedId]);

    useEffect(() => {
        const request = ++reportsRequest.current;
        setReports([]);
        setTotal(0);
        if (!selectedId) return;
        setReportsLoading(true);
        setReportsError("");
        followupService.getMyReports({ vaccinationId: selectedId, page, limit: PAGE_SIZE }).then((response) => {
            if (request !== reportsRequest.current) return;
            setReports(response.data?.items || []);
            setTotal(response.data?.total || 0);
        }).catch((error) => {
            if (request === reportsRequest.current) setReportsError(errorMessage(error, "Chưa tải được các lần cập nhật."));
        }).finally(() => { if (request === reportsRequest.current) setReportsLoading(false); });
    }, [selectedId, page, refreshKey]);

    async function openReport(id) {
        const request = ++detailRequest.current;
        setDetailLoading(true);
        setDetailError("");
        setDetail(null);
        try {
            const response = await followupService.getReport(id);
            if (request === detailRequest.current) setDetail(response.data);
        } catch (error) {
            if (request === detailRequest.current) setDetailError(errorMessage(error, "Chưa tải được chi tiết cập nhật."));
        } finally {
            if (request === detailRequest.current) setDetailLoading(false);
        }
    }

    function changeField(event) {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value, ...(name === "temperature" && value !== "" && (Number(value) >= 38 || Number(value) < 35) ? { routine: false } : {}) }));
    }

    function toggleSymptom(code) {
        setForm((current) => ({ ...current, routine: false, symptoms: current.symptoms.includes(code) ? current.symptoms.filter((item) => item !== code) : [...current.symptoms, code] }));
    }

    async function handleSubmitCheckIn(event) {
        event.preventDefault();
        if (submitting.current) return;
        setFormError("");
        setMessage("");
        let validation = "";
        if (!selectedId) validation = "Vui lòng chọn mũi tiêm cần cập nhật.";
        else if (catalogError) validation = "Cần tải lại danh sách triệu chứng trước khi gửi cập nhật.";
        else if (!form.routine && !form.symptoms.length && form.temperature === "" && !form.description.trim()) validation = "Chọn cập nhật định kỳ hoặc nhập điều bạn muốn ghi nhận.";
        else if (form.onsetAt && (!Number.isFinite(new Date(form.onsetAt).getTime()) || new Date(form.onsetAt) > new Date())) validation = "Thời điểm bắt đầu phải hợp lệ và không ở tương lai.";
        else if (form.onsetAt && selected?.NgayTiem && new Date(form.onsetAt) < new Date(selected.NgayTiem)) validation = "Thời điểm ghi nhận sau tiêm không được trước thời điểm tiêm.";
        else if (form.temperature !== "" && (!Number.isFinite(temperature) || temperature < 30 || temperature > 45)) validation = "Nhiệt độ phải là số từ 30 đến 45 °C. Nếu cần trợ giúp khẩn cấp, không chờ gửi biểu mẫu.";
        else if (form.durationHours !== "" && (!Number.isFinite(Number(form.durationHours)) || Number(form.durationHours) < 0 || Number(form.durationHours) > 8760)) validation = "Thời gian kéo dài phải từ 0 đến 8.760 giờ.";
        if (validation) {
            setFormError(validation);
            requestAnimationFrame(() => formNotice.current?.focus());
            return;
        }
        submitting.current = true;
        setSaving(true);
        try {
            const response = await followupService.createReport({
                vaccinationId: Number(selectedId), symptoms: form.symptoms,
                ...(form.onsetAt ? { onsetAt: new Date(form.onsetAt).toISOString() } : {}),
                ...(form.durationHours !== "" ? { durationHours: Number(form.durationHours) } : {}),
                ...(form.temperature !== "" ? { temperature } : {}),
                description: form.description.trim(),
            });
            setForm(emptyForm());
            setSubmittedSeverity(response.data?.severity || null);
            setPage(1);
            setRefreshKey((value) => value + 1);
            setMessage("Đã ghi nhận cập nhật của bạn. Bạn có thể gửi thêm khi có thay đổi; các lần cập nhật trước vẫn được giữ lại.");
            if (response.data?.id) openReport(response.data.id);
            followupService.getMyVaccinations().then((result) => setVaccinations(result.data || [])).catch(() => {});
        } catch (error) {
            setFormError(errorMessage(error, "Chưa gửi được cập nhật. Thông tin bạn nhập vẫn được giữ để thử lại."));
            requestAnimationFrame(() => formNotice.current?.focus());
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    }

    return <div className="followup-page medical-page">
        <header className="followup-heading page-heading mb-4"><div><p className="page-eyebrow mb-2">CHĂM SÓC SAU TIÊM</p><h1 className="h3 fw-bold">Sức khỏe sau tiêm</h1><p className="text-muted mb-0">Ghi nhận tình trạng của bạn và theo dõi phản hồi từ nhân viên y tế.</p></div><Link to="/citizen/history" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"><Syringe size={17} aria-hidden="true" />Lịch sử tiêm</Link></header>
        <EmergencyNotice level={redFlag || submittedSeverity === "emergency" ? "emergency" : priorityTemperature || submittedSeverity === "severe" ? "priority" : "general"} facility={selected?.CoSoTiem} />
        {loadError && <div className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-2" role="alert"><span>{loadError}</span><button className="btn btn-sm btn-outline-danger" onClick={loadInitial}>Thử tải lại</button></div>}
        {loading ? <LoadingState>Đang tải các mũi tiêm của bạn…</LoadingState> : !vaccinations.length ? !loadError && <div className="card"><EmptyState title="Chưa có mũi tiêm để theo dõi">Mũi tiêm đã được cơ sở ghi nhận sẽ xuất hiện ở đây. Nếu bạn đã tiêm nhưng chưa thấy, hãy liên hệ cơ sở tiêm để kiểm tra hồ sơ.</EmptyState></div> : <>
            <section className="card followup-card mb-4"><div className="card-body"><div className="row g-3 align-items-center"><div className="col-lg-5"><label htmlFor="post-vaccination-id" className="form-label fw-semibold d-flex align-items-center gap-2"><Syringe size={18} aria-hidden="true" />Mũi tiêm cần theo dõi</label><select id="post-vaccination-id" className="form-select" value={selectedId} disabled={saving} onChange={(event) => { setPage(1); setSelectedId(event.target.value); }}>{vaccinations.map((item) => <option key={item.MaMuiTiem} value={item.MaMuiTiem}>{item.TenVaccine} · Mũi {item.MuiSo} · {formatDate(item.NgayTiem)}</option>)}</select></div><div className="col-lg-7"><div className="followup-selected d-flex flex-wrap gap-4"><div><span className="text-muted small d-block">Đã tiêm lúc</span><strong className="small">{formatDate(selected?.NgayTiem)}</strong></div><div><span className="text-muted small d-block">Cơ sở tiêm</span><strong className="small">{selected?.CoSoTiem || "Chưa có thông tin"}</strong></div><div><span className="text-muted small d-block">Mã mũi tiêm</span><strong className="small">#{selectedId}</strong></div></div></div></div></div></section>
            <CheckInSchedule items={selected?.checkInSchedule || []} />
            <div className="row g-4 align-items-start"><div className="col-xl-7">
                <section className="card followup-card" aria-labelledby="checkin-form-heading"><div className="card-body p-lg-4"><div className="d-flex align-items-center gap-2 mb-2"><HeartPulse size={22} className="text-success" aria-hidden="true" /><h2 className="h5 mb-0" id="checkin-form-heading">Gửi cập nhật sức khỏe</h2></div><p className="small text-muted mb-4">Mỗi lần gửi được lưu riêng. Mức ưu tiên tiếp nhận được hệ thống xác định từ thông tin khai báo, không phải chẩn đoán.</p>
                    {message && <div className="alert alert-success small d-flex gap-2" role="status"><CheckCircle2 size={20} className="flex-shrink-0" aria-hidden="true" /><span>{message}</span></div>}
                    {catalogError && <div className="alert alert-warning small" role="alert">{catalogError}<button className="btn btn-sm btn-outline-secondary ms-2" onClick={loadInitial}>Tải lại danh sách</button></div>}
                    {formError && <div ref={formNotice} tabIndex={-1} className="alert alert-danger small" role="alert">{formError}</div>}
                    <form onSubmit={handleSubmitCheckIn}>
                        <fieldset disabled={saving || !!catalogError}><legend className="h6 mb-3">Bạn muốn ghi nhận điều gì?</legend>
                            <label className="followup-symptom border rounded-3 p-3 d-flex align-items-start gap-2 mb-3"><input className="form-check-input flex-shrink-0" type="checkbox" checked={form.routine} onChange={(event) => setForm((current) => ({ ...current, routine: event.target.checked, ...(event.target.checked ? { symptoms: [], onsetAt: "", durationHours: "", description: "" } : {}) }))} /><span><strong className="small d-block">Cập nhật định kỳ, không khai báo dấu hiệu bất thường</strong><span className="small text-muted">Ghi nhận tại thời điểm này; không thay thế đánh giá của nhân viên y tế.</span></span></label>
                            <div className="row g-2 mb-4">{catalog.map((item) => <div className="col-sm-6" key={item.code}><label className={`followup-symptom d-flex gap-2 border rounded-3 p-3 h-100 ${form.symptoms.includes(item.code) ? item.isRedFlag ? "border-danger" : "border-success" : ""}`}><input type="checkbox" className="form-check-input flex-shrink-0" checked={form.symptoms.includes(item.code)} onChange={() => toggleSymptom(item.code)} /><span className="small">{item.name}{item.isRedFlag && <span className="d-block text-danger small fw-semibold">Dấu hiệu cảnh báo đỏ</span>}</span></label></div>)}</div>
                            {redFlag && <p className="small text-danger fw-semibold" role="alert">Hãy gọi 115 hoặc đến cấp cứu ngay. Việc gửi thông tin không được làm chậm tiếp cận cấp cứu.</p>}
                            <div className="row g-3 mb-3"><div className="col-sm-6"><label className="form-label small fw-semibold" htmlFor="checkin-onset">Thời điểm bắt đầu ghi nhận</label><input id="checkin-onset" className="form-control" name="onsetAt" type="datetime-local" value={form.onsetAt} onChange={changeField} min={toLocalInput(selected?.NgayTiem)} disabled={form.routine} /><span className="form-text">Nếu có triệu chứng, ghi thời điểm bắt đầu.</span></div><div className="col-sm-6"><label className="form-label small fw-semibold" htmlFor="checkin-duration">Đã kéo dài bao lâu? (giờ)</label><input id="checkin-duration" className="form-control" name="durationHours" type="number" min="0" max="8760" step="0.01" inputMode="decimal" value={form.durationHours} onChange={changeField} disabled={form.routine} placeholder="Không bắt buộc" /></div><div className="col-sm-6"><label className="form-label small fw-semibold" htmlFor="checkin-temperature">Nhiệt độ đo được (°C)</label><input id="checkin-temperature" className="form-control" name="temperature" type="number" min="30" max="45" step="0.1" inputMode="decimal" value={form.temperature} onChange={changeField} placeholder="Ví dụ: 37.2" aria-describedby="temperature-help" /><span className="form-text" id="temperature-help">Để trống nếu bạn chưa đo nhiệt độ.</span></div></div>
                            <div className="mb-4"><label className="form-label small fw-semibold" htmlFor="checkin-description">Mô tả thêm</label><textarea id="checkin-description" className="form-control" name="description" rows={3} maxLength={2000} value={form.description} onChange={changeField} disabled={form.routine} placeholder="Diễn biến hoặc điều bạn muốn nhân viên y tế lưu ý…" /><span className="form-text">Tối đa 2.000 ký tự. Không dùng biểu mẫu để yêu cầu cấp cứu.</span></div>
                            <button className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2" type="submit" disabled={!selectedId}><Send size={17} aria-hidden="true" />{saving ? "Đang gửi cập nhật…" : "Gửi cập nhật"}</button>
                        </fieldset>
                    </form>
                </div></section>
            </div><div className="col-xl-5">
                <section className="card followup-card mb-4" aria-labelledby="checkin-history-heading"><div className="card-body p-lg-4"><div className="d-flex justify-content-between align-items-center gap-2 mb-3"><div className="d-flex gap-2 align-items-center"><ClipboardCheck size={20} aria-hidden="true" /><h2 className="h5 mb-0" id="checkin-history-heading">Các lần cập nhật</h2></div><button className="btn btn-sm btn-outline-secondary" disabled={reportsLoading} aria-label="Tải lại các lần cập nhật" onClick={() => setRefreshKey((value) => value + 1)}><RefreshCw size={16} aria-hidden="true" /></button></div>
                    {reportsError && <div className="alert alert-danger small" role="alert">{reportsError}</div>}
                    {reportsLoading ? <LoadingState>Đang tải các lần cập nhật…</LoadingState> : !reports.length ? !reportsError && <EmptyState title="Chưa có cập nhật cho mũi tiêm này">Bạn có thể gửi bản cập nhật đầu tiên bằng biểu mẫu bên cạnh.</EmptyState> : <><div className="d-grid gap-2">{reports.map((report) => <button type="button" key={report.id} className={`followup-history-item btn text-start border rounded-3 p-3 ${detail?.id === report.id ? "followup-selected border-success" : ""}`} onClick={() => openReport(report.id)} aria-label={`Xem cập nhật lúc ${formatDate(report.reportedAt)}`}><div className="d-flex justify-content-between align-items-start gap-2 mb-2"><strong className="small">{formatDate(report.reportedAt)}</strong><ArrowRight size={17} className="text-muted flex-shrink-0" aria-hidden="true" /></div><div className="d-flex flex-wrap gap-2"><StatusBadge status={report.severity} severity /><StatusBadge status={report.status} /></div></button>)}</div><div className="d-flex align-items-center justify-content-between gap-2 mt-3"><span className="small text-muted">{total} lần cập nhật · Trang {page}/{Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><div className="btn-group"><button className="btn btn-sm btn-outline-secondary" aria-label="Trang cập nhật trước" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={15} aria-hidden="true" /></button><button className="btn btn-sm btn-outline-secondary" aria-label="Trang cập nhật sau" disabled={page * PAGE_SIZE >= total} onClick={() => setPage((value) => value + 1)}><ArrowRight size={15} aria-hidden="true" /></button></div></div></>}
                </div></section>
                {(detailLoading || detail || detailError) && <section className="card followup-card" aria-label="Chi tiết cập nhật"><div className="card-body p-lg-4">{detailLoading ? <LoadingState>Đang tải chi tiết…</LoadingState> : detailError ? <div className="alert alert-danger small mb-0" role="alert">{detailError}</div> : detail && <><div className="d-flex justify-content-between gap-2 align-items-center mb-3"><h2 className="h5 mb-0">Chi tiết cập nhật</h2><button className="btn btn-sm btn-outline-secondary" onClick={() => { setDetail(null); detailRequest.current += 1; }}>Đóng</button></div>{(detail.hasRedFlag || detail.severity === "emergency" || detail.severity === "severe") && <EmergencyNotice level={detail.hasRedFlag || detail.severity === "emergency" ? "emergency" : "priority"} facility={selected?.CoSoTiem} />}<ReportSummary report={detail} /><hr /><h3 className="h6 d-flex gap-2 align-items-center mb-3"><CalendarClock size={17} aria-hidden="true" />Nhật ký xử lý</h3><FollowupTimeline items={detail.history || []} /></>}</div></section>}
            </div></div>
        </>}
    </div>;
}
