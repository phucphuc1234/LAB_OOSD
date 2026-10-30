import { useCallback, useEffect, useState } from "react";
import { Building2, Check, MapPin, Plus, RefreshCw, Save, Search, ShieldCheck, UsersRound, X } from "lucide-react";
import { PageHeading, EmptyState } from "../../components/common/DashboardUI";
import { getAreas, getFacilities, createFacility, updateFacility, createArea, updateArea, getAssignments, assignFacilities } from "../../services/facilityService";

const CITY = "Thành phố Hồ Chí Minh";
const dataOf = response => response?.data ?? response;
const errorOf = error => error.response?.data?.message || "Chưa thể lưu thay đổi. Vui lòng thử lại.";
const blankFacility = { maKhuVuc: "", tenCoSo: "", diaChi: "", phuongXa: "", soDienThoai: "", trangThai: true, ghiChu: "" };

export default function FacilityManagementPage() {
    const [tab, setTab] = useState("facilities");
    const [areas, setAreas] = useState([]), [facilities, setFacilities] = useState([]);
    const [staff, setStaff] = useState([]), [assignments, setAssignments] = useState([]);
    const [search, setSearch] = useState("");
    const [areaFilter, setAreaFilter] = useState("");
    const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
    const [error, setError] = useState(""), [success, setSuccess] = useState("");
    const [editing, setEditing] = useState(null), [form, setForm] = useState(blankFacility);
    const [areaEditing, setAreaEditing] = useState(null), [areaForm, setAreaForm] = useState({ tenKhuVuc: "", trangThai: true });
    const [selectedStaff, setSelectedStaff] = useState("");
    const [selectedFacilities, setSelectedFacilities] = useState([]);
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const [a, f, s] = await Promise.all([getAreas({ includeInactive: 1 }), getFacilities({ includeInactive: 1 }), getAssignments()]);
            setAreas(dataOf(a) || []); setFacilities(dataOf(f) || []);
            const scoped = dataOf(s) || {}; setStaff(scoped.staff || []); setAssignments(scoped.assignments || []);
        } catch (e) { setError(errorOf(e)); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        setSelectedFacilities(assignments.filter(row => Number(row.MaTaiKhoan) === Number(selectedStaff)).map(row => Number(row.MaCoSoTiem)));
    }, [selectedStaff, assignments]);
    const beginFacility = row => {
        setSuccess(""); setError("");
        setEditing(row?.MaCoSoTiem || "new");
        setForm(row ? { maKhuVuc: String(row.MaKhuVuc), tenCoSo: row.TenCoSo, diaChi: row.DiaChi, phuongXa: row.PhuongXa || "", soDienThoai: row.SoDienThoai || "", trangThai: Boolean(row.TrangThai), ghiChu: row.GhiChu || "" } : { ...blankFacility });
    };
    const field = (name, value) => setForm(current => ({ ...current, [name]: value }));
    const saveFacility = async event => {
        event.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            const payload = { ...form, maKhuVuc: Number(form.maKhuVuc) };
            if (editing === "new") await createFacility(payload); else await updateFacility(editing, payload);
            setEditing(null); await load(); setSuccess("Đã lưu cơ sở tiêm. Người dân chỉ chọn được cơ sở đang hoạt động và có vaccine phù hợp.");
        } catch (e) { setError(errorOf(e)); } finally { setSaving(false); }
    };
    const saveArea = async event => {
        event.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            if (areaEditing === "new") await createArea(areaForm); else await updateArea(areaEditing, areaForm);
            setAreaEditing(null); await load(); setSuccess("Đã lưu khu vực phục vụ.");
        } catch (e) { setError(errorOf(e)); } finally { setSaving(false); }
    };
    const toggleFacility = id => setSelectedFacilities(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    const saveAssignment = async event => {
        event.preventDefault(); setSaving(true); setError(""); setSuccess("");
        try {
            await assignFacilities(Number(selectedStaff), { maCoSoTiemIds: selectedFacilities });
            await load(); setSuccess("Đã cập nhật phân công. Phạm vi dữ liệu được kiểm tra lại ở mỗi yêu cầu.");
        } catch (e) { setError(errorOf(e)); } finally { setSaving(false); }
    };
    const filtered = facilities.filter(row => (!areaFilter || Number(row.MaKhuVuc) === Number(areaFilter)) && `${row.TenCoSo} ${row.DiaChi} ${row.PhuongXa}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")));
    return <div className="facility-page">
        <PageHeading eyebrow="MẠNG LƯỚI TIÊM CHỦNG · TP. HỒ CHÍ MINH" title="Cơ sở & phân công" description="Quản lý điểm tiêm, khu vực phục vụ và phạm vi phụ trách của từng nhân viên.">
            <button className="btn btn-outline-secondary" type="button" onClick={load} disabled={loading || saving}><RefreshCw size={16} className={loading ? "loading-spinner" : ""} />Tải lại</button>
        </PageHeading>
        <div className="facility-network-banner"><div className="network-mark"><Building2 size={30} /></div><div><span className="page-eyebrow">KẾT NỐI CHĂM SÓC CỘNG ĐỒNG</span><h2>Một thành phố. Một mạng lưới chăm sóc.</h2><p>Cơ sở tiêm thuộc TP. Hồ Chí Minh. Mỗi nhân viên có thể được giao nhiều cơ sở trong các khu vực phục vụ.</p></div><span className="network-city"><MapPin size={16} />TP. Hồ Chí Minh</span></div>
        <div className="facility-kpis"><div><Building2 size={21} /><strong>{facilities.filter(row => row.TrangThai).length}</strong><span>Cơ sở hoạt động</span></div><div><MapPin size={21} /><strong>{areas.length}</strong><span>Khu vực phục vụ</span></div><div><UsersRound size={21} /><strong>{staff.length}</strong><span>Nhân viên</span></div><div><ShieldCheck size={21} /><strong>{new Set(assignments.map(row => row.MaTaiKhoan)).size}</strong><span>Nhân viên đã phân công</span></div></div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status"><Check size={16} className="me-2" />{success}</div>}
        <nav className="facility-tabs" aria-label="Quản lý mạng lưới">
            {[['facilities', 'Cơ sở tiêm', Building2], ['areas', 'Khu vực phục vụ', MapPin], ['assignments', 'Phân công nhân viên', UsersRound]].map(([key, label, Icon]) => <button key={key} type="button" aria-current={tab === key ? "page" : undefined} className={tab === key ? "active" : ""} onClick={() => { setTab(key); setEditing(null); setAreaEditing(null); setError(""); setSuccess(""); }}><Icon size={17} />{label}</button>)}
        </nav>
        {loading && <div className="facility-loading" role="status">Đang tải mạng lưới tiêm chủng…</div>}
        {!loading && tab === "facilities" && <>
            <div className="facility-toolbar"><label className="facility-search"><Search size={17} /><span className="visually-hidden">Tìm cơ sở tiêm</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên cơ sở, địa chỉ…" /></label><select className="form-select" aria-label="Lọc theo khu vực" value={areaFilter} onChange={event => setAreaFilter(event.target.value)}><option value="">Tất cả khu vực</option>{areas.map(row => <option key={row.MaKhuVuc} value={row.MaKhuVuc}>{row.TenKhuVuc}</option>)}</select><button className="btn btn-primary" type="button" onClick={() => beginFacility(null)}><Plus size={17} />Thêm cơ sở</button></div>
            {editing !== null && <section className="panel facility-editor" aria-label={editing === "new" ? "Thêm cơ sở tiêm" : "Sửa cơ sở tiêm"}><div className="panel-header"><h2>{editing === "new" ? "Thêm cơ sở tiêm" : "Cập nhật cơ sở tiêm"}</h2><button type="button" className="icon-button" aria-label="Đóng biểu mẫu" disabled={saving} onClick={() => setEditing(null)}><X size={18} /></button></div><form className="panel-body" onSubmit={saveFacility}><div className="row g-3">
                <div className="col-md-8"><label className="form-label" htmlFor="facility-name">Tên cơ sở *</label><input id="facility-name" className="form-control" value={form.tenCoSo} onChange={event => field("tenCoSo", event.target.value)} maxLength={150} required /></div>
                <div className="col-md-4"><label className="form-label" htmlFor="facility-area">Khu vực phục vụ *</label><select id="facility-area" className="form-select" value={form.maKhuVuc} onChange={event => field("maKhuVuc", event.target.value)} required><option value="">Chọn khu vực</option>{areas.filter(row => row.TrangThai || Number(form.maKhuVuc) === row.MaKhuVuc).map(row => <option key={row.MaKhuVuc} value={row.MaKhuVuc}>{row.TenKhuVuc}{!row.TrangThai ? " (tạm ngừng)" : ""}</option>)}</select></div>
                <div className="col-md-8"><label className="form-label" htmlFor="facility-address">Địa chỉ *</label><input id="facility-address" className="form-control" value={form.diaChi} onChange={event => field("diaChi", event.target.value)} maxLength={255} required /></div>
                <div className="col-md-4"><label className="form-label" htmlFor="facility-ward">Phường / xã *</label><input id="facility-ward" className="form-control" value={form.phuongXa} onChange={event => field("phuongXa", event.target.value)} maxLength={100} required /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="facility-city">Tỉnh / thành phố</label><input id="facility-city" className="form-control" value={CITY} readOnly /><div className="form-text">Phạm vi phục vụ được cố định tại TP. Hồ Chí Minh.</div></div>
                <div className="col-md-6"><label className="form-label" htmlFor="facility-phone">Điện thoại cơ sở</label><input id="facility-phone" type="tel" className="form-control" value={form.soDienThoai} onChange={event => field("soDienThoai", event.target.value)} maxLength={20} /></div>
                <div className="col-12"><label className="form-label" htmlFor="facility-note">Ghi chú</label><textarea id="facility-note" className="form-control" value={form.ghiChu} onChange={event => field("ghiChu", event.target.value)} maxLength={1000} /></div>
                <div className="col-12"><label className="facility-checkbox"><input type="checkbox" checked={form.trangThai} onChange={event => field("trangThai", event.target.checked)} />Đang hoạt động</label></div>
            </div><div className="facility-form-actions"><button className="btn btn-outline-secondary" type="button" onClick={() => setEditing(null)} disabled={saving}>Hủy</button><button className="btn btn-primary" disabled={saving}><Save size={16} />{saving ? "Đang lưu…" : "Lưu cơ sở"}</button></div></form></section>}
            <div className="facility-grid">{filtered.map(row => <article className={`facility-card${!row.TrangThai ? " facility-inactive" : ""}`} key={row.MaCoSoTiem}><div className="facility-card-top"><span className="facility-card-icon"><Building2 size={25} /></span><span className={`status-pill ${row.TrangThai ? "status-success" : "status-warning"}`}>{row.TrangThai ? "Hoạt động" : "Tạm ngừng"}</span></div><small className="page-eyebrow">{row.TenKhuVuc}</small><h3>{row.TenCoSo}</h3><p><MapPin size={15} />{[row.DiaChi, row.PhuongXa, row.TinhThanh].filter(Boolean).join(", ")}</p>{row.SoDienThoai && <a href={`tel:${row.SoDienThoai}`}>{row.SoDienThoai}</a>}<div className="facility-card-footer"><span>Mã cơ sở #{row.MaCoSoTiem}</span><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => beginFacility(row)}>Chỉnh sửa</button></div></article>)}</div>
            {!filtered.length && <EmptyState icon={Building2} title="Chưa tìm thấy cơ sở" description="Thử đổi bộ lọc hoặc thêm cơ sở tiêm trong TP. Hồ Chí Minh." />}
        </>}
        {!loading && tab === "areas" && <section className="panel"><div className="panel-header"><div><h2>Khu vực phục vụ</h2><p>Nhóm nội bộ để tổ chức cơ sở và phân công; không thay thế danh mục hành chính chính thức.</p></div><button className="btn btn-primary" type="button" onClick={() => { setAreaEditing("new"); setAreaForm({ tenKhuVuc: "", trangThai: true }); }}><Plus size={16} />Thêm khu vực</button></div><div className="panel-body">
            {areaEditing !== null && <form onSubmit={saveArea} className="facility-area-form"><div><label className="form-label" htmlFor="area-name">Tên khu vực *</label><input id="area-name" className="form-control" value={areaForm.tenKhuVuc} onChange={event => setAreaForm(current => ({ ...current, tenKhuVuc: event.target.value }))} maxLength={100} required /></div><label className="facility-checkbox"><input type="checkbox" checked={areaForm.trangThai} onChange={event => setAreaForm(current => ({ ...current, trangThai: event.target.checked }))} />Hoạt động</label><button className="btn btn-primary" disabled={saving}>Lưu</button><button className="btn btn-outline-secondary" type="button" disabled={saving} onClick={() => setAreaEditing(null)}>Hủy</button></form>}
            <div className="table-responsive"><table className="table"><thead><tr><th>Khu vực</th><th>Phạm vi</th><th>Số cơ sở</th><th>Trạng thái</th><th><span className="visually-hidden">Thao tác</span></th></tr></thead><tbody>{areas.map(row => <tr key={row.MaKhuVuc}><td><strong>{row.TenKhuVuc}</strong></td><td>{CITY}</td><td>{facilities.filter(f => f.MaKhuVuc === row.MaKhuVuc).length}</td><td>{row.TrangThai ? "Hoạt động" : "Tạm ngừng"}</td><td><button className="btn btn-sm btn-outline-primary" type="button" onClick={() => { setAreaEditing(row.MaKhuVuc); setAreaForm({ tenKhuVuc: row.TenKhuVuc, trangThai: Boolean(row.TrangThai) }); }}>Chỉnh sửa</button></td></tr>)}</tbody></table></div></div></section>}
        {!loading && tab === "assignments" && <section className="panel"><div className="panel-header"><div><h2>Phân công phạm vi phụ trách</h2><p>Chọn nhân viên, sau đó chọn một hoặc nhiều cơ sở. Bỏ chọn tất cả để thu hồi toàn bộ phân công.</p></div><UsersRound size={24} /></div><form className="panel-body" onSubmit={saveAssignment}><label className="form-label" htmlFor="assignment-staff">Nhân viên y tế</label><select id="assignment-staff" className="form-select facility-staff-select" value={selectedStaff} onChange={event => setSelectedStaff(event.target.value)} required><option value="">Chọn nhân viên cần phân công</option>{staff.map(row => <option key={row.MaTaiKhoan} value={row.MaTaiKhoan}>{row.HoTen || row.TenDangNhap} · {row.TenDangNhap}</option>)}</select>
            {selectedStaff && <><div className="facility-assignment-summary"><ShieldCheck size={18} /><span>Đã chọn <strong>{selectedFacilities.length}</strong> cơ sở. Nhân viên chỉ xem và xử lý hồ sơ trong phạm vi được giao.</span></div><div className="assignment-areas">{areas.map(area => {
                const group = facilities.filter(row => row.MaKhuVuc === area.MaKhuVuc);
                return <fieldset className="assignment-group" key={area.MaKhuVuc}><legend><MapPin size={17} />{area.TenKhuVuc}{!area.TrangThai ? " (tạm ngừng)" : ""}</legend>{group.length ? group.map(row => {
                    const wasAssigned = assignments.some(item => Number(item.MaTaiKhoan) === Number(selectedStaff) && Number(item.MaCoSoTiem) === Number(row.MaCoSoTiem));
                    const inactive = !row.TrangThai || !area.TrangThai;
                    return <label key={row.MaCoSoTiem} className={`assignment-choice${selectedFacilities.includes(row.MaCoSoTiem) ? " selected" : ""}${inactive && !wasAssigned ? " assignment-unavailable" : ""}`}><input type="checkbox" checked={selectedFacilities.includes(row.MaCoSoTiem)} onChange={() => toggleFacility(row.MaCoSoTiem)} disabled={inactive && !wasAssigned} /><span><strong>{row.TenCoSo}</strong><small>{row.DiaChi}{inactive ? wasAssigned ? " · Tạm ngừng, có thể giữ hoặc gỡ phân công cũ" : " · Tạm ngừng, chưa thể phân công mới" : ""}</small></span></label>;
                }) : <p className="text-muted">Khu vực chưa có cơ sở.</p>}</fieldset>;
            })}</div><div className="facility-form-actions"><button className="btn btn-primary" disabled={saving}><Save size={16} />{saving ? "Đang lưu…" : "Lưu phân công"}</button></div></>}
        </form></section>}
    </div>;
}
