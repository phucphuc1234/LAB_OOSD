import { useEffect, useState } from "react";
import citizenService from "../../services/citizenService";

function ProfilePage() {
    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        soDienThoai: "",
        email: "",
        diaChi: "",
        phuongXa: "",
        quanHuyen: "",
        tinhThanh: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await citizenService.getMyProfile();

            const data = response.data;

            setProfile(data);

            setFormData({
                soDienThoai: data.SoDienThoai || "",
                email: data.Email || "",
                diaChi: data.DiaChi || "",
                phuongXa: data.PhuongXa || "",
                quanHuyen: data.QuanHuyen || "",
                tinhThanh: data.TinhThanh || "",
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Không thể tải hồ sơ."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            await citizenService.updateMyProfile(
                formData
            );

            setMessage(
                "Cập nhật hồ sơ thành công."
            );

            await loadProfile();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Cập nhật hồ sơ thất bại."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                Đang tải hồ sơ...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="alert alert-danger" role="alert">
                Không tìm thấy hồ sơ người dân.
            </div>
        );
    }

    return (
        <div>
            <div className="mb-4">
                <h2>Hồ sơ cá nhân</h2>

                <p className="text-muted">
                    Xem và cập nhật thông tin cá nhân
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

            <div className="card shadow-sm">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>

                        <h5 className="mb-3">
                            Thông tin cơ bản
                        </h5>

                        <div className="row">

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-1" className="form-label">
                                    Mã người dân
                                </label>

                                <input id="profilepage-1"
                                    className="form-control"
                                    value={profile.MaNguoiDan}
                                    disabled
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-2" className="form-label">
                                    Họ tên
                                </label>

                                <input id="profilepage-2"
                                    className="form-control"
                                    value={profile.HoTen || ""}
                                    disabled
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-3" className="form-label">
                                    Ngày sinh
                                </label>

                                <input id="profilepage-3"
                                    type="date"
                                    className="form-control"
                                    value={
                                        profile.NgaySinh
                                            ? profile.NgaySinh.substring(
                                                0,
                                                10
                                            )
                                            : ""
                                    }
                                    disabled
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-4" className="form-label">
                                    Giới tính
                                </label>

                                <input id="profilepage-4"
                                    className="form-control"
                                    value={profile.GioiTinh || ""}
                                    disabled
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-5" className="form-label">
                                    CCCD
                                </label>

                                <input id="profilepage-5"
                                    className="form-control"
                                    value={profile.CCCD || ""}
                                    disabled
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-6" className="form-label">
                                    Số BHYT
                                </label>

                                <input id="profilepage-6"
                                    className="form-control"
                                    value={profile.SoBHYT || ""}
                                    disabled
                                />
                            </div>

                        </div>

                        <hr />

                        <h5 className="mb-3">
                            Thông tin liên hệ
                        </h5>

                        <div className="row">

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-soDienThoai" className="form-label">
                                    Số điện thoại
                                </label>

                                <input id="profilepage-soDienThoai"
                                    type="text"
                                    className="form-control"
                                    name="soDienThoai"
                                    value={formData.soDienThoai}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="profilepage-email" className="form-label">
                                    Email
                                </label>

                                <input id="profilepage-email"
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-12 mb-3">
                                <label htmlFor="profilepage-diaChi" className="form-label">
                                    Địa chỉ
                                </label>

                                <input id="profilepage-diaChi"
                                    type="text"
                                    className="form-control"
                                    name="diaChi"
                                    value={formData.diaChi}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label htmlFor="profilepage-phuongXa" className="form-label">
                                    Phường / Xã
                                </label>

                                <input id="profilepage-phuongXa"
                                    type="text"
                                    className="form-control"
                                    name="phuongXa"
                                    value={formData.phuongXa}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label htmlFor="profilepage-quanHuyen" className="form-label">
                                    Quận / Huyện
                                </label>

                                <input id="profilepage-quanHuyen"
                                    type="text"
                                    className="form-control"
                                    name="quanHuyen"
                                    value={formData.quanHuyen}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-4 mb-3">
                                <label htmlFor="profilepage-tinhThanh" className="form-label">
                                    Tỉnh / Thành phố
                                </label>

                                <input id="profilepage-tinhThanh"
                                    type="text"
                                    className="form-control"
                                    name="tinhThanh"
                                    value={formData.tinhThanh}
                                    onChange={handleChange}
                                />
                            </div>

                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving
                                ? "Đang lưu..."
                                : "Cập nhật hồ sơ"}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
