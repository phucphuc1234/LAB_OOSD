import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";

import batchService
    from "../../services/batchService";

import vaccineService
    from "../../services/vaccineService";


function BatchManagementPage() {

    const emptyForm = {
        maLoVaccine: "",
        maVaccine: "",
        ngaySanXuat: "",
        hanSuDung: "",
        soLuongNhap: 1,
        ghiChu: "",
    };


    const [batches, setBatches] =
        useState([]);

    const [vaccines, setVaccines] =
        useState([]);

    const [formData, setFormData] =
        useState(emptyForm);

    const [editingId, setEditingId] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                batchResponse,
                vaccineResponse
            ] = await Promise.all([
                batchService.getAllBatches(),
                vaccineService.getAllVaccines(),
            ]);

            setBatches(
                batchResponse.data || []
            );

            setVaccines(
                vaccineResponse.data || []
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải dữ liệu."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);


    const handleChange = (e) => {

        const { name, value } =
            e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const formatInputDate = (date) => {

        if (!date) return "";

        return String(date)
            .substring(0, 10);
    };


    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date)
            .toLocaleDateString("vi-VN");
    };


    const handleEdit = (item) => {

        setEditingId(
            item.MaLo
        );

        setFormData({
            maLoVaccine:
                item.MaLoVaccine || "",

            maVaccine:
                item.MaVaccine || "",

            ngaySanXuat:
                formatInputDate(
                    item.NgaySanXuat
                ),

            hanSuDung:
                formatInputDate(
                    item.HanSuDung
                ),

            soLuongNhap:
                item.SoLuongNhap || 1,

            ghiChu:
                item.GhiChu || "",
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const handleCancel = () => {

        setEditingId(null);

        setFormData(
            emptyForm
        );

        setMessage("");
        setError("");
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);
            setMessage("");
            setError("");

            const data = {
                ...formData,

                maVaccine:
                    Number(
                        formData.maVaccine
                    ),

                soLuongNhap:
                    Number(
                        formData.soLuongNhap
                    ),
            };


            if (editingId) {

                await batchService
                    .updateBatch(
                        editingId,
                        data
                    );

                setMessage(
                    "Cập nhật lô vaccine thành công."
                );

            } else {

                await batchService
                    .createBatch(data);

                setMessage(
                    "Thêm lô vaccine thành công."
                );
            }


            setEditingId(null);

            setFormData(
                emptyForm
            );

            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể lưu lô vaccine."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleStatus = async (
        item,
        newStatus
    ) => {

        try {

            setError("");
            setMessage("");

            await batchService
                .updateBatchStatus(
                    item.MaLo,
                    newStatus
                );

            setMessage(
                "Cập nhật trạng thái lô vaccine thành công."
            );

            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể cập nhật trạng thái."
            );
        }
    };


    if (loading) {

        return (
            <div className="text-center py-5">
                Đang tải danh sách lô vaccine...
            </div>
        );
    }


    return (
        <div>

            <div className="mb-4">

                <h2>
                    Quản lý lô vaccine
                </h2>

                <p className="text-muted">
                    Theo dõi lô, hạn sử dụng
                    và số lượng vaccine
                </p>

            </div>


            {message && (
                <div className="alert alert-success" role="status">
                    {message}
                </div>
            )}


            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}


            <div className="card shadow-sm mb-4">

                <div className="card-header">

                    <strong>
                        {editingId
                            ? "Cập nhật lô Vaccine"
                            : "Thêm lô Vaccine"}
                    </strong>

                </div>


                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">


                            <div className="col-md-6 mb-3">

                                <label htmlFor="batchmanagementpage-maLoVaccine" className="form-label">
                                    Mã lô vaccine
                                </label>

                                <input id="batchmanagementpage-maLoVaccine"
                                    type="text"
                                    className="form-control"
                                    name="maLoVaccine"
                                    disabled={!!editingId}
                                    value={
                                        formData.maLoVaccine
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="col-md-6 mb-3">

                                <label htmlFor="batchmanagementpage-maVaccine" className="form-label">
                                    Vaccine
                                </label>

                                <select id="batchmanagementpage-maVaccine"
                                    className="form-select"
                                    name="maVaccine"
                                    disabled={!!editingId}
                                    value={
                                        formData.maVaccine
                                    }
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        -- Chọn vaccine --
                                    </option>

                                    {vaccines
                                        .filter(
                                            (item) =>
                                                item.TrangThai
                                        )
                                        .map(
                                            (item) => (

                                                <option
                                                    key={
                                                        item.MaVaccine
                                                    }
                                                    value={
                                                        item.MaVaccine
                                                    }
                                                >
                                                    {
                                                        item.TenVaccine
                                                    }
                                                </option>

                                            )
                                        )}

                                </select>

                            </div>


                            <div className="col-md-4 mb-3">

                                <label htmlFor="batchmanagementpage-ngaySanXuat" className="form-label">
                                    Ngày sản xuất
                                </label>

                                <input id="batchmanagementpage-ngaySanXuat"
                                    type="date"
                                    className="form-control"
                                    name="ngaySanXuat"
                                    value={
                                        formData.ngaySanXuat
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="col-md-4 mb-3">

                                <label htmlFor="batchmanagementpage-hanSuDung" className="form-label">
                                    Hạn sử dụng
                                </label>

                                <input id="batchmanagementpage-hanSuDung"
                                    type="date"
                                    className="form-control"
                                    name="hanSuDung"
                                    value={
                                        formData.hanSuDung
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="col-md-4 mb-3">

                                <label htmlFor="batchmanagementpage-soLuongNhap" className="form-label">
                                    Số lượng nhập
                                </label>

                                <input id="batchmanagementpage-soLuongNhap"
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    name="soLuongNhap"
                                    disabled={!!editingId}
                                    value={
                                        formData.soLuongNhap
                                    }
                                    onChange={handleChange}
                                    required
                                />
                                {editingId && <div className="form-text">Số lượng nhập được giữ nguyên sau khi tạo lô. Để nhập bổ sung, hãy tạo lô vaccine mới.</div>}

                            </div>


                            <div className="col-12 mb-3">

                                <label htmlFor="batchmanagementpage-ghiChu" className="form-label">
                                    Ghi chú
                                </label>

                                <textarea id="batchmanagementpage-ghiChu"
                                    className="form-control"
                                    rows="3"
                                    name="ghiChu"
                                    value={
                                        formData.ghiChu
                                    }
                                    onChange={handleChange}
                                />

                            </div>

                        </div>


                        <button
                            type="submit"
                            className="btn btn-success me-2"
                            disabled={saving}
                        >
                            {saving
                                ? "Đang lưu..."
                                : editingId
                                    ? "Cập nhật"
                                    : "Thêm lô vaccine"}
                        </button>


                        {editingId && (

                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                            >
                                Hủy
                            </button>

                        )}

                    </form>

                </div>

            </div>


            <div className="card shadow-sm">

                <div className="card-header d-flex justify-content-between">

                    <strong>
                        Danh sách lô Vaccine
                    </strong>

                    <span className="badge bg-success">
                        {batches.length} lô
                    </span>

                </div>


                <div className="card-body">

                    {batches.length === 0 ? (

                        <EmptyState title="Chưa có lô vaccine" description="Nhập thông tin lô vaccine để theo dõi số lượng, hạn dùng và lịch sử sử dụng." />

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã</th>
                                        <th>Mã lô</th>
                                        <th>Vaccine</th>
                                        <th>Ngày SX</th>
                                        <th>Hạn SD</th>
                                        <th>SL nhập</th>
                                        <th>SL còn</th>
                                        <th>Giữ chỗ</th>
                                        <th>Khả dụng</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {batches.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaLo
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaLo
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            item.MaLoVaccine
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    {
                                                        item.TenVaccine ||
                                                        item.MaVaccine
                                                    }
                                                </td>


                                                <td>
                                                    {formatDate(
                                                        item.NgaySanXuat
                                                    )}
                                                </td>


                                                <td>
                                                    {formatDate(
                                                        item.HanSuDung
                                                    )}
                                                </td>


                                                <td>
                                                    {
                                                        item.SoLuongNhap
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            item.SoLuongCon > 0
                                                                ? "badge bg-primary"
                                                                : "badge bg-danger"
                                                        }
                                                    >
                                                        {
                                                            item.SoLuongCon
                                                        }
                                                    </span>

                                                </td>


                                                <td>{Number(item.SoLuongDatTruoc || 0)}</td>
                                                <td>{Math.max(0, Number(item.SoLuongCon) - Number(item.SoLuongDatTruoc || 0))}</td>

                                                <td>

                                                    <span className="badge bg-secondary">
                                                        {
                                                            item.TrangThai
                                                        }
                                                    </span>

                                                </td>


                                                <td>

                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() =>
                                                            handleEdit(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Sửa
                                                    </button>


                                                    <select
                                                        className="form-select form-select-sm d-inline-block"
                                                        style={{
                                                            width: "145px"
                                                        }}
                                                        value={
                                                            item.TrangThai
                                                        }
                                                        onChange={(e) =>
                                                            handleStatus(
                                                                item,
                                                                e.target.value
                                                            )
                                                        }
                                                    >

                                                        <option value="Đang sử dụng">
                                                            Đang sử dụng
                                                        </option>

                                                        <option value="Tạm ngừng">
                                                            Tạm ngừng
                                                        </option>

                                                        <option value="Hết hàng">
                                                            Hết hàng
                                                        </option>

                                                        <option value="Hết hạn">
                                                            Hết hạn
                                                        </option>

                                                    </select>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default BatchManagementPage;
