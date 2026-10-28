import { useState } from "react";
import formatDate from "../../utils/formatDate";
import useDashboardData from "../../hooks/useDashboardData";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, CalendarCheck2, CalendarDays, ClipboardPlus, FileHeart, History, MapPin, ShieldCheck, Syringe, UserRound } from "lucide-react";
import citizenService from "../../services/citizenService";
import scheduleService from "../../services/scheduleService";
import historyService from "../../services/historyService";
import notificationService from "../../services/notificationService";
import { MetricCard, Panel, QuickLink, EmptyState, DashboardLoading, DashboardError } from "../../components/common/DashboardUI";

const resources = { profile: citizenService.getMyProfile, schedules: scheduleService.getMySchedules, history: historyService.getMyHistory, notifications: notificationService.getMyNotifications };
export default function CitizenHome() {
    const { data, loading, failed, reload } = useDashboardData(resources);
    const schedules = Array.isArray(data.schedules) ? data.schedules : [];
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    const [today] = useState(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; });
    const upcoming = schedules.filter(item => new Date(item.NgayDuKien) >= today && ["Đã lên lịch", "Đã xác nhận"].includes(item.TrangThai)).sort((a, b) => new Date(a.NgayDuKien) - new Date(b.NgayDuKien));
    const nearest = upcoming[0];
    const unread = notifications.filter(item => !item.DaDoc).length;
    if (loading) return <DashboardLoading />;
    return <div className="medical-page citizen-home">
        {failed.length > 0 && <DashboardError reload={reload} />}
        <section className="welcome-banner">
            <div><div className="page-eyebrow">SỨC KHỎE CỦA BẠN, TRONG TẦM TAY</div><h1>Xin chào, {data.profile?.HoTen || "bạn"}!</h1><p>Theo dõi hành trình tiêm chủng và chủ động chăm sóc sức khỏe cho bản thân, gia đình.</p><Link to="/citizen/schedules" className="btn btn-primary"><CalendarDays size={16} /> Đăng ký lịch tiêm <ArrowRight size={15} /></Link></div>
            <div className="welcome-illustration" aria-hidden="true"><ShieldCheck size={74} strokeWidth={1.15} /></div>
        </section>
        <div className="stat-grid">
            <MetricCard icon={Syringe} label="Mũi tiêm đã ghi nhận" value={data.history === undefined ? undefined : data.history.length} detail="Trong hồ sơ tiêm chủng" />
            <MetricCard icon={CalendarDays} label="Lịch tiêm sắp tới" value={data.schedules === undefined ? undefined : upcoming.length} tone="blue" detail="Lịch đang chờ thực hiện" />
            <MetricCard icon={Bell} label="Thông báo chưa đọc" value={data.notifications === undefined ? undefined : unread} tone="orange" detail="Cập nhật dành cho bạn" />
            <MetricCard icon={FileHeart} label="Lịch đã đăng ký" value={data.schedules === undefined ? undefined : schedules.length} tone="purple" detail="Tất cả trạng thái" />
        </div>
        <div className="dashboard-grid">
            <Panel title="Lịch tiêm gần nhất" description="Chuẩn bị đầy đủ trước buổi tiêm của bạn" action={<Link to="/citizen/schedules">Xem lịch tiêm <ArrowRight size={13} /></Link>}>
                {nearest ? <div className="upcoming-appointment">
                    <div className="appointment-top"><span className="appointment-date"><CalendarDays size={16} />{formatDate(nearest.NgayDuKien, true)}</span><span className="status-pill status-success">{nearest.TrangThai}</span></div>
                    <h3>{nearest.TenVaccine || "Vaccine theo lịch"}</h3>
                    <div className="appointment-meta"><span><Syringe size={14} />Mũi {nearest.MuiSo}</span><span><MapPin size={14} />{nearest.CoSoTiem || "Cơ sở tiêm chưa cập nhật"}</span></div>
                    <Link to="/citizen/schedules" className="btn btn-sm btn-outline-primary mt-4">Xem chi tiết <ArrowRight size={13} /></Link>
                </div> : <EmptyState icon={CalendarCheck2} title={data.schedules === undefined ? "Chưa tải được lịch tiêm" : "Bạn chưa có lịch tiêm sắp tới"} description="Đăng ký lịch phù hợp và theo dõi trạng thái xác nhận tại đây." action={<Link to="/citizen/schedules" className="btn btn-sm btn-outline-primary">Xem lịch tiêm</Link>} />}
            </Panel>
            <Panel title="Thông báo mới" description="Thông tin từ cơ sở tiêm chủng" action={<Link to="/citizen/notifications">Xem tất cả</Link>}>
                {notifications.length ? <div className="notification-list">{notifications.slice(0, 3).map(item => <div className="notification-list-item" key={item.MaThongBao}><span className={`notification-dot${item.DaDoc ? " read" : ""}`} /><div><strong>{item.TieuDe}</strong><p>{item.NoiDung}</p></div></div>)}</div> : <EmptyState icon={Bell} title={data.notifications === undefined ? "Chưa tải được thông báo" : "Chưa có thông báo mới"} description="Nhắc lịch và thông tin liên quan sẽ được hiển thị tại đây." />}
            </Panel>
        </div>
        <section className="dashboard-section"><div className="section-title"><div><h2>Bạn muốn làm gì hôm nay?</h2><p>Truy cập nhanh các thông tin tiêm chủng của bạn</p></div></div><div className="quick-grid">
            <QuickLink to="/citizen/profile" icon={UserRound} title="Hồ sơ cá nhân" description="Xem và cập nhật thông tin" />
            <QuickLink to="/citizen/history" icon={History} title="Lịch sử tiêm chủng" description="Tra cứu các mũi đã tiêm" />
            <QuickLink to="/citizen/post-vaccination" icon={ClipboardPlus} title="Theo dõi sau tiêm" description="Khai báo tình trạng sức khỏe" />
        </div></section>
        <section className="dashboard-section"><Panel title="Để buổi tiêm diễn ra thuận lợi" description="Một vài điều bạn nên chuẩn bị"><div className="row g-4">
            {[['01', 'Mang theo giấy tờ cần thiết', 'Chuẩn bị giấy tờ tùy thân và thông tin về các mũi tiêm trước.'], ['02', 'Chia sẻ tình trạng sức khỏe', 'Thông báo cho nhân viên y tế về dị ứng, bệnh nền hoặc triệu chứng hiện tại.'], ['03', 'Theo dõi sức khỏe sau tiêm', 'Thực hiện hướng dẫn của nhân viên y tế và cập nhật tình trạng sau tiêm.']].map(([number, title, text]) => <div className="col-md-4" key={number}><div className="guide-item"><span className="guide-number">{number}</span><div><strong>{title}</strong><p>{text}</p></div></div></div>)}
        </div></Panel></section>
    </div>;
}
