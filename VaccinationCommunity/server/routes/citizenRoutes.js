const express = require("express");

const citizenController =
    require("../controllers/citizenController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


// Tất cả route bên dưới đều phải đăng nhập
router.use(authenticate);


// Người dân xem hồ sơ của mình
router.get(
    "/me",
    authorizeRoles("Người dân"),
    citizenController.getMyProfile
);


// Người dân cập nhật hồ sơ
router.put(
    "/me",
    authorizeRoles("Người dân"),
    citizenController.updateMyProfile
);


// Nhân viên / Admin xem danh sách
router.get(
    "/",
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    ),
    citizenController.getAllCitizens
);


// Nhân viên / Admin xem chi tiết
router.get(
    "/:id",
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    ),
    citizenController.getCitizenById
);


module.exports = router;
