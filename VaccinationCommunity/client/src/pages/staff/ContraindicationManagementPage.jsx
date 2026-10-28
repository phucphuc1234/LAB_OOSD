import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";

import contraindicationService
    from "../../services/contraindicationService";

import citizenService
    from "../../services/citizenService";


function ContraindicationManagementPage() {

    const emptyForm = {
        maNguoiDan: "",
        noiDung: "",
        ngayXacNhan: "",
        trangThai: "Đã xác nhận",
        ghiChu: "",
    };


    const [contraindications, setContraindications] =
        useState([]);

    const [citizens, setCitizens] =
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
                contraindicationResponse,
                citizenResponse
            ] = await Promise.all([
                contraindicationService
                    .getAllContraindications(),

                citizenService
                    .getAllCitizens()
            ]);


            setContraindications(
                contraindicationResponse.data || []
            );

            setCitizens(
                citizenResponse.data || []
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải dữ liệu chống chỉ định."
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


    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(date)
            .toLocaleDateString("vi-VN");
    };


    const formatInputDate = (date) => {

        if (!date) {
            return "";
        }

        return String(date)
            .substring(0, 10);
    };


    const handleEdit = (item) => {

        setEditingId(
            item.MaChongChiDinh
        );

        setFormData({

            maNguoiDan:
                item.MaNguoiDan || "",

            noiDung:
                item.NoiDung || "",

            ngayXacNhan:
                formatInputDate(
                    item.NgayXacNhan
                ),

            trangThai:
                item.TrangThai ||
                "Đã xác nhận",

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


            if (editingId) {

                await contraindicationService
                    .updateContraindication(
                        editingId,
                        {
                            noiDung:
                                formData.noiDung,

                            ngayXacNhan:
                                formData.ngayXacNhan ||
                                null,

                            trangThai:
                                formData.trangThai,

                            ghiChu:
                                formData.ghiChu,
                        }
                    );


                setMessage(
                    "Cập nhật chống chỉ định thành công."
                );

            } else {

                await contraindicationService
                    .createContraindication({
                        maNguoiDan:
                            Number(
                                formData.maNguoiDan
                            ),

                        noiDung:
                            formData.noiDung,

                        ngayXacNhan:
                            formData.ngayXacNhan ||
                            null,

                        ghiChu:
                            formData.ghiChu,
                    });


                setMessage(
                    "Thêm chống chỉ định thành công."
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
                "Không thể lưu chống chỉ định."
            );

        } finally {

            setSaving(false);
        }
    };


    const getCitizenName = (id) => {

        const citizen =
            citizens.find(
                (item) =>
                    Number(item.MaNguoiDan) ===
                    Number(id)
            );

        return citizen
            ? citizen.HoTen
            : id;
    };


    const getStatusClass = (status) => {

        if (status === "Đã xác nhận") {
            return "bg-success";
        }

        if (status === "Đã hủy") {
            return "bg-secondary";
        }

        return "bg-warning text-dark";
    };


    if (loading) {

        return (
            <div className="text-center py-5">
                Đang tải chống chỉ định...
            </div>
        );
    }


    return (
        <div>

            <div className="mb-4">

                <h2>
                    Quản lý chống chỉ định
                </h2>

                <p className="text-muted">
                    Ghi nhận và cập nhật thông tin
                    chống chỉ định của người dân
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
                            ? "Cập nhật chống chỉ định"
                            : "Thêm chống chỉ định"}
                    </strong>

                </div>


                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">


                            <div className="col-md-6 mb-3">

                                <label htmlFor="contraindicationmanagementpage-maNguoiDan" className="form-label">
                                    Người dân
                                </label>

                                <select id="contraindicationmanagementpage-maNguoiDan"
                                    className="form-select"
                                    name="maNguoiDan"
                                    value={
                                        formData.maNguoiDan
                                    }
                                    onChange={handleChange}
                                    disabled={
                                        Boolean(editingId)
                                    }
                                    required
                                >

                                    <option value="">
                                        -- Chọn người dân --
                                    </option>

                                    {citizens.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.MaNguoiDan
                                                }
                                                value={
                                                    item.MaNguoiDan
                                                }
                                            >
                                                {
                                                    item.HoTen
                                                }
                                                {" - "}
                                                {
                                                    item.CCCD ||
                                                    "Không CCCD"
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="col-md-6 mb-3">

                                <label htmlFor="contraindicationmanagementpage-ngayXacNhan" className="form-label">
                                    Ngày xác nhận
                                </label>

                                <input id="contraindicationmanagementpage-ngayXacNhan"
                                    type="date"
                                    className="form-control"
                                    name="ngayXacNhan"
                                    value={
                                        formData.ngayXacNhan
                                    }
                                    onChange={handleChange}
                                />

                                <small className="text-muted">
                                    Có thể để trống để hệ thống
                                    lấy ngày hiện tại.
                                </small>

                            </div>


                            <div className="col-12 mb-3">

                                <label htmlFor="contraindicationmanagementpage-noiDung" className="form-label">
                                    Nội dung chống chỉ định
                                </label>

                                <textarea id="contraindicationmanagementpage-noiDung"
                                    className="form-control"
                                    rows="3"
                                    name="noiDung"
                                    value={
                                        formData.noiDung
                                    }
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Có tiền sử phản vệ với thành phần vaccine..."
                                    required
                                />

                            </div>


                            {editingId && (

                                <div className="col-md-6 mb-3">

                                    <label htmlFor="contraindicationmanagementpage-trangThai" className="form-label">
                                        Trạng thái
                                    </label>

                                    <select id="contraindicationmanagementpage-trangThai"
                                        className="form-select"
                                        name="trangThai"
                                        value={
                                            formData.trangThai
                                        }
                                        onChange={handleChange}
                                    >

                                        <option value="Đã xác nhận">
                                            Đã xác nhận
                                        </option>

                                        <option value="Đã hủy">
                                            Đã hủy
                                        </option>

                                    </select>

                                </div>

                            )}


                            <div
                                className={
                                    editingId
                                        ? "col-md-6 mb-3"
                                        : "col-12 mb-3"
                                }
                            >

                                <label htmlFor="contraindicationmanagementpage-ghiChu" className="form-label">
                                    Ghi chú
                                </label>

                                <textarea id="contraindicationmanagementpage-ghiChu"
                                    className="form-control"
                                    rows="2"
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
                                    : "Thêm chống chỉ định"}
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
                        Danh sách chống chỉ định
                    </strong>

                    <span className="badge bg-success">
                        {contraindications.length} bản ghi
                    </span>

                </div>


                <div className="card-body">

                    {contraindications.length === 0 ? (

                        <EmptyState title="Chưa có thông tin chống chỉ định" description="Chọn hồ sơ người dân để ghi nhận thông tin theo kết luận của nhân viên y tế." />

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã</th>
                                        <th>Người dân</th>
                                        <th>Nội dung</th>
                                        <th>Ngày xác nhận</th>
                                        <th>Người xác nhận</th>
                                        <th>Trạng thái</th>
                                        <th>Ghi chú</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {contraindications.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaChongChiDinh
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaChongChiDinh
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            item.HoTen ||
                                                            getCitizenName(
                                                                item.MaNguoiDan
                                                            )
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    {
                                                        item.NoiDung
                                                    }
                                                </td>


                                                <td>
                                                    {formatDate(
                                                        item.NgayXacNhan
                                                    )}
                                                </td>


                                                <td>
                                                    {
                                                        item.NguoiXacNhan ||
                                                        item.TenDangNhap ||
                                                        item.MaNguoiXacNhan ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            "badge " +
                                                            getStatusClass(
                                                                item.TrangThai
                                                            )
                                                        }
                                                    >
                                                        {
                                                            item.TrangThai
                                                        }
                                                    </span>

                                                </td>


                                                <td>
                                                    {
                                                        item.GhiChu ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handleEdit(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Sửa
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

export default ContraindicationManagementPage;
