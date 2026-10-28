import useDashboardData from "../../hooks/useDashboardData";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardPlus, KeyRound, Package, Search, ShieldCheck, Syringe, UsersRound } from "lucide-react";
import userService from "../../services/userService";
import vaccineService from "../../services/vaccineService";
import batchService from "../../services/batchService";
import { PageHeading, MetricCard, Panel, QuickLink, EmptyState, DashboardLoading, DashboardError } from "../../components/common/DashboardUI";
const resources = { users: userService.getAllUsers, vaccines: vaccineService.getAllVaccines, batches: batchService.getAllBatches };
function activeStatus(item) { return ["hoạt động", "hoat dong", "active", "1", "true"].includes(String(item.TrangThai ?? item.trangThai ?? "").trim().toLowerCase()); }
export default function AdminHome() {
    const { data, loading, failed, reload } = useDashboardData(resources);
    const users = Array.isArray(data.users) ? data.users : [];
    const batches = Array.isArray(data.batches) ? data.batches : [];
    const activeUsers = users.filter(activeStatus);
    const activeBatches = batches.filter(item => item.TrangThai === "Đang sử dụng");
    const roles = [['Người dân', ''], ['Nhân viên', 'blue'], ['Quản trị viên', 'purple']].map(([name, tone]) => ({ name, tone, count: users.filter(item => (item.TenVaiTro || item.tenVaiTro) === name).length }));
    if (loading) return <DashboardLoading />;
    return <div className="medical-page admin-home">
        <PageHeading eyebrow="QUẢN TRỊ HỆ THỐNG" title="Tổng quan quản trị" description="Quản lý tài khoản, phân quyền và danh mục phục vụ hoạt động tiêm chủng."><Link to="/admin/users" className="btn btn-primary"><UsersRound size={16} />Quản lý tài khoản</Link></PageHeading>
        {failed.length > 0 && <DashboardError reload={reload} />}
        <div className="stat-grid">
            <MetricCard icon={UsersRound} label="Tổng tài khoản" value={data.users?.length} detail="Tất cả vai trò trong hệ thống" />
            <MetricCard icon={ShieldCheck} label="Tài khoản hoạt động" value={data.users === undefined ? undefined : activeUsers.length} detail="Được phép truy cập" tone="blue" />
            <MetricCard icon={Syringe} label="Danh mục vaccine" value={data.vaccines?.length} detail="Các loại vaccine được quản lý" tone="orange" />
            <MetricCard icon={Package} label="Lô đang sử dụng" value={data.batches === undefined ? undefined : activeBatches.length} detail="Theo trạng thái của lô" tone="purple" />
        </div>
        <div className="dashboard-grid">
            <Panel title="Phân bổ tài khoản" description="Theo vai trò được cấp trong hệ thống" action={<Link to="/admin/users">Xem tài khoản <ArrowRight size={13} /></Link>}>
                {users.length ? <div className="role-distribution">{roles.map(item => <div key={item.name}><div className="role-distribution-title"><span>{item.name}</span><strong>{item.count} tài khoản</strong></div><div className="progress" role="progressbar" aria-label={item.name} aria-valuenow={item.count} aria-valuemin={0} aria-valuemax={users.length}><div className={`progress-bar ${item.tone}`} style={{ width: `${item.count / users.length * 100}%` }} /></div></div>)}</div> : <EmptyState icon={UsersRound} title={data.users === undefined ? "Chưa tải được tài khoản" : "Chưa có tài khoản"} description="Các tài khoản được tạo sẽ được thống kê theo vai trò tại đây." />}
            </Panel>
            <Panel title="Thông tin quản lý" description="Số liệu tổng hợp từ dữ liệu hiện có"><div className="inventory-list">
                <div className="inventory-row"><div><strong>Tài khoản không hoạt động</strong><small>Theo trạng thái tài khoản đã ghi nhận</small></div><span>{data.users === undefined ? "—" : users.length - activeUsers.length}</span></div>
                <div className="inventory-row"><div><strong>Tổng lô vaccine</strong><small>Bao gồm các lô ở mọi trạng thái</small></div><span>{data.batches?.length ?? "—"}</span></div>
                <div className="inventory-row"><div><strong>Danh mục vaccine</strong><small>Các loại vaccine trong hệ thống</small></div><span>{data.vaccines?.length ?? "—"}</span></div>
            </div></Panel>
        </div>
        <section className="dashboard-section"><div className="section-title"><div><h2>Công cụ quản trị</h2><p>Truy cập các chức năng quản lý cần thiết</p></div></div><div className="quick-grid">
            <QuickLink to="/admin/users" icon={UsersRound} title="Tài khoản và phân quyền" description="Cập nhật vai trò, khóa và mở tài khoản" />
            <QuickLink to="/admin/vaccines" icon={Syringe} title="Danh mục vaccine" description="Quản lý thông tin và trạng thái" />
            <QuickLink to="/admin/batches" icon={Package} title="Theo dõi lô vaccine" description="Kiểm tra số lượng và hạn dùng" />
            <QuickLink to="/admin/followups" icon={ClipboardPlus} title="Theo dõi sau tiêm" description="Giám sát và phản hồi tình trạng" />
            <QuickLink to="/admin/trace" icon={Search} title="Truy vết vaccine" description="Tra cứu lịch sử sử dụng các lô" />
            <QuickLink to="/admin/change-password" icon={KeyRound} title="Bảo mật tài khoản" description="Thay đổi mật khẩu đăng nhập" />
        </div></section>
    </div>;
}
