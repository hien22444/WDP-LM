const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, requireAdmin } = require("../middlewares/auth");

// Admin authentication middleware
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard stats
router.get("/dashboard/stats", adminController.getDashboardStats);

// User management
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.put("/users/:id/status", adminController.updateUserStatus);
router.patch("/users/:id/role", adminController.updateUserRole);
router.delete("/users/:id", adminController.deleteUser);
router.put("/users/:id/block", adminController.blockUser);
router.put("/users/:id/ban", adminController.banUser);

// Tutor management
router.get("/tutors", adminController.getTutors);
router.get("/tutors/:id", adminController.getTutorById);
router.put("/tutors/:id/verification", adminController.updateTutorVerification);
router.put("/tutors/:id/status", adminController.updateTutorStatus);

// Booking management
router.get("/bookings", adminController.getBookings);
router.get("/bookings/:id", adminController.getBookingById);
router.put("/bookings/:id/status", adminController.updateBookingStatus);

// Reports
router.get("/reports/revenue", adminController.getRevenueReport);
router.get("/reports/users", adminController.getUserReport);
router.get("/reports/tutors", adminController.getTutorReport);

module.exports = router;
