const express = require("express");

const traceController =
    require("../controllers/traceController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


router.use(authenticate);

router.use(
    authorizeRoles(
        "Nhân viên",
        "Quản trị viên"
    )
);


// Truy bằng ID lô
router.get(
    "/batch/:id",
    traceController.traceBatchById
);


// Truy bằng mã lô
router.get(
    "/batch-code/:code",
    traceController.traceBatchByCode
);


// Từ mũi tiêm -> lô vaccine
router.get(
    "/vaccination/:id",
    traceController.traceVaccination
);


module.exports = router;
