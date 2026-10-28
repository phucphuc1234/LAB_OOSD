import {
    ClipboardPlus,
    Activity,
    CalendarClock,
    FlaskConical,
    History,
    House,
    KeyRound,
    PackageSearch,
    ShieldAlert,
    Syringe,
    UsersRound,
} from "lucide-react";

import EnterpriseShell from "../components/common/EnterpriseShell";

const staffMenu = [
    { to: "/staff", label: "Tổng quan", icon: House, end: true },
    { to: "/staff/citizens", label: "Quản lý người dân", icon: UsersRound },
    { to: "/staff/vaccines", label: "Quản lý vaccine", icon: Syringe },
    { to: "/staff/batches", label: "Quản lý lô vaccine", icon: FlaskConical },
    { to: "/staff/schedules", label: "Quản lý lịch tiêm", icon: CalendarClock },
    { to: "/staff/vaccinations", label: "Ghi nhận mũi tiêm", icon: Activity },
    { to: "/staff/contraindications", label: "Chống chỉ định", icon: ShieldAlert },
    { to: "/staff/followups", label: "Theo dõi sau tiêm", icon: ClipboardPlus },
    { to: "/staff/history", label: "Tra cứu lịch sử", icon: History },
    { to: "/staff/trace", label: "Truy vết vaccine", icon: PackageSearch },
    { to: "/staff/change-password", label: "Đổi mật khẩu", icon: KeyRound },
];

function StaffLayout() {
    return <EnterpriseShell role="staff" menuItems={staffMenu} />;
}

export default StaffLayout;
