import {
    ClipboardPlus,
    Bell,
    CalendarDays,
    CircleUserRound,
    History,
    House,
    KeyRound,
    ShieldAlert,
} from "lucide-react";

import EnterpriseShell from "../components/common/EnterpriseShell";

const citizenMenu = [
    { to: "/citizen", label: "Trang chủ", icon: House, end: true },
    { to: "/citizen/profile", label: "Hồ sơ cá nhân", icon: CircleUserRound },
    { to: "/citizen/schedules", label: "Lịch tiêm", icon: CalendarDays },
    { to: "/citizen/post-vaccination", label: "Theo dõi sau tiêm", icon: ClipboardPlus },
    { to: "/citizen/history", label: "Lịch sử tiêm", icon: History },
    { to: "/citizen/contraindications", label: "Chống chỉ định", icon: ShieldAlert },
    { to: "/citizen/notifications", label: "Thông báo", icon: Bell },
    { to: "/citizen/change-password", label: "Đổi mật khẩu", icon: KeyRound },
];

function CitizenLayout() {
    return <EnterpriseShell role="citizen" menuItems={citizenMenu} />;
}

export default CitizenLayout;
