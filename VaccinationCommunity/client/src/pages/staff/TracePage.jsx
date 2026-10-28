import { EmptyState } from "../../components/common/DashboardUI";
import { useState } from "react";
import traceService from "../../services/traceService";

function TracePage() {

    const [batchCode, setBatchCode] =
        useState("");

    const [vaccinationId, setVaccinationId] =
        useState("");

    const [batchResult, setBatchResult] =
        useState(null);

    const [vaccinationResult, setVaccinationResult] =
        useState(null);

    const [loadingBatch, setLoadingBatch] =
        useState(false);

    const [loadingVaccination, setLoadingVaccination] =
        useState(false);

    const [error, setError] =
        useState("");


    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date)
            .toLocaleString("vi-VN");
    };


    const handleTraceBatch = async (e) => {
        e.preventDefault();

        if (!batchCode.trim()) {
            setError(
                "Vui lòng nhập mã lô vaccine."
            );
            return;
        }

        try {

            setLoadingBatch(true);
            setError("");
            setBatchResult(null);

            const response =
                await traceService
                    .traceBatchByCode(
                        batchCode.trim()
                    );

            setBatchResult(
                response.data
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể truy vết lô vaccine."
            );

        } finally {

            setLoadingBatch(false);
        }
    };


    const handleTraceVaccination = async (e) => {
        e.preventDefault();

        if (!vaccinationId) {
            setError(
                "Vui lòng nhập mã mũi tiêm."
            );
            return;
        }

        try {

            setLoadingVaccination(true);
            setError("");
            setVaccinationResult(null);

            const response =
                await traceService
                    .traceVaccination(
                        vaccinationId
                    );

            setVaccinationResult(
                response.data
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể truy vết mũi tiêm."
            );

        } finally {

            setLoadingVaccination(false);
        }
    };


    return (
        <div>

            <div className="mb-4">
                <h2>
                    Truy vết lô vaccine
                </h2>

                <p className="text-muted">
                    Truy vết từ lô vaccine đến
                    người đã tiêm và truy ngược
                    từ mũi tiêm về lô vaccine
                </p>
            </div>


            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}


            {/* TRA THEO MA LO */}

            <div className="card shadow-sm mb-4">

                <div className="card-header">
                    <strong>
                        Tra cứu theo mã lô Vaccine
                    </strong>
                </div>

                <div className="card-body">

                    <form
                        onSubmit={handleTraceBatch}
                    >

                        <div className="row align-items-end">

                            <div className="col-md-9">

                                <label htmlFor="tracepage-1" className="form-label">
                                    Mã lô Vaccine
                                </label>

                                <input id="tracepage-1"
                                    type="text"
                                    className="form-control"
                                    placeholder="Ví dụ: HPV-TEST-2026"
                                    value={batchCode}
                                    onChange={(e) =>
                                        setBatchCode(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="col-md-3">

                                <button
                                    type="submit"
                                    className="btn btn-success w-100"
                                    disabled={
                                        loadingBatch
                                    }
                                >
                                    {loadingBatch
                                        ? "Đang truy vết..."
                                        : "Truy vết"}
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* KET QUA LO */}

            {batchResult && (

                <div className="card shadow-sm mb-4">

                    <div className="card-header bg-light">
                        <strong>
                            Thông tin lô Vaccine
                        </strong>
                    </div>


                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mã lô
                                </strong>

                                <div>
                                    {
                                        batchResult.batch
                                            ?.maLoVaccine
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Vaccine
                                </strong>

                                <div>
                                    {
                                        batchResult.batch
                                            ?.tenVaccine
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Trạng thái
                                </strong>

                                <div>
                                    <span className="badge bg-primary">
                                        {
                                            batchResult.batch
                                                ?.trangThai
                                        }
                                    </span>
                                </div>
                            </div>


                            <div className="col-md-3 mb-3">
                                <strong>
                                    Ngày sản xuất
                                </strong>

                                <div>
                                    {formatDate(
                                        batchResult.batch
                                            ?.ngaySanXuat
                                    )}
                                </div>
                            </div>


                            <div className="col-md-3 mb-3">
                                <strong>
                                    Hạn sử dụng
                                </strong>

                                <div>
                                    {formatDate(
                                        batchResult.batch
                                            ?.hanSuDung
                                    )}
                                </div>
                            </div>


                            <div className="col-md-3 mb-3">
                                <strong>
                                    Số lượng nhập
                                </strong>

                                <div>
                                    {
                                        batchResult.batch
                                            ?.soLuongNhap
                                    }
                                </div>
                            </div>


                            <div className="col-md-3 mb-3">
                                <strong>
                                    Số lượng còn
                                </strong>

                                <div>
                                    {
                                        batchResult.batch
                                            ?.soLuongCon
                                    }
                                </div>
                            </div>

                        </div>


                        <hr />


                        <div className="d-flex justify-content-between mb-3">

                            <h5>
                                Danh sách mũi đã sử dụng lô
                            </h5>

                            <span className="badge bg-success">
                                {
                                    batchResult
                                        .soMuiTiemDaSuDung
                                }{" "}
                                mũi
                            </span>

                        </div>


                        {batchResult.vaccinations
                            ?.length === 0 ? (

                            <EmptyState title="Lô chưa có mũi tiêm sử dụng" description="Khi lô được sử dụng, các mũi tiêm liên quan sẽ hiển thị trong danh sách này." />

                        ) : (

                            <div className="table-responsive">

                                <table className="table table-hover align-middle">

                                    <thead className="table-light">

                                        <tr>
                                            <th>Mã mũi</th>
                                            <th>Người dân</th>
                                            <th>CCCD</th>
                                            <th>Mũi số</th>
                                            <th>Ngày tiêm</th>
                                            <th>Cơ sở</th>
                                            <th>Kết quả</th>
                                            <th>Nhân viên</th>
                                        </tr>

                                    </thead>


                                    <tbody>

                                        {batchResult
                                            .vaccinations
                                            ?.map(
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
                                                                    item.HoTen
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td>
                                                            {
                                                                item.CCCD ||
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
                                                            {
                                                                item.KetQua ||
                                                                "-"
                                                            }
                                                        </td>

                                                        <td>
                                                            {
                                                                item.NhanVienGhiNhan ||
                                                                "-"
                                                            }
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
            )}


            {/* TRA THEO MUI TIEM */}

            <div className="card shadow-sm mb-4">

                <div className="card-header">
                    <strong>
                        Truy ngược từ mũi tiêm
                    </strong>
                </div>

                <div className="card-body">

                    <form
                        onSubmit={
                            handleTraceVaccination
                        }
                    >

                        <div className="row align-items-end">

                            <div className="col-md-9">

                                <label htmlFor="tracepage-2" className="form-label">
                                    Mã mũi tiêm
                                </label>

                                <input id="tracepage-2"
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    placeholder="Ví dụ: 2"
                                    value={vaccinationId}
                                    onChange={(e) =>
                                        setVaccinationId(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="col-md-3">

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={
                                        loadingVaccination
                                    }
                                >
                                    {loadingVaccination
                                        ? "Đang tra cứu..."
                                        : "Tra cứu"}
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* KET QUA MUI TIEM */}

            {vaccinationResult && (

                <div className="card shadow-sm">

                    <div className="card-header">
                        <strong>
                            Kết quả truy vết mũi tiêm
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
                                        vaccinationResult
                                            .MaMuiTiem
                                    }
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Người dân
                                </strong>

                                <div>
                                    {
                                        vaccinationResult
                                            .HoTen
                                    }
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Vaccine
                                </strong>

                                <div>
                                    {
                                        vaccinationResult
                                            .TenVaccine
                                    }
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Mã lô
                                </strong>

                                <div>
                                    {
                                        vaccinationResult
                                            .MaLoVaccine
                                    }
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Mũi số
                                </strong>

                                <div>
                                    {
                                        vaccinationResult
                                            .MuiSo
                                    }
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Ngày tiêm
                                </strong>

                                <div>
                                    {formatDate(
                                        vaccinationResult
                                            .NgayTiem
                                    )}
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Ngày sản xuất lô
                                </strong>

                                <div>
                                    {formatDate(
                                        vaccinationResult
                                            .NgaySanXuat
                                    )}
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Hạn sử dụng lô
                                </strong>

                                <div>
                                    {formatDate(
                                        vaccinationResult
                                            .HanSuDung
                                    )}
                                </div>

                            </div>


                            <div className="col-md-4 mb-3">

                                <strong>
                                    Nhân viên ghi nhận
                                </strong>

                                <div>
                                    {
                                        vaccinationResult
                                            .NhanVienGhiNhan ||
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

export default TracePage;
