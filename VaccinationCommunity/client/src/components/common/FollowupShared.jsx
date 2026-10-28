import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, ClipboardList, Phone, ShieldAlert } from "lucide-react";

import { STATUS_LABELS, SEVERITY_LABELS, formatDate } from "./followupUtils";

export function StatusBadge({ status, severity = false }) {
    const labels = severity ? SEVERITY_LABELS : STATUS_LABELS;
    const tone = ["emergency", "escalated"].includes(status) ? "danger"
        : ["severe", "moderate", "new"].includes(status) ? "warning"
        : ["resolved", "none"].includes(status) ? "success" : "secondary";
    return <span className={`badge rounded-pill text-bg-${tone} followup-badge`}>{labels[status] || "Chưa xác định"}</span>;
}

export function LoadingState({ children = "Đang tải thông tin theo dõi…" }) {
    return <div className="text-center py-5 text-muted" role="status"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />{children}</div>;
}

export function EmptyState({ title, children }) {
    return <div className="empty-state text-center py-5 px-3"><ClipboardList size={36} className="text-muted mb-3" aria-hidden="true" /><h3 className="h6">{title}</h3><p className="text-muted small mb-0">{children}</p></div>;
}

export function EmergencyNotice({ level = "general", facility, staff = false }) {
    const emergency = level === "emergency";
    const priority = level === "priority";
    const Icon = emergency ? ShieldAlert : AlertTriangle;
    return <aside className={`followup-emergency alert ${emergency ? "alert-danger" : priority ? "alert-warning" : "alert-light border"} d-flex gap-3 align-items-start`} role={emergency ? "alert" : "note"}>
        <Icon size={23} className="flex-shrink-0 mt-1" aria-hidden="true" />
        <div className="flex-grow-1">
            <h2 className="h6 mb-1">{emergency ? "Có dấu hiệu cảnh báo đỏ — cần trợ giúp ngay" : priority ? "Cần liên hệ cơ sở y tế ngay để được đánh giá" : "Cần trợ giúp khẩn cấp?"}</h2>
            <p className="small mb-2">{emergency
                ? staff ? "Liên hệ người dân và hướng dẫn gọi 115 hoặc đến cơ sở cấp cứu ngay theo quy trình. Không để người dân chờ phản hồi trên cổng." : "Gọi 115 hoặc đến cơ sở cấp cứu gần nhất ngay. Không chờ gửi biểu mẫu hay phản hồi trên cổng."
                : priority ? "Nhiệt độ được khai báo cần được cơ sở y tế đánh giá sớm. Hãy liên hệ cơ sở tiêm hoặc đến cơ sở y tế; không chờ phản hồi trên cổng. Nếu có dấu hiệu cảnh báo đỏ, gọi 115 ngay."
                    : "Nếu có dấu hiệu nặng hoặc diễn tiến nhanh, gọi 115 hoặc đến cơ sở cấp cứu gần nhất. Cổng theo dõi không thay thế dịch vụ cấp cứu."}</p>
            <div className="d-flex flex-wrap align-items-center gap-2">
                <a className={`btn btn-sm ${emergency ? "btn-danger" : "btn-outline-danger"} d-inline-flex align-items-center gap-2`} href="tel:115"><Phone size={15} aria-hidden="true" />Gọi 115</a>
                <span className="small">{facility ? `Cơ sở tiêm: ${facility}. ` : "Liên hệ cơ sở đã tiêm. "}Sử dụng số điện thoại trên phiếu tiêm hoặc giấy hẹn.</span>
            </div>
        </div>
    </aside>;
}

export function CheckInSchedule({ items = [] }) {
    return <section className="card followup-card mb-4" aria-labelledby="followup-schedule-heading"><div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-2"><Clock3 size={18} aria-hidden="true" /><h2 className="h6 mb-0" id="followup-schedule-heading">Các mốc cập nhật được hẹn</h2></div>
        <p className="small text-muted">Các mốc này giúp nhắc cập nhật sức khỏe, không phải thời hạn kết luận an toàn sau tiêm.</p>
        {items.length ? <div className="row g-2">{items.map((item) => <div className="col-sm-4" key={item.hours}><div className={`followup-schedule-item border rounded-3 p-3 h-100 ${item.status === "completed" ? "border-success" : ""}`}>
            <div className="d-flex justify-content-between gap-2 mb-2"><strong className="small">{item.hours} giờ sau tiêm</strong>{item.status === "completed" ? <CheckCircle2 size={17} className="text-success" aria-label="Đã cập nhật" /> : <Clock3 size={17} className="text-muted" aria-hidden="true" />}</div>
            <p className="small mb-1">{formatDate(item.dueAt)}</p><span className="small text-muted">{item.status === "completed" ? "Đã có cập nhật" : item.status === "due" ? "Đến mốc cập nhật" : "Mốc sắp tới"}</span>
        </div></div>)}</div> : <p className="small text-muted mb-0">Chưa có mốc được cấu hình cho mũi tiêm này. Bạn vẫn có thể gửi cập nhật khi cần.</p>}
    </div></section>;
}

const ACTION_LABELS = { created: "Người dân gửi cập nhật", reported: "Người dân gửi cập nhật", review: "Nhân viên y tế cập nhật", reviewed: "Nhân viên y tế cập nhật", assigned: "Tiếp nhận phụ trách", status_changed: "Thay đổi trạng thái", reassigned: "Cập nhật người phụ trách" };

export function FollowupTimeline({ items = [] }) {
    if (!items.length) return <p className="small text-muted mb-0">Chưa có hoạt động xử lý được ghi nhận.</p>;
    return <ol className="followup-timeline list-unstyled mb-0">{items.map((item, index) => <li className="followup-timeline-item border-start ps-3 pb-4 position-relative" key={item.id || `${item.createdAt}-${index}`}>
        <div className="d-flex gap-2 align-items-start"><Activity size={16} className="text-muted flex-shrink-0 mt-1" aria-hidden="true" /><div className="min-w-0">
            <strong className="small">{ACTION_LABELS[item.action] || "Cập nhật hồ sơ theo dõi"}</strong><time className="small text-muted d-block" dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
            {item.toStatus && <div className="d-flex flex-wrap align-items-center gap-1 mt-2">{item.fromStatus && <><StatusBadge status={item.fromStatus} /><ArrowRight size={13} aria-hidden="true" /></>}<StatusBadge status={item.toStatus} /></div>}
            {item.note && <p className="small mt-2 mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{item.note}</p>}
        </div></div>
    </li>)}</ol>;
}

export function ReportSummary({ report }) {
    return <div className="followup-report-summary">
        <div className="d-flex flex-wrap gap-2 mb-3"><StatusBadge status={report.severity} severity /><StatusBadge status={report.status} /></div>
        {report.severity === "none" && <p className="small text-muted">Cập nhật định kỳ: không khai báo dấu hiệu bất thường tại thời điểm gửi. Đây không phải kết luận y tế.</p>}
        <dl className="row small mb-2"><dt className="col-5">Gửi cập nhật</dt><dd className="col-7">{formatDate(report.reportedAt)}</dd>
            {report.onsetAt && <><dt className="col-5">Bắt đầu ghi nhận</dt><dd className="col-7">{formatDate(report.onsetAt)}</dd></>}
            {report.temperature != null && <><dt className="col-5">Nhiệt độ khai báo</dt><dd className="col-7">{report.temperature} °C</dd></>}
            {report.durationHours != null && <><dt className="col-5">Thời gian kéo dài</dt><dd className="col-7">{report.durationHours} giờ</dd></>}
        </dl>
        {report.symptoms?.length > 0 && <div className="d-flex flex-wrap gap-2 mb-3">{report.symptoms.map((symptom) => <span className={`badge ${symptom.isRedFlag ? "text-bg-danger" : "text-bg-light border"} text-wrap text-start`} key={symptom.code}>{symptom.name}</span>)}</div>}
        {report.description && <p className="small text-break" style={{ whiteSpace: "pre-wrap" }}>{report.description}</p>}
        {report.advice?.message && <div className={`alert ${report.severity === "emergency" ? "alert-danger" : report.severity === "severe" ? "alert-warning" : "alert-light border"} small`}><strong className="d-block mb-1">Thông tin cần lưu ý</strong>{report.advice.message}</div>}
        {report.staffAdvice ? <div className="alert alert-info"><h3 className="h6">Phản hồi từ nhân viên y tế</h3><p className="small mb-0 text-break" style={{ whiteSpace: "pre-wrap" }}>{report.staffAdvice}</p></div> : <p className="small text-muted">Chưa có phản hồi của nhân viên y tế. Nếu cần trợ giúp khẩn cấp, không chờ phản hồi tại đây.</p>}
        {report.staffName && <p className="small mb-2"><strong>Nhân viên phụ trách:</strong> {report.staffName}</p>}
        {report.nextFollowupAt && <p className="small mb-0"><strong>Hẹn cập nhật tiếp:</strong> {formatDate(report.nextFollowupAt)}</p>}
    </div>;
}
