const router = require("express").Router();
const auth = require("../middlewares/auth");
const dashboardController = require("../controllers/dashboardController");

// Dashboard routes - yêu cầu authentication
router.get("/learner", auth(), dashboardController.getLearnerDashboard);
router.get("/tutor", auth(), dashboardController.getTutorDashboard);
router.get("/admin", auth(), dashboardController.getAdminDashboard);

// General stats - có thể access mà không cần auth
router.get("/stats", dashboardController.getGeneralStats);

// Admin only routes
router.patch("/admin/user-role", auth(), dashboardController.updateUserRole);

module.exports = router;