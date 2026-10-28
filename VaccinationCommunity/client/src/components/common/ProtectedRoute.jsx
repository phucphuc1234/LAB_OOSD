import { Navigate, Outlet } from "react-router-dom";
import authService from "../../services/authService";

function ProtectedRoute({ allowedRoles }) {
    const token = localStorage.getItem("token");
    const user = authService.getCurrentUser();

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.tenVaiTro)
    ) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
