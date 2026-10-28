const express = require("express");

const authController =
    require("../controllers/authController");

const authenticate =
    require("../middlewares/authMiddleware");


const router = express.Router();


router.post(
    "/register",
    authController.register
);


router.post(
    "/login",
    authController.login
);


router.post(
    "/logout",
    authenticate,
    authController.logout
);
router.patch(
    "/change-password",
    authenticate,
    authController.changePassword
);

module.exports = router;
