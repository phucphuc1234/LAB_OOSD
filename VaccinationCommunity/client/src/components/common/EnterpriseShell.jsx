import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, CalendarDays, ChevronRight, LogOut, Menu, X } from "lucide-react";
import authService from "../../services/authService";
import MedicalBrand from "./MedicalBrand";

const roleLabels = { citizen: "Người dân", staff: "Nhân viên y tế", admin: "Quản trị viên" };

export default function EnterpriseShell({ role = "citizen", menuItems = [] }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuRoute, setMenuRoute] = useState(null);
    const sidebarOpen = menuRoute === location.pathname;
    const [dateLabel] = useState(() => new Date().toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }));
    const menuButton = useRef(null);
    const firstLink = useRef(null);
    const user = authService.getCurrentUser();
    const username = user?.hoTen || user?.HoTen || user?.tenDangNhap || user?.TenDangNhap || "Tài khoản";
    const initials = username.trim().split(/\s+/).slice(-2).map(part => part[0]).join("").toUpperCase();
    const currentItem = [...menuItems].reverse().find(item => item.end ? location.pathname === item.to : location.pathname.startsWith(item.to));

    useEffect(() => {
        document.documentElement.dataset.theme = "light";
        if (!sidebarOpen) return;
        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        firstLink.current?.focus();
        const onKey = event => {
            if (event.key === "Escape") { setMenuRoute(null); menuButton.current?.focus(); }
        };
        window.addEventListener("keydown", onKey);
        return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", onKey); };
    }, [sidebarOpen]);

    const logout = () => { authService.logout(); navigate("/login", { replace: true }); };
    return <div className={`app-layout enterprise-shell ${role}-layout${sidebarOpen ? " shell-sidebar-open" : ""}`}>
        <a className="skip-link" href="#main-content">Chuyển đến nội dung</a>
        {sidebarOpen && <button className="sidebar-overlay show" aria-label="Đóng điều hướng" onClick={() => setMenuRoute(null)} />}
        <aside className={`app-sidebar enterprise-sidebar${sidebarOpen ? " sidebar-open" : ""}`} aria-label="Điều hướng chính">
            <div className="sidebar-brand-row">
                <NavLink to={menuItems[0]?.to || "/"} className="brand-link"><MedicalBrand /></NavLink>
                <button className="icon-button mobile-sidebar-close" type="button" aria-label="Đóng menu" onClick={() => setMenuRoute(null)}><X size={20} /></button>
            </div>
            <div className="sidebar-section-label">KHÔNG GIAN {roleLabels[role].toUpperCase()}</div>
            <nav className="sidebar-menu" aria-label={`Chức năng ${roleLabels[role].toLowerCase()}`}>
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return <NavLink ref={index === 0 ? firstLink : undefined} key={item.to} to={item.to} end={item.end}
                        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                        <Icon size={19} strokeWidth={1.8} /><span>{item.label}</span><ChevronRight className="sidebar-link-arrow" size={14} />
                    </NavLink>;
                })}
            </nav>
            <div className="sidebar-account">
                <span className="account-avatar">{initials}</span>
                <div><strong>{username}</strong><small>{roleLabels[role]}</small></div>
                <button type="button" className="icon-button" onClick={logout} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={18} /></button>
            </div>
        </aside>
        <div className="enterprise-workspace">
            <header className="app-navbar enterprise-navbar">
                <div className="navbar-left">
                    <button ref={menuButton} className="icon-button mobile-menu-button" type="button" aria-label="Mở menu" aria-expanded={sidebarOpen} onClick={() => setMenuRoute(location.pathname)}><Menu size={23} /></button>
                    <div className="header-location"><small>{roleLabels[role]}</small><span>{currentItem?.label || "Thông tin tài khoản"}</span></div>
                </div>
                <div className="navbar-actions">
                    <span className="header-date"><CalendarDays size={17} />{dateLabel}</span>
                    {role === "citizen" && <NavLink to="/citizen/notifications" className="icon-button" aria-label="Xem thông báo"><Bell size={20} /></NavLink>}
                    <span className="header-account"><span className="account-avatar">{initials}</span><span>{username}</span></span>
                </div>
            </header>
            <main className="app-content enterprise-content" id="main-content" tabIndex={-1}><Outlet /></main>
            <footer className="enterprise-footer"><span>Cổng theo dõi tiêm chủng cộng đồng</span><span>Chủ động theo dõi · Chăm sóc sức khỏe</span></footer>
        </div>
    </div>;
}
