import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";
import notificationService
    from "../../services/notificationService";

function NotificationPage() {
    const [notifications, setNotifications] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await notificationService
                    .getMyNotifications();

            setNotifications(
                response.data || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải thông báo."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const handleRead = async (id) => {
        try {
            await notificationService
                .markAsRead(id);

            setNotifications((prev) =>
                prev.map((item) =>
                    item.MaThongBao === id
                        ? {
                            ...item,
                            DaDoc: true,
                        }
                        : item
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể cập nhật thông báo."
            );
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date)
            .toLocaleString("vi-VN");
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                Đang tải thông báo...
            </div>
        );
    }

    return (
        <div>

            <div className="mb-4">
                <h2>Thông báo</h2>

                <p className="text-muted">
                    Theo dõi thông báo và
                    nhắc lịch tiêm chủng
                </p>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {!error &&
                notifications.length === 0 && (
                    <EmptyState title="Chưa có thông báo" description="Nhắc lịch và thông tin liên quan đến hồ sơ của bạn sẽ xuất hiện tại đây." />
                )}

            <div className="row">

                {notifications.map((item) => (
                    <div
                        className="col-12 mb-3"
                        key={item.MaThongBao}
                    >
                        <div
                            className={
                                "card shadow-sm " +
                                (
                                    item.DaDoc
                                        ? ""
                                        : "border-primary"
                                )
                            }
                        >
                            <div className="card-body">

                                <div className="d-flex justify-content-between align-items-start">

                                    <div>
                                        <h5 className="card-title">
                                            {item.TieuDe}
                                        </h5>

                                        {!item.DaDoc && (
                                            <span className="badge bg-primary mb-2">
                                                Chưa đọc
                                            </span>
                                        )}

                                        {item.DaDoc && (
                                            <span className="badge bg-secondary mb-2">
                                                Đã đọc
                                            </span>
                                        )}
                                    </div>

                                    <small className="text-muted">
                                        {formatDate(
                                            item.ThoiGianGui ||
                                            item.NgayTao
                                        )}
                                    </small>

                                </div>

                                <p className="card-text mt-2">
                                    {item.NoiDung}
                                </p>

                                <div className="row text-muted small">

                                    <div className="col-md-4">
                                        Kênh gửi:
                                        {" "}
                                        <strong>
                                            {
                                                item.KenhGui ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="col-md-4">
                                        Trạng thái:
                                        {" "}
                                        <strong>
                                            {
                                                item.TrangThai ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                    <div className="col-md-4">
                                        Mã lịch:
                                        {" "}
                                        <strong>
                                            {
                                                item.MaLichTiem ||
                                                "-"
                                            }
                                        </strong>
                                    </div>

                                </div>

                                {!item.DaDoc && (
                                    <button
                                        className="btn btn-sm btn-primary mt-3"
                                        onClick={() =>
                                            handleRead(
                                                item.MaThongBao
                                            )
                                        }
                                    >
                                        Đánh dấu đã đọc
                                    </button>
                                )}

                            </div>
                        </div>
                    </div>
                ))}

            </div>

        </div>
    );
}

export default NotificationPage;
