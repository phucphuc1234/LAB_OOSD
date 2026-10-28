const express = require("express");

const contraindicationController =
    require(
        "../controllers/contraindicationController"
    );

const authenticate =
    require(
        "../middlewares/authMiddleware"
    );

const authorizeRoles =
    require(
        "../middlewares/roleMiddleware"
    );


const router = express.Router();


router.use(authenticate);


// Người dân xem chống chỉ định của mình
router.get(
    "/me",
    authorizeRoles("Người dân"),
    contraindicationController
        .getMyContraindications
);


// Nhân viên xem toàn bộ
router.get(
    "/",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    contraindicationController.getAll
);


// Nhân viên xem chi tiết
router.get(
    "/:id",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    contraindicationController.getById
);


// Nhân viên ghi nhận
router.post(
    "/",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    contraindicationController
        .createContraindication
);


// Nhân viên cập nhật
router.put(
    "/:id",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    contraindicationController
        .updateContraindication
);


module.exports = router;
