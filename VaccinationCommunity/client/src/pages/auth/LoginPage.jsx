import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarCheck2, Eye, EyeOff, FileHeart, HeartPulse, ShieldCheck } from "lucide-react";
import authService from "../../services/authService";
import MedicalBrand from "../../components/common/MedicalBrand";

export default function LoginPage() {
    const navigate = useNavigate();
    const [tenDangNhap, setTenDangNhap] = useState("");
    const [matKhau, setMatKhau] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const submit = async event => {
        event.preventDefault(); setError(""); setLoading(true);
        try {
            const response = await authService.login(tenDangNhap.trim(), matKhau);
            const destinations = { "Người dân": "/citizen", "Nhân viên": "/staff", "Quản trị viên": "/admin" };
            const destination = destinations[response.user?.tenVaiTro || response.user?.TenVaiTro];
            if (!destination) { setError("Vai trò tài khoản chưa được hỗ trợ. Vui lòng liên hệ người quản trị."); return; }
            authService.saveLogin(response.token, response.user);
            navigate(destination, { replace: true });
        } catch (failure) { setError(failure.response?.data?.message || "Chưa thể đăng nhập. Vui lòng kiểm tra kết nối và thử lại."); }
        finally { setLoading(false); }
    };
    return <div className="auth-page">
        <aside className="auth-aside"><MedicalBrand />
            <div className="auth-story"><div className="page-eyebrow">ĐỒNG HÀNH CÙNG SỨC KHỎE CỘNG ĐỒNG</div><h1>Chủ động tiêm chủng.<br />An tâm mỗi ngày.</h1><p>Một nơi để theo dõi lịch hẹn, lưu giữ hồ sơ và cập nhật sức khỏe sau mỗi mũi tiêm.</p>
                <div className="auth-benefit"><span><CalendarCheck2 size={23} strokeWidth={1.6} /></span><div><strong>Theo dõi lịch tiêm</strong><small>Xem lịch hẹn và trạng thái xác nhận</small></div></div>
                <div className="auth-benefit"><span><FileHeart size={23} strokeWidth={1.6} /></span><div><strong>Hồ sơ tiêm chủng tập trung</strong><small>Tra cứu lịch sử và thông tin của bạn</small></div></div>
                <div className="auth-benefit"><span><HeartPulse size={23} strokeWidth={1.6} /></span><div><strong>Chăm sóc sau tiêm</strong><small>Khai báo tình trạng và theo dõi phản hồi</small></div></div>
            </div><div className="auth-aside-footer">Cổng theo dõi tiêm chủng cộng đồng</div>
        </aside>
        <main className="auth-main"><div className="auth-form-container"><div className="auth-mobile-brand"><MedicalBrand /></div><div className="page-eyebrow">CHÀO MỪNG BẠN TRỞ LẠI</div><h2>Đăng nhập</h2><p>Truy cập tài khoản để tiếp tục theo dõi và quản lý thông tin tiêm chủng.</p>
            {error && <div className="alert alert-danger" role="alert">{error}</div>}
            <form onSubmit={submit} aria-busy={loading}>
                <div className="auth-field"><label htmlFor="login-username" className="form-label">Tên đăng nhập</label><input id="login-username" className="form-control" autoComplete="username" value={tenDangNhap} onChange={event => setTenDangNhap(event.target.value)} placeholder="Nhập tên đăng nhập" required autoCapitalize="none" spellCheck={false} /></div>
                <div className="auth-field"><label htmlFor="login-password" className="form-label">Mật khẩu</label><div className="password-input"><input id="login-password" className="form-control" type={showPassword ? "text" : "password"} autoComplete="current-password" value={matKhau} onChange={event => setMatKhau(event.target.value)} placeholder="Nhập mật khẩu" required /><button type="button" className="icon-button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading ? "Đang đăng nhập…" : "Đăng nhập"}{!loading && <ArrowRight size={16} />}</button>
            </form>
            <div className="auth-switch">Chưa có tài khoản?<Link to="/register">Đăng ký người dân</Link></div>
            <div className="auth-note"><ShieldCheck size={16} /><span>Sử dụng tài khoản đã được cấp đối với nhân viên y tế và quản trị viên.</span></div>
        </div></main>
    </div>;
}
