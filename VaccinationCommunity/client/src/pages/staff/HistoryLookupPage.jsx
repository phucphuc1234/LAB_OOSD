import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";

import historyService
    from "../../services/historyService";

import citizenService
    from "../../services/citizenService";


function HistoryLookupPage() {

    const [citizens, setCitizens] =
        useState([]);

    const [selectedCitizen, setSelectedCitizen] =
        useState("");

    const [history, setHistory] =
        useState([]);

    const [detail, setDetail] =
        useState(null);

    const [loadingCitizens, setLoadingCitizens] =
        useState(true);

    const [loadingHistory, setLoadingHistory] =
        useState(false);

    const [loadingDetail, setLoadingDetail] =
        useState(false);

    const [error, setError] =
        useState("");


    const loadCitizens = async () => {

        try {

            setLoadingCitizens(true);
            setError("");

            const response =
                await citizenService
                    .getAllCitizens();

            setCitizens(
                response.data || []
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải danh sách người dân."
            );

        } finally {

            setLoadingCitizens(false);
        }
    };


    useEffect(() => {
        loadCitizens();
    }, []);


    const handleSearch = async () => {

        if (!selectedCitizen) {
            setError(
                "Vui lòng chọn người dân."
            );

            return;
        }

        try {

            setLoadingHistory(true);
            setError("");
            setDetail(null);

            const response =
                await historyService
                    .getCitizenHistory(
                        selectedCitizen
                    );

            setHistory(
                response.data || []
            );

        } catch (err) {

            setHistory([]);

            setError(
                err.response?.data?.message ||
                "Không thể tải lịch sử tiêm."
            );

        } finally {

            setLoadingHistory(false);
        }
    };


    const handleViewDetail = async (id) => {

        try {

            setLoadingDetail(true);
            setError("");

            const response =
                await historyService
                    .getHistoryDetail(id);

            setDetail(
                response.data
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải chi tiết mũi tiêm."
            );

        } finally {

            setLoadingDetail(false);
        }
    };


    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date)
            .toLocaleString("vi-VN");
    };


    const selectedCitizenData =
        citizens.find(
            (item) =>
                Number(item.MaNguoiDan) ===
                Number(selectedCitizen)
        );


    if (loadingCitizens) {

        return (
            <div className="text-center py-5">
                Đang tải danh sách người dân...
            </div>
        );
    }


    return (
        <div>

            <div className="mb-4">

                <h2>
                    Tra cứu lịch sử tiêm
                </h2>

                <p className="text-muted">
                    Tra cứu các mũi vaccine
                    đã được ghi nhận cho người dân
                </p>

            </div>


            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}


            <div className="card shadow-sm mb-4">

                <div className="card-body">

                    <div className="row align-items-end">

                        <div className="col-md-9">

                            <label htmlFor="historylookuppage-1" className="form-label">
                                Người dân
                            </label>

                            <select id="historylookuppage-1"
                                className="form-select"
                                value={selectedCitizen}
                                onChange={(e) => {
                                    setSelectedCitizen(
                                        e.target.value
                                    );

                                    setHistory([]);
                                    setDetail(null);
                                    setError("");
                                }}
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


                        <div className="col-md-3">

                            <button
                                className="btn btn-success w-100"
                                onClick={handleSearch}
                                disabled={loadingHistory}
                            >
                                {loadingHistory
                                    ? "Đang tra cứu..."
                                    : "Tra cứu"}
                            </button>

                        </div>

                    </div>

                </div>

            </div>


            {selectedCitizenData &&
                history.length > 0 && (

                    <div className="alert alert-light border">

                        <strong>
                            Người dân:
                        </strong>
                        {" "}
                        {selectedCitizenData.HoTen}

                        {" | "}

                        <strong>
                            CCCD:
                        </strong>
                        {" "}
                        {
                            selectedCitizenData.CCCD ||
                            "-"
                        }

                        {" | "}

                        <strong>
                            Số mũi đã ghi nhận:
                        </strong>
                        {" "}
                        {history.length}

                    </div>
                )}


            {!loadingHistory &&
                selectedCitizen &&
                history.length === 0 &&
                !error && (

                    <EmptyState title="Hồ sơ chưa có lịch sử tiêm" description="Các mũi tiêm đã ghi nhận cho người dân này sẽ xuất hiện tại đây." />

                )}


            {history.length > 0 && (

                <div className="card shadow-sm">

                    <div className="card-header">
                        <strong>
                            Lịch sử tiêm chủng
                        </strong>
                    </div>


                    <div className="card-body">

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã mũi</th>
                                        <th>Vaccine</th>
                                        <th>Mã lô</th>
                                        <th>Mũi số</th>
                                        <th>Ngày tiêm</th>
                                        <th>Cơ sở</th>
                                        <th>Kết quả</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {history.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaMuiTiem
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaMuiTiem
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
                                                        item.MaLoVaccine ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    {
                                                        item.MuiSo
                                                    }
                                                </td>


                                                <td>
                                                    {formatDate(
                                                        item.NgayTiem
                                                    )}
                                                </td>


                                                <td>
                                                    {
                                                        item.CoSoTiem ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>
                                                    <span className="badge bg-success">
                                                        {
                                                            item.KetQua ||
                                                            "Đã tiêm"
                                                        }
                                                    </span>
                                                </td>


                                                <td>

                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handleViewDetail(
                                                                item.MaMuiTiem
                                                            )
                                                        }
                                                    >
                                                        Chi tiết
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            )}


            {loadingDetail && (

                <div className="alert alert-info mt-4">
                    Đang tải chi tiết mũi tiêm...
                </div>

            )}


            {detail && !loadingDetail && (

                <div className="card shadow-sm mt-4">

                    <div className="card-header d-flex justify-content-between align-items-center">

                        <strong>
                            Chi tiết mũi tiêm #{detail.MaMuiTiem}
                        </strong>

                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                                setDetail(null)
                            }
                        >
                            Đóng
                        </button>

                    </div>


                    <div className="card-body">

                        <div className="row">


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Người dân
                                </strong>

                                <div>
                                    {detail.HoTen || "-"}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Vaccine
                                </strong>

                                <div>
                                    {detail.TenVaccine || "-"}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Nhà sản xuất
                                </strong>

                                <div>
                                    {detail.NhaSanXuat || "-"}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mã lô
                                </strong>

                                <div>
                                    {detail.MaLoVaccine || "-"}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mũi số
                                </strong>

                                <div>
                                    {detail.MuiSo || "-"}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Ngày tiêm
                                </strong>

                                <div>
                                    {formatDate(
                                        detail.NgayTiem
                                    )}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Cơ sở tiêm
                                </strong>

                                <div>
                                    {detail.CoSoTiem || "-"}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Nhân viên ghi nhận
                                </strong>

                                <div>
                                    {
                                        detail.NhanVienGhiNhan ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Kết quả
                                </strong>

                                <div>
                                    {detail.KetQua || "-"}
                                </div>
                            </div>


                            <div className="col-md-6 mb-3">
                                <strong>
                                    Phản ứng sau tiêm
                                </strong>

                                <div>
                                    {
                                        detail.PhanUngSauTiem ||
                                        "Không ghi nhận"
                                    }
                                </div>
                            </div>


                            <div className="col-md-6 mb-3">
                                <strong>
                                    Ghi chú
                                </strong>

                                <div>
                                    {detail.GhiChu || "-"}
                                </div>
                            </div>


                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default HistoryLookupPage;
