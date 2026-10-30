import { EmptyState } from "../../components/common/DashboardUI";
import { useEffect, useState } from "react";
import userService
    from "../../services/userService";


function UserManagementPage() {

    const [users, setUsers] =
        useState([]);

    const [filteredUsers, setFilteredUsers] =
        useState([]);

    const [keyword, setKeyword] =
        useState("");

    const [selectedUser, setSelectedUser] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [detailLoading, setDetailLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    const loadUsers = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await userService
                    .getAllUsers();

            const data =
                response.data || [];

            setUsers(data);
            setFilteredUsers(data);

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải danh sách tài khoản."
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {
        loadUsers();
    }, []);


    useEffect(() => {

        const value =
            keyword
                .toLowerCase()
                .trim();

        if (!value) {

            setFilteredUsers(users);

            return;
        }


        const filtered =
            users.filter((item) => {

                const username =
                    item.TenDangNhap
                        ?.toLowerCase() || "";

                const email =
                    item.Email
                        ?.toLowerCase() || "";

                const phone =
                    item.SoDienThoai
                        ?.toLowerCase() || "";

                const role =
                    item.TenVaiTro
                        ?.toLowerCase() || "";

                return (
                    username.includes(value) ||
                    email.includes(value) ||
                    phone.includes(value) ||
                    role.includes(value)
                );
            });


        setFilteredUsers(filtered);

    }, [keyword, users]);


    const handleViewDetail = async (id) => {

        try {

            setDetailLoading(true);
            setError("");

            const response =
                await userService
                    .getUserById(id);

            setSelectedUser(
                response.data
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể tải chi tiết tài khoản."
            );

        } finally {

            setDetailLoading(false);
        }
    };


    const handleStatus = async (item) => {

        const newStatus =
            !item.TrangThai;


        const confirmMessage =
            newStatus
                ? `Mở khóa tài khoản ${item.TenDangNhap}?`
                : `Khóa tài khoản ${item.TenDangNhap}?`;


        if (!window.confirm(confirmMessage)) {
            return;
        }


        try {

            setMessage("");
            setError("");

            const response =
                await userService
                    .updateStatus(
                        item.MaTaiKhoan,
                        newStatus
                    );


            setMessage(
                response.message ||
                "Cập nhật trạng thái thành công."
            );


            await loadUsers();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể cập nhật trạng thái."
            );
        }
    };


    const handleRole = async (
        item,
        maVaiTro
    ) => {

        const newRole =
            Number(maVaiTro);


        if (
            newRole ===
            Number(item.MaVaiTro)
        ) {
            return;
        }


        if (
            !window.confirm(
                `Thay đổi quyền của ${item.TenDangNhap}?`
            )
        ) {
            return;
        }


        try {

            setMessage("");
            setError("");


            const response =
                await userService
                    .updateRole(
                        item.MaTaiKhoan,
                        newRole
                    );


            setMessage(
                response.message ||
                "Đã lưu vai trò. Nếu đổi sang vai trò khác, phân công cơ sở cũ được thu hồi; hãy phân công lại khi cấp quyền nhân viên."
            );


            await loadUsers();

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không thể phân quyền tài khoản."
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
                Đang tải danh sách tài khoản...
            </div>
        );
    }


    return (
        <div>

            <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                    <h2>
                        Quản lý tài khoản
                    </h2>

                    <p className="text-muted mb-0">
                        Khóa, mở khóa và phân quyền
                        tài khoản hệ thống
                    </p>

                </div>


                <span className="badge bg-dark fs-6">
                    Tổng: {users.length}
                </span>

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

                <div className="card-body">

                    <label htmlFor="usermanagementpage-1" className="form-label">
                        Tìm kiếm tài khoản
                    </label>

                    <input id="usermanagementpage-1"
                        type="text"
                        className="form-control"
                        placeholder="Tên đăng nhập, email, số điện thoại hoặc vai trò..."
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

                    {filteredUsers.length === 0 ? (

                        <EmptyState title="Không tìm thấy tài khoản" description="Thử thay đổi điều kiện lọc hoặc tên tài khoản cần tìm." />

                    ) : (

                        <div className="table-responsive">

                            <table className="table table-hover align-middle">

                                <thead className="table-light">

                                    <tr>
                                        <th>Mã</th>
                                        <th>Tên đăng nhập</th>
                                        <th>Email</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Đăng nhập cuối</th>
                                        <th>Thao tác</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredUsers.map(
                                        (item) => (

                                            <tr
                                                key={
                                                    item.MaTaiKhoan
                                                }
                                            >

                                                <td>
                                                    {
                                                        item.MaTaiKhoan
                                                    }
                                                </td>


                                                <td>
                                                    <strong>
                                                        {
                                                            item.TenDangNhap
                                                        }
                                                    </strong>
                                                </td>


                                                <td>
                                                    {
                                                        item.Email ||
                                                        "-"
                                                    }
                                                </td>


                                                <td>

                                                    <select
                                                        className="form-select form-select-sm"
                                                        style={{
                                                            minWidth: "150px"
                                                        }}
                                                        value={
                                                            item.MaVaiTro
                                                        }
                                                        onChange={(e) =>
                                                            handleRole(
                                                                item,
                                                                e.target.value
                                                            )
                                                        }
                                                    >

                                                        <option value="1">
                                                            Người dân
                                                        </option>

                                                        <option value="2">
                                                            Nhân viên
                                                        </option>

                                                        <option value="3">
                                                            Quản trị viên
                                                        </option>

                                                    </select>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            item.TrangThai
                                                                ? "badge bg-success"
                                                                : "badge bg-danger"
                                                        }
                                                    >
                                                        {
                                                            item.TrangThai
                                                                ? "Hoạt động"
                                                                : "Đã khóa"
                                                        }
                                                    </span>

                                                </td>


                                                <td>
                                                    {formatDate(
                                                        item.LanDangNhapCuoi
                                                    )}
                                                </td>


                                                <td>

                                                    <button
                                                        className="btn btn-sm btn-outline-primary me-2"
                                                        onClick={() =>
                                                            handleViewDetail(
                                                                item.MaTaiKhoan
                                                            )
                                                        }
                                                    >
                                                        Chi tiết
                                                    </button>


                                                    <button
                                                        className={
                                                            item.TrangThai
                                                                ? "btn btn-sm btn-outline-danger"
                                                                : "btn btn-sm btn-outline-success"
                                                        }
                                                        onClick={() =>
                                                            handleStatus(
                                                                item
                                                            )
                                                        }
                                                    >
                                                        {
                                                            item.TrangThai
                                                                ? "Khóa"
                                                                : "Mở khóa"
                                                        }
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
                    Đang tải chi tiết tài khoản...
                </div>

            )}


            {selectedUser &&
                !detailLoading && (

                    <div className="card shadow-sm mt-4">

                        <div className="card-header d-flex justify-content-between align-items-center">

                            <strong>
                                Chi tiết tài khoản
                            </strong>

                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                    setSelectedUser(null)
                                }
                            >
                                Đóng
                            </button>

                        </div>


                        <div className="card-body">

                            <div className="row">

                                <div className="col-md-4 mb-3">
                                    <strong>
                                        Mã tài khoản
                                    </strong>

                                    <div>
                                        {
                                            selectedUser.MaTaiKhoan
                                        }
                                    </div>
                                </div>


                                <div className="col-md-4 mb-3">
                                    <strong>
                                        Tên đăng nhập
                                    </strong>

                                    <div>
                                        {
                                            selectedUser.TenDangNhap
                                        }
                                    </div>
                                </div>


                                <div className="col-md-4 mb-3">
                                    <strong>
                                        Vai trò
                                    </strong>

                                    <div>
                                        {
                                            selectedUser.TenVaiTro
                                        }
                                    </div>
                                </div>


                                <div className="col-md-6 mb-3">
                                    <strong>
                                        Email
                                    </strong>

                                    <div>
                                        {
                                            selectedUser.Email ||
                                            "-"
                                        }
                                    </div>
                                </div>


                                <div className="col-md-6 mb-3">
                                    <strong>
                                        Số điện thoại
                                    </strong>

                                    <div>
                                        {
                                            selectedUser.SoDienThoai ||
                                            "-"
                                        }
                                    </div>
                                </div>


                                <div className="col-md-4 mb-3">
                                    <strong>
                                        Trạng thái
                                    </strong>

                                    <div>
                                        {
                                            selectedUser.TrangThai
                                                ? "Hoạt động"
                                                : "Đã khóa"
                                        }
                                    </div>
                                </div>


                                <div className="col-md-4 mb-3">
                                    <strong>
                                        Ngày tạo
                                    </strong>

                                    <div>
                                        {formatDate(
                                            selectedUser.NgayTao
                                        )}
                                    </div>
                                </div>


                                <div className="col-md-4 mb-3">
                                    <strong>
                                        Đăng nhập cuối
                                    </strong>

                                    <div>
                                        {formatDate(
                                            selectedUser.LanDangNhapCuoi
                                        )}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                )}

        </div>
    );
}

export default UserManagementPage;
