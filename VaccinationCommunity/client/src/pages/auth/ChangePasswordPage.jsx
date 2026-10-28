import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import authService from "../../services/authService";
import { PageHeading } from "../../components/common/DashboardUI";

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ matKhauHienTai: "", matKhauMoi: "", xacNhanMatKhauMoi: "" });
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);
    const change = event => setForm(value => ({ ...value, [event.target.name]: event.target.value }));
    const submit = async event => {
        event.preventDefault(); setError(""); setMessage("");
        if (form.matKhauMoi.length < 8) return setError("Mật khẩu mới cần ít nhất 8 ký tự.");
        if (new TextEncoder().encode(form.matKhauMoi).length > 72) return setError("Mật khẩu mới quá dài. Vui lòng chọn mật khẩu ngắn hơn.");
        if (form.matKhauMoi !== form.xacNhanMatKhauMoi) return setError("Xác nhận mật khẩu mới chưa khớp.");
        try {
            setLoading(true);
            await authService.changePassword({ matKhauHienTai: form.matKhauHienTai, matKhauMoi: form.matKhauMoi });
            authService.logout();
            setMessage("Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới.");
            timer.current = setTimeout(() => navigate("/login", { replace: true }), 1400);
        } catch (failure) { setError(failure.response?.data?.message || "Chưa thể đổi mật khẩu. Vui lòng thử lại."); }
        finally { setLoading(false); }
    };
    return <div className="medical-page"><PageHeading eyebrow="BẢO MẬT TÀI KHOẢN" title="Đổi mật khẩu" description="Sử dụng mật khẩu riêng để bảo vệ thông tin của bạn. Sau khi đổi, bạn cần đăng nhập lại." />
        <div className="card" style={{ maxWidth: 620 }}><div className="card-body p-4">
            {error && <div className="alert alert-danger" role="alert">{error}</div>}{message && <div className="alert alert-success" role="status">{message}</div>}
            <form onSubmit={submit} aria-busy={loading}><fieldset disabled={loading || !!message}>
                {[['matKhauHienTai', 'Mật khẩu hiện tại', 'current-password'], ['matKhauMoi', 'Mật khẩu mới', 'new-password'], ['xacNhanMatKhauMoi', 'Xác nhận mật khẩu mới', 'new-password']].map(([name, label, autoComplete]) => <div className="mb-3" key={name}><label htmlFor={`password-${name}`} className="form-label">{label}</label><input id={`password-${name}`} type={show ? "text" : "password"} name={name} autoComplete={autoComplete} className="form-control" value={form[name]} onChange={change} minLength={name === "matKhauHienTai" ? 1 : 8} required />{name === "matKhauMoi" && <div className="form-text">Ít nhất 8 ký tự. Nên chọn mật khẩu khác với các tài khoản bạn đang sử dụng.</div>}</div>)}
                <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap mt-4"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShow(value => !value)} aria-pressed={show}>{show ? <EyeOff size={15} /> : <Eye size={15} />}{show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</button><button type="submit" className="btn btn-primary" disabled={loading || !!message}><KeyRound size={16} />{loading ? "Đang cập nhật…" : "Lưu mật khẩu mới"}</button></div>
            </fieldset></form>
        </div></div>
    </div>;
}
