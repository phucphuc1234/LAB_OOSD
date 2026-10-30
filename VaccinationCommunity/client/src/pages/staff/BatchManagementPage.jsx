import { useEffect, useState } from "react";
import { MapPin, PackagePlus } from "lucide-react";
import { EmptyState } from "../../components/common/DashboardUI";
import batchService from "../../services/batchService";
import vaccineService from "../../services/vaccineService";
import { getFacilities } from "../../services/facilityService";

const emptyForm = () => ({ maLoVaccine: "", maVaccine: "", maCoSoTiem: "", ngaySanXuat: "", hanSuDung: "", soLuongNhap: 1, ghiChu: "" });
const inputDate = value => value ? String(value).slice(0, 10) : "";
const formatDate = value => value ? new Date(value).toLocaleDateString("vi-VN") : "—";
const statuses = ["Đang sử dụng", "Tạm ngừng", "Hết hàng", "Hết hạn"];
export default function BatchManagementPage() {
    const [batches, setBatches] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    async function loadData() {
        setLoading(true);
        try {
            const [stock, catalog, sites] = await Promise.all([batchService.getAllBatches(), vaccineService.getAllVaccines(), getFacilities()]);
            setBatches(stock.data || []); setVaccines(catalog.data || []); setFacilities(sites.data || []);
        } catch (failure) { setError(failure.response?.data?.message || "Không thể tải danh sách lô vaccine."); }
        finally { setLoading(false); }
    }
    useEffect(() => { loadData(); }, []);
    const change = event => setForm(previous => ({ ...previous, [event.target.name]: event.target.value }));
    const siteName = item => item.TenCoSo || facilities.find(site => Number(site.MaCoSoTiem) === Number(item.MaCoSoTiem))?.TenCoSo || "—";
    function edit(item) {
        setEditingId(item.MaLo); setForm({ maLoVaccine: item.MaLoVaccine || "", maVaccine: item.MaVaccine || "", maCoSoTiem: item.MaCoSoTiem || "",
            ngaySanXuat: inputDate(item.NgaySanXuat), hanSuDung: inputDate(item.HanSuDung), soLuongNhap: item.SoLuongNhap || 1, ghiChu: item.GhiChu || "" });
        setMessage(""); setError(""); window.scrollTo({ top: 0, behavior: "smooth" });
    }
    function reset() { setEditingId(null); setForm(emptyForm()); }
    async function submit(event) {
        event.preventDefault(); setError(""); setMessage("");
        if (!form.maCoSoTiem || !facilities.some(site => Number(site.MaCoSoTiem) === Number(form.maCoSoTiem))) {
            setError("Vui lòng chọn cơ sở tiêm thuộc phạm vi được phân công."); return;
        }
        setSaving(true);
        try {
            const data = { ...form, maVaccine: Number(form.maVaccine), maCoSoTiem: Number(form.maCoSoTiem), soLuongNhap: Number(form.soLuongNhap) };
            if (editingId) await batchService.updateBatch(editingId, data); else await batchService.createBatch(data);
            setMessage(editingId ? "Cập nhật lô vaccine thành công." : "Thêm lô vaccine thành công."); reset(); await loadData();
        } catch (failure) { setError(failure.response?.data?.message || "Không thể lưu lô vaccine."); }
        finally { setSaving(false); }
    }
    async function changeStatus(item, status) {
        setBusyId(item.MaLo); setMessage(""); setError("");
        try { await batchService.updateBatchStatus(item.MaLo, status); await loadData(); setMessage("Cập nhật trạng thái lô vaccine thành công."); }
        catch (failure) { setError(failure.response?.data?.message || "Không thể cập nhật trạng thái lô."); }
        finally { setBusyId(null); }
    }
    if (loading) return <div className="text-center py-5" role="status">Đang tải danh sách lô vaccine...</div>;
    return <div><div className="mb-4"><h2>Quản lý lô vaccine</h2><p className="text-muted">Tồn kho và liều giữ chỗ được theo dõi riêng theo từng cơ sở tiêm tại TP. Hồ Chí Minh.</p></div>
        {message && <div className="alert alert-success" role="status">{message}</div>}{error && <div className="alert alert-danger" role="alert">{error}</div>}
        {!facilities.length && <div className="alert alert-info">Bạn chưa có cơ sở tiêm trong phạm vi quản lý. Vui lòng liên hệ quản trị viên để được phân công.</div>}
        <section className="card shadow-sm mb-4"><div className="card-header"><strong>{editingId ? "Cập nhật lô vaccine" : "Thêm lô vaccine"}</strong></div><div className="card-body">
            <form onSubmit={submit}><div className="row g-3">
                <div className="col-12"><label className="form-label" htmlFor="batch-facility">Cơ sở tiêm</label>
                    <select id="batch-facility" className="form-select" name="maCoSoTiem" value={form.maCoSoTiem} onChange={change} required disabled={Boolean(editingId) || saving}>
                        <option value="">— Chọn cơ sở được phân công —</option>{facilities.filter(site => site.TrangThai || Number(site.MaCoSoTiem) === Number(form.maCoSoTiem)).map(site =>
                            <option key={site.MaCoSoTiem} value={site.MaCoSoTiem}>{site.TenCoSo} — {site.PhuongXa || site.TenKhuVuc}{!site.TrangThai ? " (ngừng hoạt động)" : ""}</option>)}</select>
                    <div className="form-text">Cơ sở của lô được giữ nguyên sau khi tạo; hệ thống không dùng chung tồn kho giữa các cơ sở.</div></div>
                <div className="col-md-6"><label className="form-label" htmlFor="batch-code">Mã lô vaccine</label>
                    <input id="batch-code" name="maLoVaccine" className="form-control" value={form.maLoVaccine} onChange={change} maxLength="50" required disabled={Boolean(editingId) || saving} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="batch-vaccine">Vaccine</label>
                    <select id="batch-vaccine" name="maVaccine" className="form-select" value={form.maVaccine} onChange={change} required disabled={Boolean(editingId) || saving}>
                        <option value="">— Chọn vaccine —</option>{vaccines.filter(item => item.TrangThai || Number(item.MaVaccine) === Number(form.maVaccine)).map(item => <option key={item.MaVaccine} value={item.MaVaccine}>{item.TenVaccine}</option>)}</select></div>
                <div className="col-md-4"><label className="form-label" htmlFor="batch-manufactured">Ngày sản xuất</label>
                    <input id="batch-manufactured" name="ngaySanXuat" className="form-control" type="date" value={form.ngaySanXuat} onChange={change} disabled={saving} /></div>
                <div className="col-md-4"><label className="form-label" htmlFor="batch-expiry">Hạn sử dụng</label>
                    <input id="batch-expiry" name="hanSuDung" className="form-control" type="date" value={form.hanSuDung} onChange={change} required disabled={saving} /></div>
                <div className="col-md-4"><label className="form-label" htmlFor="batch-quantity">Số lượng nhập</label>
                    <input id="batch-quantity" name="soLuongNhap" className="form-control" type="number" min="1" max="10000000" value={form.soLuongNhap} onChange={change} required disabled={Boolean(editingId) || saving} />
                    {editingId && <div className="form-text">Để nhập bổ sung, hãy tạo lô vaccine mới.</div>}</div>
                <div className="col-12"><label className="form-label" htmlFor="batch-note">Ghi chú</label>
                    <textarea id="batch-note" name="ghiChu" className="form-control" rows="2" maxLength="255" value={form.ghiChu} onChange={change} disabled={saving} /></div>
            </div><div className="d-flex gap-2 mt-4"><button className="btn btn-primary" type="submit" disabled={saving || !facilities.length}><PackagePlus size={17} className="me-2" />{saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm lô vaccine"}</button>
                {editingId && <button className="btn btn-outline-secondary" type="button" onClick={reset} disabled={saving}>Hủy</button>}</div></form>
        </div></section>
        <section className="card shadow-sm"><div className="card-header d-flex justify-content-between"><strong>Danh sách lô vaccine</strong><span className="badge bg-primary">{batches.length} lô</span></div>
            <div className="card-body">{!batches.length ? <EmptyState title="Chưa có lô vaccine" description="Chọn cơ sở được phân công và nhập lô vaccine để theo dõi tồn kho, hạn dùng." /> :
                <div className="table-responsive"><table className="table table-hover align-middle"><thead><tr><th>Mã lô / Vaccine</th><th>Cơ sở tiêm</th><th>Ngày SX / Hạn SD</th><th>SL nhập</th><th>SL còn</th><th>Giữ chỗ</th><th>Khả dụng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                    <tbody>{batches.map(item => <tr key={item.MaLo}><td><strong>{item.MaLoVaccine}</strong><div className="small text-muted">{item.TenVaccine}</div></td>
                        <td><MapPin size={14} className="me-1" />{siteName(item)}</td><td>{formatDate(item.NgaySanXuat)}<div className="small text-muted">{formatDate(item.HanSuDung)}</div></td>
                        <td>{item.SoLuongNhap}</td><td>{item.SoLuongCon}</td><td>{Number(item.SoLuongDatTruoc || 0)}</td><td><strong>{Math.max(0, Number(item.SoLuongCon) - Number(item.SoLuongDatTruoc || 0))}</strong></td>
                        <td><select className="form-select form-select-sm" aria-label={`Trạng thái lô ${item.MaLoVaccine}`} value={item.TrangThai} disabled={busyId !== null || saving}
                            onChange={event => changeStatus(item, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></td>
                        <td><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => edit(item)} disabled={saving || busyId !== null}>Sửa</button></td></tr>)}</tbody></table></div>}
            </div></section>
    </div>;
}
