const router = require("express").Router();
const ctrl = require("../controllers/authController");
const auth = require("../middlewares/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/google", ctrl.googleLogin);
router.get("/google-config", ctrl.googleConfig);
router.get("/verify", ctrl.verifyAccount);
// (Optional) status check endpoint could be added later if frontend needs polling
router.post("/resend-verification", ctrl.resendVerification);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password", ctrl.resetPassword);
router.post("/verify-otp", ctrl.verifyOTP);
router.post("/resend-otp", ctrl.resendOTP);
router.get("/me", auth(), ctrl.getMe);

module.exports = router;
