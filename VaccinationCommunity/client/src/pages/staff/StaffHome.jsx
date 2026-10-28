import formatDate from "../../utils/formatDate";
import useDashboardData from "../../hooks/useDashboardData";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CalendarClock, CalendarDays, ClipboardPlus, Package, Search, Syringe, UsersRound } from "lucide-react";
import citizenService from "../../services/citizenService";
import vaccineService from "../../services/vaccineService";
import batchService from "../../services/batchService";
import scheduleService from "../../services/scheduleService";
import { PageHeading, MetricCard, Panel, QuickLink, EmptyState, DashboardLoading, DashboardError } from "../../components/common/DashboardUI";
const resources = { citizens: citizenService.getAllCitizens, vaccines: vaccineService.getAllVaccines, batches: batchService.getAllBatches, schedules: scheduleService.getAllSchedules };
export default function StaffHome() {
    const { data, loading, failed, reload } = useDashboardData(resources);
    const schedules = Array.isArray(data.schedules) ? data.schedules : [];
    const batches = Array.isArray(data.batches) ? data.batches : [];
    const pending = schedules.filter(item => item.TrangThai === "Đã lên lịch");
    const confirmed = schedules.filter(item => item.TrangThai === "Đã xác nhận");
    const upcoming = [...pending, ...confirmed].sort((a,b) => new Date(a.NgayDuKien) - new Date(b.NgayDuKien));
    const activeBatches = batches.filter(item => item.TrangThai === "Đang sử dụng");
    const todayUtc = new Date().toISOString().slice(0, 10);
    const availableDoses = activeBatches.filter(item => !item.HanSuDung || String(item.HanSuDung).slice(0,10) >= todayUtc)
        .reduce((total, item) => total + Math.max(0, Number(item.SoLuongCon || 0) - Number(item.SoLuongDatTruoc || 0)), 0);
    if (loading) return <DashboardLoading />;
    return <div className="medical-page staff-home">
        <PageHeading eyebrow="ĐIỀU PHỐI TIÊM CHỦNG" title="Tổng quan công việc" description="Theo dõi lịch hẹn, hồ sơ người dân và nguồn vaccine trong hệ thống."><Link to="/staff/vaccinations" className="btn btn-primary"><Activity size={16} />Ghi nhận mũi tiêm</Link></PageHeading>
        {failed.length > 0 && <DashboardError reload={reload} />}
        <div className="stat-grid">
            <MetricCard icon={UsersRound} label="Hồ sơ người dân" value={data.citizens?.length} detail="Được quản lý trên hệ thống" />
            <MetricCard icon={CalendarClock} label="Lịch chờ xác nhận" value={data.schedules === undefined ? undefined : pending.length} detail="Trạng thái đã lên lịch" tone="orange" />
            <MetricCard icon={CalendarDays} label="Lịch đã xác nhận" value={data.schedules === undefined ? undefined : confirmed.length} detail="Chờ thực hiện tiêm" tone="blue" />
            <MetricCard icon={Package} label="Lô đang sử dụng" value={data.batches === undefined ? undefined : activeBatches.length} detail="Theo trạng thái lô vaccine" tone="purple" />
        </div>
        <div className="dashboard-grid">
            <Panel title="Lịch tiêm đang chờ thực hiện" description="Sắp xếp theo thời gian dự kiến" action={<Link to="/staff/schedules">Quản lý lịch <ArrowRight size={13} /></Link>}>
                {upcoming.length ? <div className="table-responsive"><table className="table align-middle"><thead><tr><th>Người dân</th><th>Vaccine</th><th>Dự kiến</th><th>Trạng thái</th></tr></thead><tbody>{upcoming.slice(0, 5).map(item => <tr key={item.MaLichTiem}><td><strong>{item.HoTen}</strong></td><td>{item.TenVaccine}</td><td>{formatDate(item.NgayDuKien, true)}</td><td><span className={`status-pill ${item.TrangThai === "Đã xác nhận" ? "status-success" : "status-warning"}`}>{item.TrangThai}</span></td></tr>)}</tbody></table></div> : <EmptyState icon={CalendarClock} title={data.schedules === undefined ? "Chưa tải được lịch tiêm" : "Không có lịch đang chờ"} description="Các lịch mới và lịch đã xác nhận sẽ xuất hiện tại đây." />}
            </Panel>
            <Panel title="Nguồn vaccine" description="Dữ liệu từ danh mục và các lô đang sử dụng"><div className="inventory-list">
                <div className="inventory-row"><div><strong>Danh mục vaccine</strong><small>Các loại vaccine đang được quản lý</small></div><span>{data.vaccines?.length ?? "—"}</span></div>
                <div className="inventory-row"><div><strong>Tổng lô vaccine</strong><small>Bao gồm tất cả trạng thái</small></div><span>{data.batches?.length ?? "—"}</span></div>
                <div className="inventory-row"><div><strong>Liều còn khả dụng</strong><small>Lô đủ hạn; không gồm liều đã giữ cho lịch hẹn</small></div><span>{data.batches === undefined ? "—" : availableDoses.toLocaleString("vi-VN")}</span></div>
            </div><Link to="/staff/batches" className="btn btn-sm btn-outline-primary mt-4">Xem kho vaccine <ArrowRight size={13} /></Link></Panel>
        </div>
        <section className="dashboard-section"><div className="section-title"><div><h2>Nghiệp vụ thường dùng</h2><p>Mỗi thao tác giúp hồ sơ tiêm chủng đầy đủ và chính xác hơn</p></div></div><div className="quick-grid">
            <QuickLink to="/staff/citizens" icon={UsersRound} title="Hồ sơ người dân" description="Tra cứu và kiểm tra thông tin" />
            <QuickLink to="/staff/schedules" icon={CalendarDays} title="Điều phối lịch tiêm" description="Xác nhận và cập nhật lịch hẹn" />
            <QuickLink to="/staff/followups" icon={ClipboardPlus} title="Theo dõi sau tiêm" description="Xem tình trạng và phản hồi" />
            <QuickLink to="/staff/vaccines" icon={Syringe} title="Danh mục vaccine" description="Quản lý thông tin vaccine" />
            <QuickLink to="/staff/batches" icon={Package} title="Kho và lô vaccine" description="Theo dõi số lượng, hạn dùng" />
            <QuickLink to="/staff/trace" icon={Search} title="Truy vết vaccine" description="Tra cứu lô và mũi đã sử dụng" />
        </div></section>
    </div>;
}
