import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";
import contraindicationService
    from "../../services/contraindicationService";

function ContraindicationPage() {
    const [
        contraindications,
        setContraindications
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadContraindications = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await contraindicationService
                    .getMyContraindications();

            setContraindications(
                response.data || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải thông tin chống chỉ định."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContraindications();
    }, []);

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date)
            .toLocaleDateString("vi-VN");
    };

    const getStatusBadge = (status) => {
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
                Đang tải thông tin chống chỉ định...
            </div>
        );
    }

    return (
        <div>

            <div className="mb-4">
                <h2>Chống chỉ định</h2>

                <p className="text-muted">
                    Theo dõi các chống chỉ định
                    đã được nhân viên y tế xác nhận
                </p>
            </div>


            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}


            {!error &&
                contraindications.length === 0 && (
                    <EmptyState title="Chưa có thông tin chống chỉ định" description="Thông tin do nhân viên y tế ghi nhận sẽ hiển thị trong hồ sơ này." />
                )}


            {contraindications.length > 0 && (
                <div className="card shadow-sm">

                    <div className="card-body">

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">
                                    <tr>
                                        <th>Mã</th>
                                        <th>Nội dung</th>
                                        <th>Ngày xác nhận</th>
                                        <th>Người xác nhận</th>
                                        <th>Trạng thái</th>
                                        <th>Ghi chú</th>
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
                                                            item.NoiDung
                                                        }
                                                    </strong>
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
                                                        "-"
                                                    }
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            "badge " +
                                                            getStatusBadge(
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
                                            </tr>
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}

export default ContraindicationPage;
