import { EmptyState } from "../../components/common/DashboardUI";
import {
    useEffect,
    useState
} from "react";

import scheduleService
    from "../../services/scheduleService";

import vaccineService
    from "../../services/vaccineService";


function SchedulePage() {

    const [schedules, setSchedules] =
        useState([]);

    const [vaccines, setVaccines] =
        useState([]);

    const [showForm, setShowForm] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    const [cancellingId, setCancellingId] = useState(null);

    const [formData, setFormData] =
        useState({
            maVaccine: "",
            muiSo: 1,
            ngayDuKien: "",
            coSoTiem: "",
            ghiChu: "",
        });


    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                scheduleResponse,
                vaccineResponse
            ] = await Promise.all([
                scheduleService
                    .getMySchedules(),

                vaccineService
                    .getAllVaccines()
            ]);


            setSchedules(
                scheduleResponse.data || []
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

        const {
            name,
            value
        } = e.target;


        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };


    const resetForm = () => {

        setFormData({
            maVaccine: "",
            muiSo: 1,
            ngayDuKien: "",
            coSoTiem: "",
            ghiChu: "",
        });

        setShowForm(false);
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage("");
        setError("");


        if (!formData.maVaccine) {

            setError(
                "Vui lòng chọn vaccine."
            );

            return;
        }


        if (!formData.ngayDuKien) {

            setError(
                "Vui lòng chọn ngày giờ tiêm."
            );

            return;
        }


        const selectedDate =
            new Date(
                formData.ngayDuKien
            );


        if (
            selectedDate <= new Date()
        ) {

            setError(
                "Ngày tiêm phải lớn hơn thời điểm hiện tại."
            );

            return;
        }


        try {

            setSubmitting(true);


            const response =
                await scheduleService
                    .createMySchedule({
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
                            formData.coSoTiem ||
                            null,

                        ghiChu:
                            formData.ghiChu ||
                            null
                    });


            setMessage(
                response.message ||
                "Đăng ký lịch tiêm thành công."
            );


            resetForm();

            await loadData();


        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Đăng ký lịch tiêm thất bại."
            );

        } finally {

            setSubmitting(false);
        }
    };


    const cancelSchedule = async (item) => {
        if (!window.confirm("Bạn muốn hủy lịch tiêm này?")) return;
        setCancellingId(item.MaLichTiem); setError(""); setMessage("");
        try {
            const response = await scheduleService.cancelMySchedule(item.MaLichTiem);
            await loadData();
            setMessage(response.message || "Đã hủy lịch tiêm.");
        } catch (failure) {
            setError(failure.response?.data?.message || "Chưa thể hủy lịch. Vui lòng thử lại.");
        } finally { setCancellingId(null); }
    };

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(date)
            .toLocaleString(
                "vi-VN"
            );
    };


    const statusBadge = (status) => {

        switch (status) {

            case "Đã xác nhận":
                return "bg-primary";

            case "Đã tiêm":
            case "Hoàn thành":
                return "bg-success";

            case "Đã hủy":
            case "Vắng mặt":
                return "bg-danger";

            default:
                return "bg-warning text-dark";
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

            <div
                className="d-flex justify-content-between align-items-center mb-4"
            >

                <div>

                    <h2>
                        Lịch tiêm của tôi
                    </h2>

                    <p className="text-muted mb-0">
                        Theo dõi và đăng ký
                        lịch tiêm vaccine
                    </p>

                </div>


                <button
                    className={
                        showForm
                            ? "btn btn-outline-secondary"
                            : "btn btn-primary"
                    }
                    onClick={() =>
                        setShowForm(
                            !showForm
                        )
                    }
                >

                    {showForm
                        ? "Đóng"
                        : "+ Đăng ký lịch tiêm"}

                </button>

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


            {/* FORM ĐĂNG KÝ */}

            {showForm && (

                <div className="card shadow-sm mb-4">

                    <div className="card-header">

                        <strong>
                            Đăng ký lịch tiêm
                        </strong>

                    </div>


                    <div className="card-body">

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >

                            <div className="row">


                                <div className="col-md-6 mb-3">

                                    <label htmlFor="schedulepage-maVaccine" className="form-label">
                                        Vaccine
                                    </label>

                                    <select id="schedulepage-maVaccine"
                                        className="form-select"
                                        name="maVaccine"
                                        value={
                                            formData.maVaccine
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    >

                                        <option value="">
                                            -- Chọn vaccine --
                                        </option>


                                        {vaccines.map(
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


                                <div className="col-md-6 mb-3">

                                    <label htmlFor="schedulepage-muiSo" className="form-label">
                                        Mũi tiêm
                                    </label>

                                    <select id="schedulepage-muiSo"
                                        className="form-select"
                                        name="muiSo"
                                        value={
                                            formData.muiSo
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >

                                        <option value="1">
                                            Mũi 1
                                        </option>

                                        <option value="2">
                                            Mũi 2
                                        </option>

                                        <option value="3">
                                            Mũi 3
                                        </option>

                                        <option value="4">
                                            Mũi 4
                                        </option>

                                    </select>

                                </div>


                                <div className="col-md-6 mb-3">

                                    <label htmlFor="schedulepage-ngayDuKien" className="form-label">
                                        Ngày giờ tiêm mong muốn
                                    </label>

                                    <input id="schedulepage-ngayDuKien"
                                        type="datetime-local"
                                        className="form-control"
                                        name="ngayDuKien"
                                        value={
                                            formData.ngayDuKien
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />

                                </div>


                                <div className="col-md-6 mb-3">

                                    <label htmlFor="schedulepage-coSoTiem" className="form-label">
                                        Cơ sở tiêm
                                    </label>

                                    <input id="schedulepage-coSoTiem"
                                        type="text"
                                        className="form-control"
                                        name="coSoTiem"
                                        value={
                                            formData.coSoTiem
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ví dụ: Trung tâm Y tế"
                                        required
                                    />

                                </div>


                                <div className="col-12 mb-3">

                                    <label htmlFor="schedulepage-ghiChu" className="form-label">
                                        Ghi chú
                                    </label>

                                    <textarea id="schedulepage-ghiChu"
                                        className="form-control"
                                        rows="3"
                                        name="ghiChu"
                                        value={
                                            formData.ghiChu
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Ghi chú thêm nếu có..."
                                    />

                                </div>

                            </div>


                            <div className="d-flex gap-2">

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        submitting
                                    }
                                >

                                    {submitting
                                        ? "Đang đăng ký..."
                                        : "Đăng ký"}

                                </button>


                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={
                                        resetForm
                                    }
                                >
                                    Hủy
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* DANH SÁCH LỊCH */}

            <div className="card shadow-sm">

                <div className="card-header">

                    <strong>
                        Danh sách lịch tiêm
                    </strong>

                </div>


                <div className="card-body">

                    {schedules.length === 0 ? (

                        <EmptyState title="Bạn chưa có lịch tiêm" description="Chọn đăng ký lịch tiêm để bắt đầu và theo dõi trạng thái xác nhận tại đây." />

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã lịch</th>
                                        <th>Vaccine</th>
                                        <th>Mũi số</th>
                                        <th>Ngày dự kiến</th>
                                        <th>Cơ sở tiêm</th>
                                        <th>Trạng thái</th>
                                        <th>Ghi chú</th>
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
                                                            item.TenVaccine ||
                                                            "-"
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    {
                                                        item.MuiSo
                                                    }
                                                </td>


                                                <td>
                                                    {formatDate(
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
                                                            `badge ${statusBadge(
                                                                item.TrangThai
                                                            )}`
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
                                                <td>{["Đã lên lịch", "Đã xác nhận"].includes(item.TrangThai) ? <button type="button" className="btn btn-sm btn-outline-danger" disabled={cancellingId !== null} onClick={() => cancelSchedule(item)}>{cancellingId === item.MaLichTiem ? "Đang hủy…" : "Hủy lịch"}</button> : <span className="text-muted">—</span>}</td>

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

export default SchedulePage;
