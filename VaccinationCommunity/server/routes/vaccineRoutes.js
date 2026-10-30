const express = require("express");

const vaccineController =
    require("../controllers/vaccineController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


// Phải đăng nhập
router.use(authenticate);


// Tất cả người đăng nhập được xem vaccine
router.get(
    "/",
    vaccineController.getAllVaccines
);


router.get(
    "/:id",
    vaccineController.getVaccineById
);


// Global catalog is managed by admin; staff manage offerings at assigned sites.
router.post(
    "/",
    authorizeRoles(
        "Quản trị viên"
    ),
    vaccineController.createVaccine
);


// Chỉ Admin sửa danh mục dùng chung.
router.put(
    "/:id",
    authorizeRoles(
        "Quản trị viên"
    ),
    vaccineController.updateVaccine
);


// Chỉ Admin đổi trạng thái danh mục dùng chung.
router.patch(
    "/:id/status",
    authorizeRoles(
        "Quản trị viên"
    ),
    vaccineController.changeStatus
);


module.exports = router;
