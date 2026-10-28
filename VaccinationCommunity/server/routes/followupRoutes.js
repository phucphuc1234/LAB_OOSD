const express = require("express");
const controller = require("../controllers/followupController");
const authenticate = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/roleMiddleware");

const router = express.Router();
const citizen = authorizeRoles("Người dân");
const staff = authorizeRoles("Nhân viên", "Quản trị viên");
const everyone = authorizeRoles("Người dân", "Nhân viên", "Quản trị viên");
router.use(authenticate);
router.get("/symptoms", everyone, controller.symptoms);
router.get("/vaccinations/mine", citizen, controller.vaccinations);
router.get("/mine", citizen, controller.mine);
router.post("/mine", citizen, controller.submit);
router.get("/", staff, controller.list);
router.get("/:id", everyone, controller.detail);
router.patch("/:id/review", staff, controller.review);

module.exports = router;
