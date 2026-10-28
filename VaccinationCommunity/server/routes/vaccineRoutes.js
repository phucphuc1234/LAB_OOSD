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


// Nhân viên và Admin được thêm
router.post(
    "/",
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    ),
    vaccineController.createVaccine
);


// Nhân viên và Admin được sửa
router.put(
    "/:id",
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    ),
    vaccineController.updateVaccine
);


// Nhân viên và Admin đổi trạng thái
router.patch(
    "/:id/status",
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    ),
    vaccineController.changeStatus
);


module.exports = router;
