import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import authService from "../../services/authService";
import MedicalBrand from "../../components/common/MedicalBrand";
const initialForm = { tenDangNhap: "", matKhau: "", xacNhanMatKhau: "", hoTen: "", ngaySinh: "", gioiTinh: "", cccd: "", soBHYT: "", soDienThoai: "", email: "", diaChi: "", phuongXa: "", quanHuyen: "", tinhThanh: "" };
export default function RegisterPage() {
    const navigate = useNavigate();
    const [maxBirthDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [form, setForm] = useState(initialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const redirectTimer = useRef(null);
    useEffect(() => () => clearTimeout(redirectTimer.current), []);
    const change = event => setForm(old => ({ ...old, [event.target.name]: event.target.value }));
    const submit = async event => {
        event.preventDefault(); setError(""); setMessage("");
        if (!/^[A-Za-z0-9_.-]{3,100}$/.test(form.tenDangNhap.trim())) return setError("Tên đăng nhập cần từ 3–100 ký tự chữ không dấu, số, dấu chấm, gạch ngang hoặc gạch dưới.");
        if (form.matKhau.length < 8) return setError("Mật khẩu cần ít nhất 8 ký tự.");
        if (new TextEncoder().encode(form.matKhau).length > 72) return setError("Mật khẩu quá dài. Vui lòng chọn mật khẩu ngắn hơn.");
        if (form.matKhau !== form.xacNhanMatKhau) return setError("Xác nhận mật khẩu chưa khớp.");
        if (!/^(?:\d{9}|\d{12})$/.test(form.cccd.trim())) return setError("CCCD/CMND cần có 9 hoặc 12 chữ số.");
        if (!/^\+?\d{9,15}$/.test(form.soDienThoai.replace(/[\s().-]/g, ""))) return setError("Số điện thoại cần có 9–15 chữ số.");
        try {
            setLoading(true);
            const payload = { ...form };
            delete payload.xacNhanMatKhau;
            await authService.register({ ...payload, tenDangNhap: form.tenDangNhap.trim(), hoTen: form.hoTen.trim(), email: form.email.trim(), cccd: form.cccd.trim(), soBHYT: form.soBHYT || null, diaChi: form.diaChi || null, phuongXa: form.phuongXa || null, quanHuyen: form.quanHuyen || null, tinhThanh: form.tinhThanh || null });
            setMessage("Đăng ký thành công. Bạn có thể đăng nhập bằng tài khoản vừa tạo.");
            redirectTimer.current = setTimeout(() => navigate("/login", { replace: true }), 1800);
        } catch (failure) { setError(failure.response?.data?.message || "Chưa thể đăng ký. Vui lòng thử lại."); }
        finally { setLoading(false); }
    };
    const field = (name, label, options = {}) => <div className={options.column || "col-md-6"} key={name}><label className="form-label" htmlFor={`register-${name}`}>{label}{options.required && <span className="text-danger" aria-label="bắt buộc"> *</span>}</label><input id={`register-${name}`} className="form-control" name={name} value={form[name]} onChange={change} {...options.input} required={options.required} />{options.hint && <div className="form-text">{options.hint}</div>}</div>;
    return <main className="registration-page"><div className="registration-top"><Link to="/login" className="brand-link"><MedicalBrand /></Link><Link to="/login"><ArrowLeft size={14} /> Quay lại đăng nhập</Link></div><div className="registration-card">
        <div className="page-eyebrow">DÀNH CHO NGƯỜI DÂN</div><h1>Tạo tài khoản của bạn</h1><p>Đăng ký để quản lý hồ sơ tiêm chủng và theo dõi sức khỏe sau tiêm. Các trường có dấu <span className="text-danger">*</span> là bắt buộc.</p>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}{message && <div className="alert alert-success" role="status">{message} <Link to="/login">Đăng nhập ngay</Link></div>}
        <form onSubmit={submit} aria-busy={loading}><fieldset disabled={loading || !!message}>
            <section className="registration-section"><h2>01 · Thông tin đăng nhập</h2><div className="row g-3">
                {field("tenDangNhap", "Tên đăng nhập", { required: true, input: { autoComplete: "username", minLength: 3, maxLength: 100, pattern: "[A-Za-z0-9_.\\-]{3,100}", autoCapitalize: "none", spellCheck: false, placeholder: "Ví dụ: nguyenan" }, hint: "Dùng chữ không dấu, số hoặc các dấu . _ -" })}
                {field("email", "Email", { required: true, input: { type: "email", autoComplete: "email", maxLength: 150, placeholder: "ban@example.com" } })}
                {field("matKhau", "Mật khẩu", { required: true, input: { type: showPassword ? "text" : "password", autoComplete: "new-password", minLength: 8 }, hint: "Ít nhất 8 ký tự. Không dùng mật khẩu đã chia sẻ." })}
                {field("xacNhanMatKhau", "Xác nhận mật khẩu", { required: true, input: { type: showPassword ? "text" : "password", autoComplete: "new-password", minLength: 8 } })}
            </div><button type="button" className="btn btn-sm btn-outline-secondary mt-3" onClick={() => setShowPassword(old => !old)} aria-pressed={showPassword}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</button></section>
            <section className="registration-section"><h2>02 · Thông tin cá nhân</h2><div className="row g-3">
                {field("hoTen", "Họ và tên", { required: true, input: { autoComplete: "name", maxLength: 150 } })}
                {field("ngaySinh", "Ngày sinh", { required: true, input: { type: "date", autoComplete: "bday", min: "1900-01-01", max: maxBirthDate } })}
                <div className="col-md-6"><label htmlFor="register-gender" className="form-label">Giới tính <span className="text-danger">*</span></label><select className="form-select" id="register-gender" name="gioiTinh" value={form.gioiTinh} onChange={change} required><option value="">Chọn giới tính</option><option>Nam</option><option>Nữ</option><option>Khác</option></select></div>
                {field("soDienThoai", "Số điện thoại", { required: true, input: { type: "tel", autoComplete: "tel", minLength: 9, maxLength: 20 } })}
                {field("cccd", "CCCD / CMND", { required: true, input: { inputMode: "numeric", pattern: "(?:[0-9]{9}|[0-9]{12})", maxLength: 12 }, hint: "Nhập đúng 9 hoặc 12 chữ số trên giấy tờ." })}
                {field("soBHYT", "Số bảo hiểm y tế", { input: { maxLength: 30 }, hint: "Không bắt buộc." })}
            </div></section>
            <section className="registration-section"><h2>03 · Địa chỉ liên hệ <span>Không bắt buộc</span></h2><div className="row g-3">
                {field("tinhThanh", "Tỉnh / Thành phố", { input: { autoComplete: "address-level1", maxLength: 100 } })}
                {field("quanHuyen", "Quận / Huyện", { input: { autoComplete: "address-level2", maxLength: 100 } })}
                {field("phuongXa", "Phường / Xã", { input: { autoComplete: "address-level3", maxLength: 100 } })}
                {field("diaChi", "Địa chỉ cụ thể", { input: { autoComplete: "street-address", maxLength: 255 } })}
            </div></section>
            <button type="submit" className="btn btn-primary w-100 mt-4" disabled={loading || !!message}>{loading ? "Đang tạo tài khoản…" : "Đăng ký tài khoản"}<ArrowRight size={16} /></button>
        </fieldset></form><div className="auth-note"><ShieldCheck size={16} /><span>Tài khoản đăng ký mới dành cho người dân. Nhân viên và quản trị viên được cấp quyền bởi người quản trị.</span></div>
    </div></main>;
}
