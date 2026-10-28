import api from "./api";

const login = async (tenDangNhap, matKhau) => {
    const response = await api.post("/auth/login", {
        tenDangNhap,
        matKhau,
    });

    return response.data;
};

const register = async (data) => {
    const response = await api.post(
        "/auth/register",
        data
    );

    return response.data;
};

const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

const saveLogin = (token, user) => {
    localStorage.setItem("token", token);

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );
};

const getCurrentUser = () => {
    try {
        const value = JSON.parse(localStorage.getItem("user") || "null");
        return value && typeof value === "object" && typeof value.tenVaiTro === "string" ? value : null;
    } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
    }
};
const changePassword = async (data) => {
    const response = await api.patch(
        "/auth/change-password",
        data
    );

    return response.data;
};
export default {
    login,
    register,
    logout,
    saveLogin,
    getCurrentUser,
    changePassword,
};
