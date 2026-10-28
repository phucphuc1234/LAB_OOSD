const express = require("express");

const userController =
    require("../controllers/userController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


router.use(authenticate);

router.use(
    authorizeRoles("Quản trị viên")
);


// Danh sách tài khoản
router.get(
    "/",
    userController.getAllUsers
);


// Chi tiết tài khoản
router.get(
    "/:id",
    userController.getUserById
);


// Khóa / mở khóa
router.patch(
    "/:id/status",
    userController.changeStatus
);


// Phân quyền
router.patch(
    "/:id/role",
    userController.changeRole
);


module.exports = router;
