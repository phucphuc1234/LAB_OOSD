import {
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";

import CitizenHome from "../pages/citizen/CitizenHome";
import StaffHome from "../pages/staff/StaffHome";
import AdminHome from "../pages/admin/AdminHome";

import CitizenLayout from "../layouts/CitizenLayout";
import StaffLayout from "../layouts/StaffLayout";
import AdminLayout from "../layouts/AdminLayout";

import ProtectedRoute
    from "../components/common/ProtectedRoute";
import ProfilePage
    from "../pages/citizen/ProfilePage";
import SchedulePage
    from "../pages/citizen/SchedulePage";
import HistoryPage
    from "../pages/citizen/HistoryPage";
import ContraindicationPage
    from "../pages/citizen/ContraindicationPage";
import NotificationPage
    from "../pages/citizen/NotificationPage";
import CitizenManagementPage
    from "../pages/staff/CitizenManagementPage";
import VaccineManagementPage
    from "../pages/staff/VaccineManagementPage";
import BatchManagementPage
    from "../pages/staff/BatchManagementPage";
import ScheduleManagementPage
    from "../pages/staff/ScheduleManagementPage";
import VaccinationManagementPage
    from "../pages/staff/VaccinationManagementPage";
import ContraindicationManagementPage
    from "../pages/staff/ContraindicationManagementPage";
import HistoryLookupPage
    from "../pages/staff/HistoryLookupPage";
import TracePage
    from "../pages/staff/TracePage";
import ChangePasswordPage
    from "../pages/auth/ChangePasswordPage";
import UserManagementPage
    from "../pages/admin/UserManagementPage";
import RegisterPage
    from "../pages/auth/RegisterPage";
import PostVaccinationPage from "../pages/citizen/PostVaccinationPage";
import FollowupManagementPage from "../pages/staff/FollowupManagementPage";
function AppRoutes() {
    return (
        <Routes>

            <Route
                path="/"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

            <Route
                path="/login"
                element={<LoginPage />}
            />
            <Route
                path="/register"
                element={<RegisterPage />}
            />
            {/* Người dân */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["Người dân"]}
                    />
                }
            >
                <Route
                    path="/citizen"
                    element={<CitizenLayout />}
                >
                    <Route
                        index
                        element={<CitizenHome />}
                    />

                    <Route
                        path="profile"
                        element={<ProfilePage />}
                    />
                    <Route path="post-vaccination" element={<PostVaccinationPage />} />
                    <Route
                        path="schedules"
                        element={<SchedulePage />}
                    />
                    <Route
                        path="history"
                        element={<HistoryPage />}
                    />
                    <Route
                        path="contraindications"
                        element={<ContraindicationPage />}
                    />
                    <Route
                        path="notifications"
                        element={<NotificationPage />}
                    />
                    <Route
                        path="change-password"
                        element={<ChangePasswordPage />}
                    />
                </Route>
            </Route>


            {/* Nhân viên */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["Nhân viên"]}
                    />
                }
            >
                <Route
                    path="/staff"
                    element={<StaffLayout />}
                >
                    <Route
                        index
                        element={<StaffHome />}
                    />
                    <Route
                        path="citizens"
                        element={<CitizenManagementPage />}
                    />
                    <Route path="followups" element={<FollowupManagementPage />} />
                    <Route
                        path="vaccines"
                        element={<VaccineManagementPage />}
                    />
                    <Route
                        path="batches"
                        element={<BatchManagementPage />}
                    />
                    <Route
                        path="schedules"
                        element={<ScheduleManagementPage />}
                    />
                    <Route
                        path="vaccinations"
                        element={<VaccinationManagementPage />}
                    />
                    <Route
                        path="contraindications"
                        element={<ContraindicationManagementPage />}
                    />
                    <Route
                        path="history"
                        element={<HistoryLookupPage />}
                    />
                    <Route
                        path="trace"
                        element={<TracePage />}
                    />
                    <Route
                        path="change-password"
                        element={<ChangePasswordPage />}
                    />
                </Route>
            </Route>


            {/* Quản trị viên */}
            <Route
                element={
                    <ProtectedRoute
                        allowedRoles={["Quản trị viên"]}
                    />
                }
            >
                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        index
                        element={<AdminHome />}
                    />
                    <Route
                        path="users"
                        element={<UserManagementPage />}
                    />
                    <Route path="followups" element={<FollowupManagementPage />} />
                    <Route path="citizens" element={<CitizenManagementPage />} />
                    <Route path="schedules" element={<ScheduleManagementPage />} />
                    <Route path="vaccinations" element={<VaccinationManagementPage />} />
                    <Route path="contraindications" element={<ContraindicationManagementPage />} />
                    <Route path="history" element={<HistoryLookupPage />} />
                    <Route
                        path="change-password"
                        element={<ChangePasswordPage />}
                    />
                    <Route
                        path="vaccines"
                        element={<VaccineManagementPage />}
                    />

                    <Route
                        path="batches"
                        element={<BatchManagementPage />}
                    />

                    <Route
                        path="trace"
                        element={<TracePage />}
                    />
                </Route>
            </Route>


            <Route
                path="*"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

        </Routes>
    );
}

export default AppRoutes;
