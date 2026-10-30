import {
    Building2,
    ClipboardPlus,
    Activity,
    CalendarClock,
    History,
    ShieldAlert,
    FlaskConical,
    Gauge,
    KeyRound,
    PackageSearch,
    Syringe,
    UsersRound,
} from "lucide-react";

import EnterpriseShell from "../components/common/EnterpriseShell";

const adminMenu = [
    { to: "/admin", label: "Trung tâm quản trị", icon: Gauge, end: true },
    { to: "/admin/facilities", label: "Cơ sở & phân công", icon: Building2 },
    { to: "/admin/facility-workspace", label: "Tiếp nhận tại cơ sở", icon: Building2 },
    { to: "/admin/users", label: "Tài khoản & phân quyền", icon: UsersRound },
    { to: "/admin/citizens", label: "Hồ sơ người dân", icon: UsersRound },
    { to: "/admin/schedules", label: "Quản lý lịch tiêm", icon: CalendarClock },
    { to: "/admin/vaccinations", label: "Ghi nhận mũi tiêm", icon: Activity },
    { to: "/admin/vaccines", label: "Danh mục vaccine", icon: Syringe },
    { to: "/admin/batches", label: "Theo dõi lô vaccine", icon: FlaskConical },
    { to: "/admin/followups", label: "Theo dõi sau tiêm", icon: ClipboardPlus },
    { to: "/admin/contraindications", label: "Chống chỉ định", icon: ShieldAlert },
    { to: "/admin/history", label: "Tra cứu lịch sử", icon: History },
    { to: "/admin/trace", label: "Truy vết vaccine", icon: PackageSearch },
    { to: "/admin/change-password", label: "Bảo mật tài khoản", icon: KeyRound },
];

function AdminLayout() {
    return <EnterpriseShell role="admin" menuItems={adminMenu} />;
}

export default AdminLayout;
