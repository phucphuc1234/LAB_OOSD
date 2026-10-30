import { useCallback, useEffect, useState } from "react";
import { Building2, Check, MapPin, RefreshCw, ShieldCheck, Syringe } from "lucide-react";
import { EmptyState, PageHeading } from "../../components/common/DashboardUI";
import { getFacilities, getFacilityVaccines, setFacilityVaccine } from "../../services/facilityService";

const dataOf = response => response?.data ?? response;
const messageOf = error => error.response?.data?.message || "Không tải được thông tin cơ sở. Vui lòng thử lại.";
export default function FacilityWorkspacePage() {
    const [facilities, setFacilities] = useState([]), [selectedId, setSelectedId] = useState("");
    const [vaccines, setVaccines] = useState([]);
    const [loading, setLoading] = useState(true), [vaccinesLoading, setVaccinesLoading] = useState(false), [saving, setSaving] = useState(null);
    const [error, setError] = useState(""), [success, setSuccess] = useState("");
    const [version, setVersion] = useState(0);
    const selected = facilities.find(row => Number(row.MaCoSoTiem) === Number(selectedId));
    const canEnableOffering = Boolean(selected?.TrangThai) && selected?.KhuVucHoatDong !== false && selected?.KhuVucHoatDong !== 0;
    const load = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const rows = dataOf(await getFacilities()) || []; setFacilities(rows);
            setSelectedId(current => rows.some(row => Number(row.MaCoSoTiem) === Number(current)) ? current : rows.length ? String(rows[0].MaCoSoTiem) : "");
        } catch (failure) { setError(messageOf(failure)); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (!selectedId) { setVaccines([]); return; }
        let cancelled = false; setVaccinesLoading(true); setVaccines([]); setError("");
        getFacilityVaccines(selectedId).then(response => { if (!cancelled) setVaccines(dataOf(response) || []); })
            .catch(failure => { if (!cancelled) setError(messageOf(failure)); })
            .finally(() => { if (!cancelled) setVaccinesLoading(false); });
        return () => { cancelled = true; };
    }, [selectedId, version]);
    const toggle = async row => {
        if (saving !== null) return;
        setSaving(row.MaVaccine); setError(""); setSuccess("");
        setVaccines(current => current.map(item => item.MaVaccine === row.MaVaccine ? { ...item, TrangThai: !Boolean(row.TrangThai) } : item));
        try {
            await setFacilityVaccine(selectedId, row.MaVaccine, { trangThai: !Boolean(row.TrangThai) });
            setSuccess(`Đã ${row.TrangThai ? "ngừng" : "bật"} tiếp nhận ${row.TenVaccine} tại cơ sở đã chọn.`);

        } catch (failure) {
            setVaccines(current => current.map(item => item.MaVaccine === row.MaVaccine ? { ...item, TrangThai: row.TrangThai } : item));
            setError(messageOf(failure));
        } finally { setSaving(null); }
    };
    return <div className="facility-page">
        <PageHeading eyebrow="PHẠM VI PHỤ TRÁCH · TP. HỒ CHÍ MINH" title="Cơ sở phụ trách" description="Danh sách cơ sở được cấp quyền và các vaccine tiếp nhận tại từng điểm tiêm.">
            <button type="button" className="btn btn-outline-secondary" onClick={() => { load(); setVersion(current => current + 1); }} disabled={loading || saving !== null}><RefreshCw size={16} />Tải lại</button>
        </PageHeading>
        <div className="facility-network-banner"><div className="network-mark"><ShieldCheck size={30} /></div><div><span className="page-eyebrow">ĐÚNG CƠ SỞ · ĐÚNG PHẠM VI</span><h2>Chăm sóc từ điểm tiêm của bạn.</h2><p>Người dân chọn cơ sở trong danh mục. Vaccine chỉ được đặt lịch khi cơ sở còn hoạt động, có tiếp nhận và còn liều phù hợp.</p></div></div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status"><Check size={16} className="me-2" />{success}</div>}
        {loading ? <div className="facility-loading" role="status">Đang tải cơ sở được phụ trách…</div> : !facilities.length ? <section className="panel"><EmptyState icon={Building2} title="Chưa có cơ sở được phân công" description="Liên hệ quản trị viên để được phân công cơ sở. Hồ sơ, lịch tiêm và theo dõi sau tiêm sẽ hiển thị theo phạm vi được cấp." /></section> : <>
            <section className="panel mb-4"><div className="panel-body"><label className="form-label" htmlFor="workspace-facility">Cơ sở đang làm việc</label><select id="workspace-facility" className="form-select" value={selectedId} onChange={event => { setSelectedId(event.target.value); setSuccess(""); }} disabled={saving !== null}>{facilities.map(row => <option key={row.MaCoSoTiem} value={row.MaCoSoTiem}>{row.TenCoSo}{!row.TrangThai ? " (tạm ngừng)" : ""}</option>)}</select>
                {selected && <div className="workspace-facility-details"><span className="facility-card-icon"><Building2 size={26} /></span><div><small className="page-eyebrow">{selected.TenKhuVuc}</small><h2>{selected.TenCoSo}</h2><p><MapPin size={15} />{[selected.DiaChi, selected.PhuongXa, selected.TinhThanh].filter(Boolean).join(", ")}</p>{selected.SoDienThoai && <a href={`tel:${selected.SoDienThoai}`}>{selected.SoDienThoai}</a>}</div><span className={`status-pill ${selected.TrangThai ? "status-success" : "status-warning"}`}>{selected.TrangThai ? "Hoạt động" : "Tạm ngừng"}</span></div>}
            </div></section>
            {!canEnableOffering && <div className="alert alert-warning">Cơ sở hoặc khu vực đang tạm ngừng. Bạn vẫn có thể xem danh mục và ngừng tiếp nhận vaccine; chưa thể bật tiếp nhận mới.</div>}
            <section className="panel"><div className="panel-header"><div><h2>Vaccine tiếp nhận tại cơ sở</h2><p>Bật vaccine trong danh mục, sau đó nhập lô đúng cơ sở để cung cấp liều có thể đặt lịch.</p></div><Syringe size={24} /></div><div className="panel-body">
                {vaccinesLoading ? <p role="status" className="text-muted">Đang tải danh mục tiếp nhận…</p> : !vaccines.length ? <EmptyState icon={Syringe} title="Chưa có vaccine trong danh mục" description="Thêm vaccine trong danh mục để cấu hình tiếp nhận tại cơ sở." /> : <div className="offering-grid">{vaccines.map(row => <div className={`offering-card${row.TrangThai ? " offering-active" : ""}`} key={row.MaVaccine}><span className="offering-icon"><Syringe size={21} /></span><div><strong>{row.TenVaccine}</strong><small>{row.VaccineHoatDong === false || row.VaccineHoatDong === 0 ? "Vaccine đang ngừng sử dụng" : row.TrangThai ? "Đang tiếp nhận" : "Chưa tiếp nhận"}</small></div><label className="offering-switch"><input type="checkbox" checked={Boolean(row.TrangThai)} onChange={() => toggle(row)} disabled={saving !== null || ((!canEnableOffering || (!row.VaccineHoatDong && row.VaccineHoatDong !== undefined)) && !row.TrangThai)} aria-label={`${row.TrangThai ? "Ngừng" : "Bật"} tiếp nhận ${row.TenVaccine}`} /><span /></label></div>)}</div>}
            </div></section>
        </>}
    </div>;
}
