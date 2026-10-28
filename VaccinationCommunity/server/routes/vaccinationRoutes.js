const express = require("express");

const vaccinationController =
    require("../controllers/vaccinationController");

const authenticate =
    require("../middlewares/authMiddleware");

const authorizeRoles =
    require("../middlewares/roleMiddleware");


const router = express.Router();


router.use(authenticate);


router.get(
    "/:id",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    vaccinationController
        .getVaccinationById
);


router.post(
    "/",
    authorizeRoles("Nhân viên", "Quản trị viên"),
    vaccinationController
        .createVaccination
);


module.exports = router;
