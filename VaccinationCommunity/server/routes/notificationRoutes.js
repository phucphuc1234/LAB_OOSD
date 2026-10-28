const express = require("express");

const notificationController =
    require(
        "../controllers/notificationController"
    );

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


router.use(authenticate);


// Người dân xem thông báo
router.get(
    "/me",
    authorizeRoles("Người dân"),
    notificationController
        .getMyNotifications
);


// Người dân đánh dấu đã đọc
router.patch(
    "/me/:id/read",
    authorizeRoles("Người dân"),
    notificationController
        .markAsRead
);


// Admin chạy chức năng tạo thông báo
router.post(
    "/generate",
    authorizeRoles("Quản trị viên"),
    notificationController
        .generateReminders
);


module.exports = router;
