import { useEffect, useState } from "react";
import { ShieldPlus, MapPin } from "lucide-react";
import { EmptyState } from "../../components/common/DashboardUI";
import contraindicationService from "../../services/contraindicationService";
import citizenService from "../../services/citizenService";
import { getFacilities } from "../../services/facilityService";

const emptyForm = () => ({ maNguoiDan: "", maCoSoTiem: "", noiDung: "", ngayXacNhan: "", trangThai: "Đã xác nhận", ghiChu: "" });
const formatDate = value => value ? new Date(value).toLocaleDateString("vi-VN") : "—";
export default function ContraindicationManagementPage() {
    const [rows, setRows] = useState([]);
    const [citizens, setCitizens] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    async function loadData() {
        setLoading(true);
        try {
            const [contra, people, sites] = await Promise.all([contraindicationService.getAllContraindications(), citizenService.getAllCitizens(), getFacilities()]);
            setRows(contra.data || []); setCitizens(people.data || []); setFacilities(sites.data || []);
        } catch (failure) { setError(failure.response?.data?.message || "Không thể tải dữ liệu chống chỉ định."); }
        finally { setLoading(false); }
    }
    useEffect(() => { loadData(); }, []);
    const change = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
    const siteName = item => item.TenCoSo || facilities.find(site => Number(site.MaCoSoTiem) === Number(item.MaCoSoTiem))?.TenCoSo || "—";
    function edit(item) {
        setEditingId(item.MaChongChiDinh); setForm({ maNguoiDan: item.MaNguoiDan, maCoSoTiem: item.MaCoSoTiem || "", noiDung: item.NoiDung || "",
            ngayXacNhan: item.NgayXacNhan ? String(item.NgayXacNhan).slice(0, 10) : "", trangThai: item.TrangThai || "Đã xác nhận", ghiChu: item.GhiChu || "" });
        setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function reset() { setEditingId(null); setForm(emptyForm()); }
    async function submit(event) {
        event.preventDefault(); setError(""); setMessage("");
        if (!form.maCoSoTiem || !facilities.some(site => Number(site.MaCoSoTiem) === Number(form.maCoSoTiem))) {
            setError("Vui lòng chọn cơ sở tiêm được phân công."); return;
        }
        setSaving(true);
        try {
            const data = { noiDung: form.noiDung, ngayXacNhan: form.ngayXacNhan || null, ghiChu: form.ghiChu };
            if (editingId) await contraindicationService.updateContraindication(editingId, { ...data, trangThai: form.trangThai });
            else await contraindicationService.createContraindication({ ...data, maNguoiDan: Number(form.maNguoiDan), maCoSoTiem: Number(form.maCoSoTiem) });
            setMessage(editingId ? "Cập nhật chống chỉ định thành công." : "Thêm chống chỉ định thành công."); reset(); await loadData();
        } catch (failure) { setError(failure.response?.data?.message || "Không thể lưu chống chỉ định."); }
        finally { setSaving(false); }
    }
    if (loading) return <div className="text-center py-5" role="status">Đang tải chống chỉ định...</div>;
    return <div><div className="mb-4"><h2>Quản lý chống chỉ định</h2><p className="text-muted">Ghi nhận thông tin theo kết luận của nhân viên y tế tại cơ sở được phân công.</p></div>
        {message && <div className="alert alert-success" role="status">{message}</div>}{error && <div className="alert alert-danger" role="alert">{error}</div>}
        {!facilities.length && <div className="alert alert-info">Bạn chưa được phân công cơ sở. Vui lòng liên hệ quản trị viên để được cấp phạm vi quản lý.</div>}
        <section className="card shadow-sm mb-4"><div className="card-header"><strong>{editingId ? "Cập nhật chống chỉ định" : "Thêm chống chỉ định"}</strong></div><div className="card-body">
            <form onSubmit={submit}><fieldset disabled={saving}><div className="row g-3">
                <div className="col-md-6"><label className="form-label" htmlFor="contra-facility">Cơ sở xác nhận</label>
                    <select id="contra-facility" className="form-select" name="maCoSoTiem" value={form.maCoSoTiem} onChange={change} disabled={Boolean(editingId)} required>
                        <option value="">— Chọn cơ sở được phân công —</option>{facilities.filter(site => site.TrangThai || Number(site.MaCoSoTiem) === Number(form.maCoSoTiem)).map(site => <option key={site.MaCoSoTiem} value={site.MaCoSoTiem}>{site.TenCoSo}</option>)}</select>
                    <div className="form-text">Cơ sở và người dân được giữ nguyên sau khi ghi nhận.</div></div>
                <div className="col-md-6"><label className="form-label" htmlFor="contra-citizen">Người dân</label>
                    <select id="contra-citizen" className="form-select" name="maNguoiDan" value={form.maNguoiDan} onChange={change} disabled={Boolean(editingId)} required>
                        <option value="">— Chọn người dân —</option>{citizens.map(person => <option key={person.MaNguoiDan} value={person.MaNguoiDan}>{person.HoTen} — {person.CCCD || `#${person.MaNguoiDan}`}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="contra-date">Ngày xác nhận</label>
                    <input id="contra-date" className="form-control" type="date" name="ngayXacNhan" value={form.ngayXacNhan} onChange={change} />
                    <div className="form-text">Để trống để dùng thời điểm ghi nhận hiện tại.</div></div>
                {editingId && <div className="col-md-6"><label className="form-label" htmlFor="contra-status">Trạng thái</label>
                    <select id="contra-status" className="form-select" name="trangThai" value={form.trangThai} onChange={change}><option>Đã xác nhận</option><option>Đã hủy</option></select></div>}
                <div className="col-12"><label className="form-label" htmlFor="contra-content">Nội dung chống chỉ định</label>
                    <textarea id="contra-content" className="form-control" name="noiDung" rows="3" maxLength="2000" value={form.noiDung} onChange={change} required /></div>
                <div className="col-12"><label className="form-label" htmlFor="contra-note">Ghi chú</label>
                    <textarea id="contra-note" className="form-control" name="ghiChu" rows="2" maxLength="1000" value={form.ghiChu} onChange={change} /></div>
            </div></fieldset><div className="d-flex gap-2 mt-4"><button className="btn btn-primary" type="submit" disabled={saving || !facilities.length}><ShieldPlus size={17} className="me-2" />{saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm chống chỉ định"}</button>
                {editingId && <button className="btn btn-outline-secondary" type="button" onClick={reset} disabled={saving}>Hủy sửa</button>}</div></form>
        </div></section>
        <section className="card shadow-sm"><div className="card-header d-flex justify-content-between"><strong>Danh sách chống chỉ định</strong><span className="badge bg-primary">{rows.length} bản ghi</span></div><div className="card-body">
            {!rows.length ? <EmptyState title="Chưa có thông tin chống chỉ định" description="Thông tin thuộc cơ sở được phân công sẽ hiển thị tại đây." /> : <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Người dân</th><th>Cơ sở xác nhận</th><th>Nội dung</th><th>Ngày xác nhận</th><th>Người xác nhận</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                <tbody>{rows.map(item => <tr key={item.MaChongChiDinh}><td><strong>{item.HoTen || citizens.find(person => Number(person.MaNguoiDan) === Number(item.MaNguoiDan))?.HoTen}</strong><div className="small text-muted">#{item.MaChongChiDinh}</div></td>
                    <td><MapPin size={14} className="me-1" />{siteName(item)}</td><td>{item.NoiDung}{item.GhiChu && <div className="small text-muted">{item.GhiChu}</div>}</td>
                    <td>{formatDate(item.NgayXacNhan)}</td><td>{item.NguoiXacNhan || item.TenDangNhap || item.MaNguoiXacNhan || "—"}</td>
                    <td><span className={`badge ${item.TrangThai === "Đã xác nhận" ? "bg-success" : "bg-secondary"}`}>{item.TrangThai}</span></td>
                    <td><button className="btn btn-sm btn-outline-primary" type="button" disabled={saving} onClick={() => edit(item)}>Sửa</button></td></tr>)}</tbody></table></div>}
        </div></section>
    </div>;
}
