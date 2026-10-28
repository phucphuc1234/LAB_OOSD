import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";
import vaccineService
    from "../../services/vaccineService";

function VaccineManagementPage() {
    const emptyForm = {
        tenVaccine: "",
        loaiVaccine: "",
        nhaSanXuat: "",
        moTa: "",
        soMuiKhuyenNghi: 1,
        khoangCachMui: 0,
    };

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

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");


    const loadVaccines = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await vaccineService
                    .getAllVaccines();

            setVaccines(
                response.data || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải danh sách vaccine."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadVaccines();
    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleEdit = (item) => {
        setEditingId(item.MaVaccine);

        setFormData({
            tenVaccine:
                item.TenVaccine || "",

            loaiVaccine:
                item.LoaiVaccine || "",

            nhaSanXuat:
                item.NhaSanXuat || "",

            moTa:
                item.MoTa || "",

            soMuiKhuyenNghi:
                item.SoMuiKhuyenNghi || 1,

            khoangCachMui:
                item.KhoangCachMui || 0,
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
        setFormData(emptyForm);
        setError("");
        setMessage("");
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const data = {
                ...formData,

                soMuiKhuyenNghi:
                    Number(
                        formData.soMuiKhuyenNghi
                    ),

                khoangCachMui:
                    Number(
                        formData.khoangCachMui
                    ),
            };

            if (editingId) {
                await vaccineService
                    .updateVaccine(
                        editingId,
                        data
                    );

                setMessage(
                    "Cập nhật vaccine thành công."
                );
            } else {
                await vaccineService
                    .createVaccine(data);

                setMessage(
                    "Thêm vaccine thành công."
                );
            }

            setEditingId(null);
            setFormData(emptyForm);

            await loadVaccines();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể lưu vaccine."
            );
        } finally {
            setSaving(false);
        }
    };


    const handleStatus = async (item) => {
        try {
            setError("");
            setMessage("");

            const newStatus =
                !item.TrangThai;

            await vaccineService
                .updateVaccineStatus(
                    item.MaVaccine,
                    newStatus
                );

            setMessage(
                "Cập nhật trạng thái vaccine thành công."
            );

            await loadVaccines();

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
                Đang tải danh sách vaccine...
            </div>
        );
    }


    return (
        <div>

            <div className="mb-4">
                <h2>Quản lý vaccine</h2>

                <p className="text-muted">
                    Thêm, chỉnh sửa và quản lý
                    trạng thái vaccine
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
                            ? "Cập nhật Vaccine"
                            : "Thêm Vaccine"}
                    </strong>
                </div>

                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">

                            <div className="col-md-6 mb-3">
                                <label htmlFor="vaccinemanagementpage-tenVaccine" className="form-label">
                                    Tên vaccine
                                </label>

                                <input id="vaccinemanagementpage-tenVaccine"
                                    type="text"
                                    className="form-control"
                                    name="tenVaccine"
                                    value={
                                        formData.tenVaccine
                                    }
                                    onChange={handleChange}
                                    required
                                />
                            </div>


                            <div className="col-md-6 mb-3">
                                <label htmlFor="vaccinemanagementpage-loaiVaccine" className="form-label">
                                    Loại vaccine
                                </label>

                                <input id="vaccinemanagementpage-loaiVaccine"
                                    type="text"
                                    className="form-control"
                                    name="loaiVaccine"
                                    value={
                                        formData.loaiVaccine
                                    }
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="col-md-6 mb-3">
                                <label htmlFor="vaccinemanagementpage-nhaSanXuat" className="form-label">
                                    Nhà sản xuất
                                </label>

                                <input id="vaccinemanagementpage-nhaSanXuat"
                                    type="text"
                                    className="form-control"
                                    name="nhaSanXuat"
                                    value={
                                        formData.nhaSanXuat
                                    }
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="col-md-3 mb-3">
                                <label htmlFor="vaccinemanagementpage-soMuiKhuyenNghi" className="form-label">
                                    Số mũi khuyến nghị
                                </label>

                                <input id="vaccinemanagementpage-soMuiKhuyenNghi"
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    name="soMuiKhuyenNghi"
                                    value={
                                        formData.soMuiKhuyenNghi
                                    }
                                    onChange={handleChange}
                                    required
                                />
                            </div>


                            <div className="col-md-3 mb-3">
                                <label htmlFor="vaccinemanagementpage-khoangCachMui" className="form-label">
                                    Khoảng cách mũi
                                </label>

                                <input id="vaccinemanagementpage-khoangCachMui"
                                    type="number"
                                    min="0"
                                    className="form-control"
                                    name="khoangCachMui"
                                    value={
                                        formData.khoangCachMui
                                    }
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="col-12 mb-3">
                                <label htmlFor="vaccinemanagementpage-moTa" className="form-label">
                                    Mô tả
                                </label>

                                <textarea id="vaccinemanagementpage-moTa"
                                    className="form-control"
                                    rows="3"
                                    name="moTa"
                                    value={formData.moTa}
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
                                    : "Thêm vaccine"}
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
                        Danh sách Vaccine
                    </strong>

                    <span className="badge bg-success">
                        {vaccines.length} vaccine
                    </span>
                </div>


                <div className="card-body">

                    {vaccines.length === 0 ? (
                        <EmptyState title="Chưa có vaccine trong danh mục" description="Thêm vaccine bằng biểu mẫu bên trên để bắt đầu quản lý." />
                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã</th>
                                        <th>Tên vaccine</th>
                                        <th>Loại</th>
                                        <th>Nhà sản xuất</th>
                                        <th>Số mũi</th>
                                        <th>Khoảng cách</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {vaccines.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaVaccine
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaVaccine
                                                    }
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            item.TenVaccine
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    {
                                                        item.LoaiVaccine ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.NhaSanXuat ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.SoMuiKhuyenNghi
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.KhoangCachMui
                                                    }
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            item.TrangThai
                                                                ? "badge bg-success"
                                                                : "badge bg-secondary"
                                                        }
                                                    >
                                                        {
                                                            item.TrangThai
                                                                ? "Đang sử dụng"
                                                                : "Ngừng sử dụng"
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

                                                    <button
                                                        className={
                                                            item.TrangThai
                                                                ? "btn btn-sm btn-outline-danger"
                                                                : "btn btn-sm btn-outline-success"
                                                        }
                                                        onClick={() =>
                                                            handleStatus(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            item.TrangThai
                                                                ? "Ngừng"
                                                                : "Kích hoạt"
                                                        }
                                                    </button>
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

export default VaccineManagementPage;
