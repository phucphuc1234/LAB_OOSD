import { useEffect, useMemo, useState } from "react";

import vaccinationService
    from "../../services/vaccinationService";

import scheduleService
    from "../../services/scheduleService";

import citizenService
    from "../../services/citizenService";

import vaccineService
    from "../../services/vaccineService";

import batchService
    from "../../services/batchService";


function VaccinationManagementPage() {

    const getCurrentDateTime = () => {
        const d = new Date();

        const year = d.getFullYear();

        const month = String(
            d.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            d.getDate()
        ).padStart(2, "0");

        const hour = String(
            d.getHours()
        ).padStart(2, "0");

        const minute = String(
            d.getMinutes()
        ).padStart(2, "0");

        return `${year}-${month}-${day}T${hour}:${minute}`;
    };


    const emptyForm = {
        maLichTiem: "",
        maNguoiDan: "",
        maVaccine: "",
        maLo: "",
        muiSo: 1,
        ngayTiem: getCurrentDateTime(),
        coSoTiem: "",
        ketQua: "Đã tiêm thành công",
        phanUngSauTiem: "",
        ghiChu: "",
    };


    const [formData, setFormData] =
        useState(emptyForm);

    const [schedules, setSchedules] =
        useState([]);

    const [citizens, setCitizens] =
        useState([]);

    const [vaccines, setVaccines] =
        useState([]);

    const [batches, setBatches] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [createdVaccination, setCreatedVaccination] =
        useState(null);


    const loadData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                scheduleResponse,
                citizenResponse,
                vaccineResponse,
                batchResponse
            ] = await Promise.all([
                scheduleService.getAllSchedules(),
                citizenService.getAllCitizens(),
                vaccineService.getAllVaccines(),
                batchService.getAllBatches(),
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

            setBatches(
                batchResponse.data || []
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải dữ liệu ghi nhận mũi tiêm."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadData();
    }, []);


    const availableSchedules = useMemo(() => {

        return schedules.filter(
            (item) =>
                item.TrangThai === "Đã lên lịch" ||
                item.TrangThai === "Đã xác nhận"
        );

    }, [schedules]);


    const availableBatches = useMemo(() => {

        if (!formData.maVaccine) {
            return [];
        }

        const today = new Date().toISOString().slice(0, 10);
        const selectedSchedule = schedules.find(item => Number(item.MaLichTiem) === Number(formData.maLichTiem));

        return batches.filter((item) => {

            const sameVaccine =
                Number(item.MaVaccine) ===
                Number(formData.maVaccine);

            const reservedForThisSchedule = selectedSchedule && Number(selectedSchedule.MaLoDuKien) === Number(item.MaLo);
            const hasQuantity = Number(item.SoLuongCon) - Number(item.SoLuongDatTruoc || 0) > 0
                || (reservedForThisSchedule && Number(item.SoLuongCon) > 0);

            const active =
                item.TrangThai === "Đang sử dụng";

            const notExpired =
                !item.HanSuDung ||
                String(item.HanSuDung).slice(0, 10) >= today;

            return (
                sameVaccine &&
                hasQuantity &&
                active &&
                notExpired
            );
        });

    }, [
        batches,
        formData.maVaccine,
        formData.maLichTiem,
        schedules
    ]);


    const handleChange = (e) => {

        const { name, value } =
            e.target;

        if (name === "maVaccine") {

            setFormData((prev) => ({
                ...prev,
                maVaccine: value,
                maLo: "",
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };


    const handleScheduleChange = (e) => {

        const value = e.target.value;


        if (!value) {

            setFormData({
                ...emptyForm,
                ngayTiem:
                    getCurrentDateTime()
            });

            return;
        }


        const schedule =
            schedules.find(
                (item) =>
                    Number(item.MaLichTiem) ===
                    Number(value)
            );


        if (!schedule) {
            return;
        }


        setFormData({
            maLichTiem:
                schedule.MaLichTiem,

            maNguoiDan:
                schedule.MaNguoiDan,

            maVaccine:
                schedule.MaVaccine,

            maLo: schedule.MaLoDuKien || "",

            muiSo:
                schedule.MuiSo || 1,

            ngayTiem:
                getCurrentDateTime(),

            coSoTiem:
                schedule.CoSoTiem || "",

            ketQua:
                "Đã tiêm thành công",

            phanUngSauTiem: "",

            ghiChu: "",
        });
    };


    const handleReset = () => {

        setFormData({
            ...emptyForm,
            ngayTiem:
                getCurrentDateTime()
        });

        setMessage("");
        setError("");
        setCreatedVaccination(null);
    };


    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setSaving(true);
            setMessage("");
            setError("");
            setCreatedVaccination(null);


            const data = {

                maNguoiDan:
                    Number(
                        formData.maNguoiDan
                    ),

                maVaccine:
                    Number(
                        formData.maVaccine
                    ),

                maLo:
                    Number(
                        formData.maLo
                    ),

                maLichTiem:
                    formData.maLichTiem
                        ? Number(
                            formData.maLichTiem
                        )
                        : null,

                muiSo:
                    Number(
                        formData.muiSo
                    ),

                ngayTiem:
                    new Date(formData.ngayTiem).toISOString(),

                coSoTiem:
                    formData.coSoTiem,

                ketQua:
                    formData.ketQua,

                phanUngSauTiem:
                    formData.phanUngSauTiem,

                ghiChu:
                    formData.ghiChu,
            };


            const response =
                await vaccinationService
                    .createVaccination(data);


            setCreatedVaccination(
                response.data || null
            );


            setMessage(
                "Ghi nhận mũi tiêm thành công."
            );


            setFormData({
                ...emptyForm,
                ngayTiem:
                    getCurrentDateTime()
            });


            await loadData();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể ghi nhận mũi tiêm."
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


    const getVaccineName = (id) => {

        const vaccine =
            vaccines.find(
                (item) =>
                    Number(item.MaVaccine) ===
                    Number(id)
            );

        return vaccine
            ? vaccine.TenVaccine
            : id;
    };


    if (loading) {

        return (
            <div className="text-center py-5">
                Đang tải dữ liệu...
            </div>
        );
    }


    const hasSchedule =
        Boolean(formData.maLichTiem);


    return (
        <div>

            <div className="mb-4">

                <h2>
                    Ghi nhận mũi tiêm
                </h2>

                <p className="text-muted">
                    Ghi nhận vaccine thực tế
                    đã sử dụng cho người dân
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
                        Thông tin mũi tiêm
                    </strong>
                </div>


                <div className="card-body">

                    <form onSubmit={handleSubmit}>


                        <div className="row">


                            <div className="col-12 mb-3">

                                <label htmlFor="vaccinationmanagementpage-maLichTiem" className="form-label">
                                    Lịch tiêm
                                </label>

                                <select id="vaccinationmanagementpage-maLichTiem"
                                    className="form-select"
                                    name="maLichTiem"
                                    value={
                                        formData.maLichTiem
                                    }
                                    onChange={
                                        handleScheduleChange
                                    }
                                >

                                    <option value="">
                                        -- Không chọn lịch / Ghi nhận trực tiếp --
                                    </option>


                                    {availableSchedules.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.MaLichTiem
                                                }
                                                value={
                                                    item.MaLichTiem
                                                }
                                            >
                                                Lịch #{item.MaLichTiem}
                                                {" - "}
                                                {
                                                    item.HoTen ||
                                                    getCitizenName(
                                                        item.MaNguoiDan
                                                    )
                                                }
                                                {" - "}
                                                {
                                                    item.TenVaccine ||
                                                    getVaccineName(
                                                        item.MaVaccine
                                                    )
                                                }
                                                {" - Mũi "}
                                                {item.MuiSo}
                                            </option>

                                        )
                                    )}

                                </select>

                                <small className="text-muted">
                                    Nếu chọn lịch, thông tin
                                    người dân và vaccine sẽ
                                    được điền tự động.
                                </small>

                            </div>


                            <div className="col-md-6 mb-3">

                                <label htmlFor="vaccinationmanagementpage-maNguoiDan" className="form-label">
                                    Người dân
                                </label>

                                <select id="vaccinationmanagementpage-maNguoiDan"
                                    className="form-select"
                                    name="maNguoiDan"
                                    value={
                                        formData.maNguoiDan
                                    }
                                    onChange={handleChange}
                                    disabled={hasSchedule}
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

                                <label htmlFor="vaccinationmanagementpage-maVaccine" className="form-label">
                                    Vaccine
                                </label>

                                <select id="vaccinationmanagementpage-maVaccine"
                                    className="form-select"
                                    name="maVaccine"
                                    value={
                                        formData.maVaccine
                                    }
                                    onChange={handleChange}
                                    disabled={hasSchedule}
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


                            <div className="col-md-6 mb-3">

                                <label htmlFor="vaccinationmanagementpage-maLo" className="form-label">
                                    Lô vaccine thực tế
                                </label>

                                <select id="vaccinationmanagementpage-maLo"
                                    className="form-select"
                                    name="maLo"
                                    value={
                                        formData.maLo
                                    }
                                    onChange={handleChange}
                                    required
                                >

                                    <option value="">
                                        -- Chọn lô vaccine --
                                    </option>


                                    {availableBatches.map(
                                        (item) => (

                                            <option
                                                key={
                                                    item.MaLo
                                                }
                                                value={
                                                    item.MaLo
                                                }
                                            >
                                                {
                                                    item.MaLoVaccine
                                                }
                                                {" · Khả dụng "}
                                                {
                                                    Math.max(0, Number(item.SoLuongCon) - Number(item.SoLuongDatTruoc || 0))
                                                }
                                                {` · Giữ chỗ ${Number(item.SoLuongDatTruoc || 0)}`}
                                            </option>

                                        )
                                    )}

                                </select>


                                {formData.maVaccine &&
                                    availableBatches.length === 0 && (

                                        <small className="text-danger">
                                            Không có lô vaccine
                                            hợp lệ cho vaccine này.
                                        </small>

                                    )}

                            </div>


                            <div className="col-md-2 mb-3">

                                <label htmlFor="vaccinationmanagementpage-muiSo" className="form-label">
                                    Mũi số
                                </label>

                                <input id="vaccinationmanagementpage-muiSo"
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    name="muiSo"
                                    value={
                                        formData.muiSo
                                    }
                                    onChange={handleChange}
                                    disabled={hasSchedule}
                                    required
                                />

                            </div>


                            <div className="col-md-4 mb-3">

                                <label htmlFor="vaccinationmanagementpage-ngayTiem" className="form-label">
                                    Ngày tiêm
                                </label>

                                <input id="vaccinationmanagementpage-ngayTiem"
                                    type="datetime-local"
                                    className="form-control"
                                    name="ngayTiem"
                                    value={
                                        formData.ngayTiem
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>


                            <div className="col-md-6 mb-3">

                                <label htmlFor="vaccinationmanagementpage-coSoTiem" className="form-label">
                                    Cơ sở tiêm
                                </label>

                                <input id="vaccinationmanagementpage-coSoTiem"
                                    type="text"
                                    className="form-control"
                                    name="coSoTiem"
                                    value={
                                        formData.coSoTiem
                                    }
                                    onChange={handleChange}
                                />

                            </div>


                            <div className="col-md-6 mb-3">

                                <label htmlFor="vaccinationmanagementpage-ketQua" className="form-label">
                                    Kết quả
                                </label>

                                <select id="vaccinationmanagementpage-ketQua"
                                    className="form-select"
                                    name="ketQua"
                                    value={
                                        formData.ketQua
                                    }
                                    onChange={handleChange}
                                >

                                    <option value="Đã tiêm thành công">
                                        Đã tiêm thành công
                                    </option>

                                    <option value="Theo dõi sau tiêm">
                                        Theo dõi sau tiêm
                                    </option>

                                </select>

                            </div>


                            <div className="col-12 mb-3">

                                <label htmlFor="vaccinationmanagementpage-phanUngSauTiem" className="form-label">
                                    Phản ứng sau tiêm
                                </label>

                                <textarea id="vaccinationmanagementpage-phanUngSauTiem"
                                    className="form-control"
                                    rows="2"
                                    name="phanUngSauTiem"
                                    value={
                                        formData.phanUngSauTiem
                                    }
                                    onChange={handleChange}
                                    placeholder="Ví dụ: Không ghi nhận phản ứng bất thường"
                                />

                            </div>


                            <div className="col-12 mb-3">

                                <label htmlFor="vaccinationmanagementpage-ghiChu" className="form-label">
                                    Ghi chú
                                </label>

                                <textarea id="vaccinationmanagementpage-ghiChu"
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
                            disabled={
                                saving ||
                                availableBatches.length === 0
                            }
                        >
                            {saving
                                ? "Đang ghi nhận..."
                                : "Ghi nhận mũi tiêm"}
                        </button>


                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleReset}
                        >
                            Làm mới
                        </button>

                    </form>

                </div>

            </div>


            {createdVaccination && (

                <div className="card border-success shadow-sm">

                    <div className="card-header bg-success text-white">

                        <strong>
                            Ghi nhận thành công
                        </strong>

                    </div>


                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mã mũi tiêm
                                </strong>

                                <div>
                                    {
                                        createdVaccination.MaMuiTiem ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mã người dân
                                </strong>

                                <div>
                                    {
                                        createdVaccination.MaNguoiDan ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mã lô
                                </strong>

                                <div>
                                    {
                                        createdVaccination.MaLo ||
                                        "-"
                                    }
                                </div>
                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default VaccinationManagementPage;
