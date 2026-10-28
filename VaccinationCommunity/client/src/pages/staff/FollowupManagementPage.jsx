import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, ClipboardList, Filter, RefreshCw, Save, Search, ShieldCheck, UserRoundCheck } from "lucide-react";
import followupService from "../../services/followupService";
import { EmergencyNotice, EmptyState, FollowupTimeline, LoadingState, ReportSummary, StatusBadge } from "../../components/common/FollowupShared";
import { errorMessage, formatDate, NEXT_STATUSES, SEVERITY_LABELS, STATUS_LABELS, toLocalInput } from "../../components/common/followupUtils";

const PAGE_SIZE = 12;
const emptyReview = { status: "", staffAdvice: "", nextFollowupAt: "" };

export default function FollowupManagementPage() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ status: "", severity: "", search: "" });
    const [search, setSearch] = useState("");
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [review, setReview] = useState(emptyReview);
    const [reviewError, setReviewError] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    const queueRequest = useRef(0);
    const detailRequest = useRef(0);
    const submitting = useRef(false);
    const detailHeading = useRef(null);
    const reviewNotice = useRef(null);
    const adviceInput = useRef(null);

    useEffect(() => {
        const request = ++queueRequest.current;
        setListLoading(true);
        setListError("");
        followupService.getReports({ page, limit: PAGE_SIZE, ...(filters.status ? { status: filters.status } : {}), ...(filters.severity ? { severity: filters.severity } : {}), ...(filters.search ? { search: filters.search } : {}) }).then((response) => {
            if (request !== queueRequest.current) return;
            const count = response.data?.total || 0;
            setTotal(count);
            const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE));
            if (page > lastPage) { setPage(lastPage); return; }
            setItems(response.data?.items || []);
        }).catch((error) => {
            if (request === queueRequest.current) {
                setListError(errorMessage(error, "Chưa tải được hàng đợi theo dõi."));
                setItems([]);
                setTotal(0);
            }
        }).finally(() => { if (request === queueRequest.current) setListLoading(false); });
        return () => { queueRequest.current += 1; };
    }, [page, filters, refreshKey]);

    useEffect(() => () => { detailRequest.current += 1; }, []);

    async function openDetail(id, { preserveDraft = false } = {}) {
        const request = ++detailRequest.current;
        setDetailLoading(true);
        setDetailError("");
        if (!preserveDraft) {
            setDetail(null);
            setReview(emptyReview);
            setReviewError("");
            setMessage("");
        }
        try {
            const response = await followupService.getReport(id);
            if (request !== detailRequest.current) return;
            const record = response.data;
            setDetail(record);
            setReview((current) => {
                if (!preserveDraft) return { status: record.status === "new" ? "reviewing" : record.status, staffAdvice: record.staffAdvice || "", nextFollowupAt: toLocalInput(record.nextFollowupAt) };
                const status = [record.status, ...(NEXT_STATUSES[record.status] || [])].includes(current.status) ? current.status : record.status;
                return { ...current, status, nextFollowupAt: status === "resolved" ? "" : current.nextFollowupAt };
            });
            if (!preserveDraft) requestAnimationFrame(() => detailHeading.current?.focus());
        } catch (error) {
            if (request === detailRequest.current) setDetailError(errorMessage(error, "Chưa tải được chi tiết phiếu theo dõi."));
        } finally {
            if (request === detailRequest.current) setDetailLoading(false);
        }
    }

    function changeFilter(name, value) {
        setPage(1);
        setFilters((current) => ({ ...current, [name]: value }));
    }

    function submitSearch(event) {
        event.preventDefault();
        changeFilter("search", search.trim());
    }

    function changeReview(event) {
        const { name, value } = event.target;
        setReview((current) => ({ ...current, [name]: value, ...(name === "status" && value === "resolved" ? { nextFollowupAt: "" } : {}) }));
    }

    function prepareReview() {
        setReview((current) => ({ ...current, status: detail.status === "reviewing" || NEXT_STATUSES[detail.status]?.includes("reviewing") ? "reviewing" : current.status }));
        requestAnimationFrame(() => adviceInput.current?.focus());
    }

    async function handleSaveReview(event) {
        event.preventDefault();
        if (!detail || submitting.current) return;
        setReviewError("");
        setMessage("");
        let validation = "";
        const nextDate = review.nextFollowupAt ? new Date(review.nextFollowupAt) : null;
        if (!review.staffAdvice.trim()) validation = "Vui lòng nhập phản hồi cho người dân trước khi lưu.";
        else if (review.staffAdvice.trim().length > 2000) validation = "Phản hồi không được vượt quá 2.000 ký tự.";
        else if (![detail.status, ...(NEXT_STATUSES[detail.status] || [])].includes(review.status)) validation = "Trạng thái không còn phù hợp. Vui lòng tải lại phiếu.";
        else if (review.status === "monitoring" && !nextDate) validation = "Trạng thái đang theo dõi cần một thời điểm hẹn cập nhật tiếp.";
        else if (nextDate && (!Number.isFinite(nextDate.getTime()) || nextDate <= new Date())) validation = "Thời điểm hẹn cập nhật tiếp phải hợp lệ và ở tương lai.";
        if (validation) {
            setReviewError(validation);
            requestAnimationFrame(() => reviewNotice.current?.focus());
            return;
        }
        submitting.current = true;
        setSaving(true);
        const id = detail.id;
        try {
            const response = await followupService.reviewReport(id, {
                status: review.status,
                staffAdvice: review.staffAdvice.trim(),
                nextFollowupAt: review.status === "resolved" || !nextDate ? null : nextDate.toISOString(),
                expectedRevision: detail.revision,
            });
            setDetail(response.data);
            setReview({ status: response.data.status, staffAdvice: response.data.staffAdvice || "", nextFollowupAt: toLocalInput(response.data.nextFollowupAt) });
            setMessage("Đã lưu phản hồi, người phụ trách và nhật ký xử lý.");
            setRefreshKey((value) => value + 1);
        } catch (error) {
            if (error.response?.status === 409) {
                setReviewError("Phiếu đã thay đổi hoặc trạng thái không còn phù hợp. Đang tải thông tin mới; nội dung phản hồi của bạn được giữ lại. Vui lòng xem lại trước khi lưu.");
                await openDetail(id, { preserveDraft: true });
            } else {
                setReviewError(errorMessage(error, "Chưa lưu được phản hồi. Nội dung đang nhập vẫn được giữ lại."));
            }
            requestAnimationFrame(() => reviewNotice.current?.focus());
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    }

    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const statuses = detail ? [detail.status, ...(NEXT_STATUSES[detail.status] || [])] : [];

    return <div className="followup-page medical-page">
        <header className="followup-heading page-heading mb-4"><div><p className="page-eyebrow mb-2">CHĂM SÓC LIÊN TỤC</p><h1 className="h3 fw-bold">Theo dõi sau tiêm</h1><p className="text-muted mb-0">Tiếp nhận cập nhật, phản hồi và lưu vết quá trình theo dõi người dân.</p></div><button className="btn btn-outline-secondary d-inline-flex align-items-center gap-2" onClick={() => setRefreshKey((value) => value + 1)} disabled={listLoading}><RefreshCw size={17} aria-hidden="true" />Tải lại hàng đợi</button></header>
        <div className="alert alert-light border small d-flex gap-2 align-items-start"><ShieldCheck size={20} className="flex-shrink-0 text-success" aria-hidden="true" /><p className="mb-0">Mức ưu tiên tiếp nhận dựa trên dữ liệu người dân khai báo, không phải chẩn đoán. Với dấu hiệu cảnh báo đỏ, ưu tiên liên hệ và hướng dẫn cấp cứu ngay; không chờ xử lý trên cổng.</p></div>
        <section className="card followup-card mb-4" aria-label="Bộ lọc hàng đợi"><div className="card-body"><form className="row g-3 align-items-end" onSubmit={submitSearch}><div className="col-md-5"><label className="form-label small fw-semibold" htmlFor="followup-search">Tìm người dân hoặc mũi tiêm</label><div className="input-group"><input id="followup-search" type="search" className="form-control" placeholder="Tên người dân, mã phiếu, mã mũi tiêm…" maxLength={120} value={search} onChange={(event) => setSearch(event.target.value)} /><button className="btn btn-outline-secondary d-inline-flex align-items-center gap-1" type="submit"><Search size={17} aria-hidden="true" /><span>Tìm</span></button></div></div><div className="col-md-3"><label className="form-label small fw-semibold" htmlFor="followup-urgency">Mức ưu tiên tiếp nhận</label><select id="followup-urgency" className="form-select" value={filters.severity} onChange={(event) => changeFilter("severity", event.target.value)}><option value="">Tất cả mức ưu tiên</option>{Object.entries(SEVERITY_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div><div className="col-md-3"><label className="form-label small fw-semibold" htmlFor="followup-status-filter">Trạng thái xử lý</label><select id="followup-status-filter" className="form-select" value={filters.status} onChange={(event) => changeFilter("status", event.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></div><div className="col-md-1"><button type="button" className="btn btn-outline-secondary w-100" aria-label="Xóa các bộ lọc" title="Xóa các bộ lọc" onClick={() => { setSearch(""); setPage(1); setFilters({ status: "", severity: "", search: "" }); }}><Filter size={17} aria-hidden="true" /></button></div></form></div></section>
        <div className="row g-4 align-items-start"><div className={detail || detailLoading || detailError ? "col-xxl-7" : "col-12"}>
            <section className="card followup-card" aria-labelledby="followup-queue-heading"><div className="card-body pb-0"><div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3"><h2 className="h5 d-flex align-items-center gap-2 mb-0" id="followup-queue-heading"><ClipboardList size={21} aria-hidden="true" />Hàng đợi theo dõi</h2><span className="small text-muted" aria-live="polite">{listLoading ? "Đang tải…" : `${total} phiếu phù hợp`}</span></div></div>
                {listError && <div className="alert alert-danger small mx-3" role="alert">{listError}<button className="btn btn-sm btn-outline-danger ms-2" onClick={() => setRefreshKey((value) => value + 1)}>Thử tải lại</button></div>}
                {listLoading ? <LoadingState>Đang tải hàng đợi theo dõi…</LoadingState> : !items.length ? !listError && <EmptyState title="Không có phiếu phù hợp">Thử thay đổi bộ lọc hoặc tải lại. Các cập nhật của người dân sẽ xuất hiện khi được gửi lên hệ thống.</EmptyState> : <><div className="table-responsive"><table className="table table-hover align-middle mb-0"><caption className="visually-hidden">Các phiếu theo dõi sau tiêm trong phạm vi bộ lọc hiện tại</caption><thead><tr><th scope="col">Người dân · mũi tiêm</th><th scope="col">Mức ưu tiên</th><th scope="col">Trạng thái</th><th scope="col"><span className="visually-hidden">Thao tác</span></th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className={`followup-queue-row ${detail?.id === item.id ? "followup-selected" : ""}`}><td><strong className="d-block small">{item.citizenName || "Hồ sơ người dân"}</strong><span className="small d-block text-muted">{item.vaccineName} · Mũi {item.doseNumber || "—"}</span><span className="small d-block text-muted">Mũi #{item.vaccinationId} · Phiếu #{item.id}</span><time className="small d-block text-muted" dateTime={item.reportedAt}>{formatDate(item.reportedAt)}</time></td><td><StatusBadge status={item.severity} severity /></td><td><StatusBadge status={item.status} />{item.staffName && <span className="small d-block text-muted mt-1">{item.staffName}</span>}</td><td><button className="btn btn-sm btn-outline-primary" disabled={saving} aria-label={`Xem phiếu ${item.id} của ${item.citizenName || "người dân"}`} onClick={() => openDetail(item.id)}>Chi tiết</button></td></tr>)}</tbody></table></div><div className="card-body d-flex flex-wrap justify-content-between gap-2 align-items-center"><span className="small text-muted">Trang {page}/{pages} · {items.length} phiếu đang hiển thị</span><div className="btn-group"><button className="btn btn-sm btn-outline-secondary d-inline-flex gap-1 align-items-center" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={15} aria-hidden="true" />Trước</button><button className="btn btn-sm btn-outline-secondary d-inline-flex gap-1 align-items-center" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Sau<ArrowRight size={15} aria-hidden="true" /></button></div></div></>}
            </section>
        </div>{(detail || detailLoading || detailError) && <div className="col-xxl-5"><section className="card followup-card" aria-labelledby="followup-detail-heading"><div className="card-body p-lg-4">
            <div className="d-flex justify-content-between align-items-start gap-2 mb-3"><h2 id="followup-detail-heading" className="h5 mb-0" tabIndex={-1} ref={detailHeading}>Chi tiết phiếu {detail ? `#${detail.id}` : "theo dõi"}</h2><button type="button" className="btn btn-sm btn-outline-secondary" disabled={saving} onClick={() => { setDetail(null); setDetailError(""); setDetailLoading(false); detailRequest.current += 1; }}>Đóng</button></div>
            {detailLoading ? <LoadingState>Đang tải chi tiết phiếu…</LoadingState> : detailError ? <div className="alert alert-danger small" role="alert">{detailError}</div> : detail && <>
                <div className="mb-3"><h3 className="h6 mb-1">{detail.citizenName || "Hồ sơ người dân"}</h3><p className="small text-muted mb-1">{detail.vaccineName} · Mũi {detail.doseNumber || "—"} · Mã mũi #{detail.vaccinationId}</p><p className="small text-muted mb-0">Tiêm lúc {formatDate(detail.vaccinationDate)}{detail.batchNumber ? ` · Lô ${detail.batchNumber}` : ""}</p></div>
                {(detail.hasRedFlag || detail.severity === "emergency" || detail.severity === "severe") && <EmergencyNotice level={detail.hasRedFlag || detail.severity === "emergency" ? "emergency" : "priority"} facility={detail.facilityName} staff />}
                {detail.citizenPhone && <p className="small mb-3"><strong>Liên hệ người dân: </strong><a className="text-primary" href={`tel:${String(detail.citizenPhone).replace(/[^+\d]/g, "")}`}>{detail.citizenPhone}</a></p>}{detail.isFollowupOverdue && <p className="small fw-semibold text-danger">Đã qua thời điểm hẹn cập nhật tiếp. Cần kiểm tra và liên hệ người dân.</p>}<ReportSummary report={detail} />
                <hr className="my-4" /><div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3"><h3 className="h6 mb-0">Tiếp nhận và phản hồi</h3><button type="button" className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1" disabled={saving} onClick={prepareReview}><UserRoundCheck size={15} aria-hidden="true" />Chuẩn bị tiếp nhận</button></div>
                <p className="small text-muted">Khi lưu, bạn được ghi nhận là nhân viên xử lý cập nhật này. Phản hồi và thay đổi trạng thái được lưu vào nhật ký.</p>
                {message && <div className="alert alert-success small" role="status">{message}</div>}
                {reviewError && <div className="alert alert-danger small" role="alert" ref={reviewNotice} tabIndex={-1}>{reviewError}</div>}
                <form onSubmit={handleSaveReview}><fieldset disabled={saving}><div className="mb-3"><label className="form-label small fw-semibold" htmlFor="review-status">Trạng thái sau xử lý</label><select id="review-status" name="status" className="form-select" value={review.status} onChange={changeReview} required>{statuses.map((status) => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}</select><span className="form-text">Chỉ hiển thị các chuyển trạng thái được phép từ tình trạng hiện tại.</span></div><div className="mb-3"><label className="form-label small fw-semibold" htmlFor="review-advice">Phản hồi cho người dân <span className="text-danger" aria-hidden="true">*</span></label><textarea id="review-advice" ref={adviceInput} name="staffAdvice" className="form-control" rows={4} maxLength={2000} required value={review.staffAdvice} onChange={changeReview} placeholder="Ghi hướng dẫn, việc đã liên hệ hoặc kế hoạch theo dõi theo quy trình của cơ sở…" /><span className="form-text">Nội dung này được người dân nhìn thấy. Tối đa 2.000 ký tự.</span></div><div className="mb-4"><label className="form-label small fw-semibold" htmlFor="review-next-date">Hẹn cập nhật tiếp {review.status === "monitoring" && <span className="text-danger" aria-hidden="true">*</span>}</label><input id="review-next-date" className="form-control" type="datetime-local" name="nextFollowupAt" value={review.nextFollowupAt} onChange={changeReview} required={review.status === "monitoring"} disabled={review.status === "resolved"} /><span className="form-text">{review.status === "resolved" ? "Kết thúc theo dõi sẽ bỏ lịch hẹn tiếp, không phải xác nhận người dân đã an toàn." : "Đang theo dõi cần có lịch hẹn ở tương lai. Thời điểm khác có thể để trống."}</span></div><button type="submit" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2"><Save size={17} aria-hidden="true" />{saving ? "Đang lưu phản hồi…" : detail.staffAccountId ? "Lưu phản hồi" : "Nhận ca và lưu phản hồi"}</button></fieldset></form>
                <hr className="my-4" /><div className="d-flex justify-content-between align-items-center gap-2 mb-3"><h3 className="h6 mb-0 d-flex gap-2 align-items-center"><CalendarClock size={18} aria-hidden="true" />Nhật ký xử lý</h3><button type="button" className="btn btn-sm btn-outline-secondary" disabled={saving} aria-label="Tải lại chi tiết và nhật ký phiếu" onClick={() => openDetail(detail.id, { preserveDraft: true })}><RefreshCw size={15} aria-hidden="true" /></button></div><FollowupTimeline items={detail.history || []} />
            </>}
        </div></section></div>}</div>
    </div>;
}
