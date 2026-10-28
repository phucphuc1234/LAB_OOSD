import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";
import citizenService
    from "../../services/citizenService";

function CitizenManagementPage() {
    const [citizens, setCitizens] =
        useState([]);

    const [filteredCitizens, setFilteredCitizens] =
        useState([]);

    const [selectedCitizen, setSelectedCitizen] =
        useState(null);

    const [keyword, setKeyword] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [detailLoading, setDetailLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    const loadCitizens = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await citizenService
                    .getAllCitizens();

            const data =
                response.data || [];

            setCitizens(data);
            setFilteredCitizens(data);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải danh sách người dân."
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadCitizens();
    }, []);


    useEffect(() => {
        const value =
            keyword.toLowerCase().trim();

        if (!value) {
            setFilteredCitizens(citizens);
            return;
        }

        const filtered =
            citizens.filter((item) => {

                const hoTen =
                    item.HoTen?.toLowerCase() || "";

                const cccd =
                    item.CCCD?.toLowerCase() || "";

                const phone =
                    item.SoDienThoai?.toLowerCase() || "";

                const email =
                    item.Email?.toLowerCase() || "";

                return (
                    hoTen.includes(value) ||
                    cccd.includes(value) ||
                    phone.includes(value) ||
                    email.includes(value)
                );
            });

        setFilteredCitizens(filtered);

    }, [keyword, citizens]);


    const handleViewDetail = async (id) => {
        try {
            setDetailLoading(true);
            setError("");

            const response =
                await citizenService
                    .getCitizenById(id);

            setSelectedCitizen(
                response.data
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải chi tiết người dân."
            );
        } finally {
            setDetailLoading(false);
        }
    };


    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date)
            .toLocaleDateString("vi-VN");
    };


    if (loading) {
        return (
            <div className="text-center py-5">
                Đang tải danh sách người dân...
            </div>
        );
    }


    return (
        <div>

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>
                    <h2>
                        Quản lý người dân
                    </h2>

                    <p className="text-muted mb-0">
                        Tra cứu và xem hồ sơ người dân
                    </p>
                </div>

                <span className="badge bg-success fs-6">
                    Tổng: {citizens.length}
                </span>

            </div>


            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}


            <div className="card shadow-sm mb-4">
                <div className="card-body">

                    <label htmlFor="citizenmanagementpage-1" className="form-label">
                        Tìm kiếm người dân
                    </label>

                    <input id="citizenmanagementpage-1"
                        type="text"
                        className="form-control"
                        placeholder="Nhập họ tên, CCCD, số điện thoại hoặc email..."
                        value={keyword}
                        onChange={(e) =>
                            setKeyword(
                                e.target.value
                            )
                        }
                    />

                </div>
            </div>


            <div className="card shadow-sm">

                <div className="card-body">

                    {filteredCitizens.length === 0 ? (

                        <EmptyState title="Không tìm thấy hồ sơ phù hợp" description="Thử thay đổi từ khóa hoặc kiểm tra lại thông tin người dân." />

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã</th>
                                        <th>Họ tên</th>
                                        <th>Ngày sinh</th>
                                        <th>Giới tính</th>
                                        <th>CCCD</th>
                                        <th>Điện thoại</th>
                                        <th>Email</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredCitizens.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaNguoiDan
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaNguoiDan
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
                                                    {formatDate(
                                                        item.NgaySinh
                                                    )}
                                                </td>

                                                <td>
                                                    {
                                                        item.GioiTinh ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.CCCD ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.SoDienThoai ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        item.Email ||
                                                        "-"
                                                    }
                                                </td>

                                                <td>

                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() =>
                                                            handleViewDetail(
                                                                item.MaNguoiDan
                                                            )
                                                        }
                                                    >
                                                        Xem chi tiết
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


            {detailLoading && (
                <div className="alert alert-info mt-4">
                    Đang tải chi tiết...
                </div>
            )}


            {selectedCitizen && !detailLoading && (

                <div className="card shadow-sm mt-4">

                    <div className="card-header d-flex justify-content-between align-items-center">

                        <strong>
                            Chi tiết người dân
                        </strong>

                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                                setSelectedCitizen(null)
                            }
                        >
                            Đóng
                        </button>

                    </div>

                    <div className="card-body">

                        <div className="row">

                            <div className="col-md-4 mb-3">
                                <strong>
                                    Mã người dân
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.MaNguoiDan
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Họ tên
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.HoTen
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Ngày sinh
                                </strong>

                                <div>
                                    {formatDate(
                                        selectedCitizen.NgaySinh
                                    )}
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Giới tính
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.GioiTinh ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    CCCD
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.CCCD ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Số BHYT
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.SoBHYT ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Điện thoại
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.SoDienThoai ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Email
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.Email ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4 mb-3">
                                <strong>
                                    Trạng thái
                                </strong>

                                <div>
                                    <span
                                        className={
                                            selectedCitizen.TrangThai
                                                ? "badge bg-success"
                                                : "badge bg-secondary"
                                        }
                                    >
                                        {
                                            selectedCitizen.TrangThai
                                                ? "Hoạt động"
                                                : "Ngừng hoạt động"
                                        }
                                    </span>
                                </div>
                            </div>


                            <div className="col-12 mb-3">
                                <strong>
                                    Địa chỉ
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.DiaChi ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4">
                                <strong>
                                    Phường / Xã
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.PhuongXa ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4">
                                <strong>
                                    Quận / Huyện
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.QuanHuyen ||
                                        "-"
                                    }
                                </div>
                            </div>


                            <div className="col-md-4">
                                <strong>
                                    Tỉnh / Thành phố
                                </strong>

                                <div>
                                    {
                                        selectedCitizen.TinhThanh ||
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

export default CitizenManagementPage;
