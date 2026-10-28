const express = require("express");

const historyController =
    require("../controllers/historyController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


router.use(authenticate);


// Người dân xem lịch sử của mình
router.get(
    "/me",
    authorizeRoles("Người dân"),
    historyController.getMyHistory
);


// Người dân xem chi tiết mũi của mình
router.get(
    "/me/:id",
    authorizeRoles("Người dân"),
    historyController.getMyHistoryDetail
);


// Nhân viên tra cứu theo người dân
router.get(
    "/citizen/:id",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    historyController.getCitizenHistory
);


// Nhân viên xem chi tiết một mũi tiêm
router.get(
    "/detail/:id",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    historyController.getHistoryDetail
);


module.exports = router;
