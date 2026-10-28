import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";

import scheduleService
    from "../../services/scheduleService";

import citizenService
    from "../../services/citizenService";

import vaccineService
    from "../../services/vaccineService";


function ScheduleManagementPage() {

    const emptyForm = {
        maNguoiDan: "",
        maVaccine: "",
        muiSo: 1,
        ngayDuKien: "",
        coSoTiem: "",
        ghiChu: "",
    };


    const [schedules, setSchedules] =
        useState([]);

    const [citizens, setCitizens] =
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
                scheduleResponse,
                citizenResponse,
                vaccineResponse
            ] = await Promise.all([
                scheduleService.getAllSchedules(),
                citizenService.getAllCitizens(),
                vaccineService.getAllVaccines(),
            ]);

            setSchedules(
                scheduleResponse.data || []
            );

            setCitizens(
                citizenResponse.data || []
            );

            setVaccines(
                vaccineResponse.data || []
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải dữ liệu lịch tiêm."
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


    const formatDateTime = (date) => {

        if (!date) return "-";

        return new Date(date)
            .toLocaleString("vi-VN");
    };


    const formatInputDateTime = (date) => {

        if (!date) return "";

        const d = new Date(date);

        const year =
            d.getFullYear();

        const month =
            String(
                d.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                d.getDate()
            ).padStart(2, "0");

        const hour =
            String(
                d.getHours()
            ).padStart(2, "0");

        const minute =
            String(
                d.getMinutes()
            ).padStart(2, "0");

        return `${year}-${month}-${day}T${hour}:${minute}`;
    };


    const handleEdit = (item) => {

        setEditingId(
            item.MaLichTiem
        );

        setFormData({
            maNguoiDan:
                item.MaNguoiDan || "",

            maVaccine:
                item.MaVaccine || "",

            muiSo:
                item.MuiSo || 1,

            ngayDuKien:
                formatInputDateTime(
                    item.NgayDuKien
                ),

            coSoTiem:
                item.CoSoTiem || "",

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
                maNguoiDan:
                    Number(
                        formData.maNguoiDan
                    ),

                maVaccine:
                    Number(
                        formData.maVaccine
                    ),

                muiSo:
                    Number(
                        formData.muiSo
                    ),

                ngayDuKien:
                    new Date(formData.ngayDuKien).toISOString(),

                coSoTiem:
                    formData.coSoTiem,

                ghiChu:
                    formData.ghiChu,
            };


            if (editingId) {

                await scheduleService
                    .updateSchedule(
                        editingId,
                        data
                    );

                setMessage(
                    "Cập nhật lịch tiêm thành công."
                );

            } else {

                await scheduleService
                    .createSchedule(data);

                setMessage(
                    "Tạo lịch tiêm thành công."
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
                "Không thể lưu lịch tiêm."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleStatus = async (
        item,
        trangThai
    ) => {

        try {

            setMessage("");
            setError("");

            await scheduleService
                .updateScheduleStatus(
                    item.MaLichTiem,
                    trangThai
                );

            setMessage(
                "Cập nhật trạng thái lịch tiêm thành công."
            );

            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể cập nhật trạng thái."
            );
        }
    };


    const getStatusClass = (status) => {

        switch (status) {

            case "Đã lên lịch":
                return "bg-primary";

            case "Đã xác nhận":
                return "bg-info text-dark";

            case "Đã tiêm":
            case "Hoàn thành":
                return "bg-success";

            case "Đã hủy":
                return "bg-danger";

            case "Vắng mặt":
                return "bg-warning text-dark";

            default:
                return "bg-secondary";
        }
    };


    if (loading) {

        return (
            <div className="text-center py-5">
                Đang tải lịch tiêm...
            </div>
        );
    }


    return (
        <div>

            <div className="mb-4">

                <h2>
                    Quản lý lịch tiêm
                </h2>

                <p className="text-muted">
                    Tạo lịch, cập nhật lịch và
                    trạng thái tiêm chủng
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
                            ? "Cập nhật lịch tiêm"
                            : "Tạo lịch tiêm"}
                    </strong>

                </div>


                <div className="card-body">

                    <form onSubmit={handleSubmit}>

                        <div className="row">


                            <div className="col-md-6 mb-3">

                                <label htmlFor="schedulemanagementpage-maNguoiDan" className="form-label">
                                    Người dân
                                </label>

                                <select id="schedulemanagementpage-maNguoiDan"
                                    className="form-select"
                                    name="maNguoiDan"
                                    value={
                                        formData.maNguoiDan
                                    }
                                    onChange={handleChange}
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
                                                {item.HoTen}
                                                {" - "}
                                                {item.CCCD || "Không CCCD"}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="col-md-6 mb-3">

                                <label htmlFor="schedulemanagementpage-maVaccine" className="form-label">
                                    Vaccine
                                </label>

                                <select id="schedulemanagementpage-maVaccine"
                                    className="form-select"
                                    name="maVaccine"
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


                            <div className="col-md-3 mb-3">

                                <label htmlFor="schedulemanagementpage-muiSo" className="form-label">
                                    Mũi số
                                </label>

                                <input id="schedulemanagementpage-muiSo"
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    name="muiSo"
                                    value={
                                        formData.muiSo
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="col-md-5 mb-3">

                                <label htmlFor="schedulemanagementpage-ngayDuKien" className="form-label">
                                    Ngày dự kiến
                                </label>

                                <input id="schedulemanagementpage-ngayDuKien"
                                    type="datetime-local"
                                    className="form-control"
                                    name="ngayDuKien"
                                    value={
                                        formData.ngayDuKien
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="col-md-4 mb-3">

                                <label htmlFor="schedulemanagementpage-coSoTiem" className="form-label">
                                    Cơ sở tiêm
                                </label>

                                <input id="schedulemanagementpage-coSoTiem"
                                    type="text"
                                    className="form-control"
                                    name="coSoTiem"
                                    value={
                                        formData.coSoTiem
                                    }
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="col-12 mb-3">

                                <label htmlFor="schedulemanagementpage-ghiChu" className="form-label">
                                    Ghi chú
                                </label>

                                <textarea id="schedulemanagementpage-ghiChu"
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
                                    : "Tạo lịch"}
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
                        Danh sách lịch tiêm
                    </strong>

                    <span className="badge bg-success">
                        {schedules.length} lịch
                    </span>

                </div>


                <div className="card-body">

                    {schedules.length === 0 ? (

                        <EmptyState title="Chưa có lịch tiêm" description="Các lịch đăng ký mới và lịch được tạo sẽ hiển thị tại đây." />

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã</th>
                                        <th>Người dân</th>
                                        <th>Vaccine</th>
                                        <th>Mũi</th>
                                        <th>Ngày dự kiến</th>
                                        <th>Cơ sở</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {schedules.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaLichTiem
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaLichTiem
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            item.HoTen ||
                                                            item.TenNguoiDan ||
                                                            item.MaNguoiDan
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
                                                    {
                                                        item.MuiSo
                                                    }
                                                </td>


                                                <td>
                                                    {formatDateTime(
                                                        item.NgayDuKien
                                                    )}
                                                </td>


                                                <td>
                                                    {
                                                        item.CoSoTiem ||
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

                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        disabled={!["Đã lên lịch", "Đã xác nhận"].includes(item.TrangThai)}
                                                        onClick={() =>
                                                            handleEdit(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        Sửa
                                                    </button>


                                                    <select
                                                        className="form-select form-select-sm mt-2"
                                                        disabled={!["Đã lên lịch", "Đã xác nhận"].includes(item.TrangThai)}
                                                        aria-label={`Trạng thái lịch ${item.MaLichTiem}`}
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

                                                        <option value="Đã lên lịch">
                                                            Đã lên lịch
                                                        </option>

                                                        <option value="Đã xác nhận">
                                                            Đã xác nhận
                                                        </option>

                                                        <option value="Đã tiêm" disabled>
                                                            Đã tiêm
                                                        </option>

                                                        <option value="Hoàn thành" disabled>
                                                            Hoàn thành
                                                        </option>

                                                        <option value="Đã hủy">
                                                            Đã hủy
                                                        </option>

                                                        <option value="Vắng mặt">
                                                            Vắng mặt
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

export default ScheduleManagementPage;
