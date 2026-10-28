import api from "./api";

const getMyNotifications = async () => {
    const response = await api.get(
        "/notifications/me"
    );

    return response.data;
};

const markAsRead = async (id) => {
    const response = await api.patch(
        `/notifications/me/${id}/read`
    );

    return response.data;
};

export default {
    getMyNotifications,
    markAsRead,
};
