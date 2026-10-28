const express = require("express");

const batchController =
    require("../controllers/batchController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


router.use(authenticate);


// Nhân viên và Admin mới được quản lý lô
router.use(
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    )
);


router.get(
    "/",
    batchController.getAllBatches
);


router.get(
    "/:id",
    batchController.getBatchById
);


router.post(
    "/",
    batchController.createBatch
);


router.put(
    "/:id",
    batchController.updateBatch
);


router.patch(
    "/:id/status",
    batchController.changeStatus
);


module.exports = router;
