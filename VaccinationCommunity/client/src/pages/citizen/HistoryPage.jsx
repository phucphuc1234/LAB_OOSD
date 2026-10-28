import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";
import historyService from "../../services/historyService";

function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await historyService.getMyHistory();

            setHistory(response.data || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải lịch sử tiêm."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString(
            "vi-VN"
        );
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                Đang tải lịch sử tiêm...
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h2>Lịch sử tiêm chủng</h2>

                <p className="text-muted">
                    Theo dõi các mũi vaccine đã tiêm
                </p>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {!error && history.length === 0 && (
                <EmptyState title="Chưa có lịch sử tiêm chủng" description="Các mũi tiêm được ghi nhận tại cơ sở sẽ hiển thị trong hồ sơ của bạn." />
            )}

            {history.length > 0 && (
                <div className="card shadow-sm">
                    <div className="card-body">

                        <div className="table-responsive">
                            <table className="table table-hover align-middle">

                                <thead className="table-light">
                                    <tr>
                                        <th>Mã mũi</th>
                                        <th>Vaccine</th>
                                        <th>Lô vaccine</th>
                                        <th>Mũi số</th>
                                        <th>Ngày tiêm</th>
                                        <th>Cơ sở tiêm</th>
                                        <th>Nhân viên ghi nhận</th>
                                        <th>Kết quả</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.MaMuiTiem}>
                                            <td>
                                                {item.MaMuiTiem}
                                            </td>

                                            <td>
                                                <strong>
                                                    {item.TenVaccine}
                                                </strong>
                                            </td>

                                            <td>
                                                {item.MaLoVaccine}
                                            </td>

                                            <td>
                                                {item.MuiSo}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    item.NgayTiem
                                                )}
                                            </td>

                                            <td>
                                                {item.CoSoTiem || "-"}
                                            </td>

                                            <td>
                                                {
                                                    item.NhanVienGhiNhan ||
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
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoryPage;
