import { Link } from "react-router-dom";
import { ArrowRight, Inbox, LoaderCircle, RefreshCw } from "lucide-react";

export function PageHeading({ eyebrow, title, description, children }) {
    return <div className="page-heading"><div>{eyebrow && <div className="page-eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="page-actions">{children}</div>}</div>;
}
export function MetricCard({ icon: Icon, label, value, detail, tone = "teal" }) {
    return <div className="stat-card"><div className={`stat-icon tone-${tone}`}><Icon size={23} strokeWidth={1.8} /></div><div className="stat-copy"><span>{label}</span><strong>{value === undefined ? "—" : value}</strong>{detail && <small>{detail}</small>}</div></div>;
}
export function Panel({ title, description, action, children, className = "" }) {
    return <section className={`panel ${className}`}><div className="panel-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div><div className="panel-body">{children}</div></section>;
}
export function QuickLink({ to, icon: Icon, title, description }) {
    return <Link to={to} className="quick-link"><span className="quick-link-icon"><Icon size={21} strokeWidth={1.8} /></span><span><strong>{title}</strong><small>{description}</small></span><ArrowRight size={17} /></Link>;
}
export function EmptyState({ icon: Icon = Inbox, title = "Chưa có dữ liệu", description, action }) {
    return <div className="empty-state"><span className="empty-state-icon"><Icon size={28} strokeWidth={1.5} /></span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}
export function DashboardLoading() {
    return <div className="dashboard-loading" role="status"><LoaderCircle className="loading-spinner" size={25} /><span>Đang tải thông tin của bạn…</span></div>;
}
export function DashboardError({ reload }) {
    return <div className="alert alert-warning dashboard-error" role="alert"><span>Một số thông tin chưa tải được. Vui lòng kiểm tra kết nối và thử lại.</span><button type="button" className="btn btn-sm btn-outline-secondary" onClick={reload}><RefreshCw size={15} /> Thử lại</button></div>;
}
