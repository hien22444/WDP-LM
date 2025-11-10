const router = require("express").Router();
const { auth, requireAdmin } = require("../middlewares/auth");
const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");
const User = require("../models/User");

// Get all contracts with filters
router.get("/", auth(), requireAdmin, async (req, res) => {
  try {
    const {
      status,
      contractSigned,
      search,
      page = 1,
      limit = 20,
      sortBy = "created_at",
      sortOrder = "desc"
    } = req.query;

    const filter = {};

    // Filter by status
    if (status && status !== "all") {
      filter.status = status;
    }

    // Filter by contract signed
    if (contractSigned !== undefined) {
      filter.contractSigned = contractSigned === "true";
    }

    // Search by contract number, student name, or tutor name
    if (search) {
      const searchRegex = new RegExp(search, "i");
      const users = await User.find({
        $or: [
          { email: searchRegex },
          { "profile.full_name": searchRegex }
        ]
      }).select("_id");
      
      const userIds = users.map(u => u._id);
      
      filter.$or = [
        { contractNumber: searchRegex },
        { "contractData.studentName": searchRegex },
        { student: { $in: userIds } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [contracts, total] = await Promise.all([
      Booking.find(filter)
        .populate({
          path: "student",
          select: "email profile phone"
        })
        .populate({
          path: "tutorProfile",
          populate: {
            path: "user",
            select: "email profile phone"
          }
        })
        .populate("sessionId")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(filter)
    ]);

    res.json({
      contracts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("❌ Error fetching contracts:", error);
    res.status(500).json({ message: "Failed to fetch contracts", error: error.message });
  }
});

// Get contracts by user ID
router.get("/user/:userId", auth(), requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🔍 Fetching contracts for user:", userId);
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ 
        message: "Invalid user ID",
        contracts: [],
        total: 0
      });
    }
    
    const contracts = await Booking.find({ student: userId })
      .populate({
        path: "tutorProfile",
        populate: {
          path: "user",
          select: "email profile phone"
        }
      })
      .populate("sessionId")
      .sort({ created_at: -1 })
      .lean();

    console.log(`✅ Found ${contracts.length} contracts for user ${userId}`);
    res.json({ contracts, total: contracts.length });
  } catch (error) {
    console.error("❌ Error fetching user contracts:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ 
      message: "Failed to fetch user contracts", 
      error: error.message,
      contracts: [],
      total: 0
    });
  }
});

// Get contract statistics (must be before /:id route)
router.get("/stats/overview", auth(), requireAdmin, async (req, res) => {
  try {
    const [
      totalContracts,
      signedContracts,
      pendingContracts,
      activeContracts,
      completedContracts,
      disputedContracts,
      totalRevenue,
      platformRevenue
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ contractSigned: true }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: { $in: ["accepted", "in_progress"] } }),
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "disputed" }),
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: { $multiply: ["$price", 0.15] } } } }
      ])
    ]);

    res.json({
      stats: {
        totalContracts,
        signedContracts,
        pendingContracts,
        activeContracts,
        completedContracts,
        disputedContracts,
        totalRevenue: totalRevenue[0]?.total || 0,
        platformRevenue: platformRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("❌ Error fetching contract stats:", error);
    res.status(500).json({ message: "Failed to fetch contract stats", error: error.message });
  }
});

// Export contracts to CSV (must be before /:id route)
router.get("/export/csv", auth(), requireAdmin, async (req, res) => {
  try {
    const contracts = await Booking.find()
      .populate({
        path: "student",
        select: "email profile phone"
      })
      .populate({
        path: "tutorProfile",
        populate: {
          path: "user",
          select: "email profile phone"
        }
      })
      .lean();

    // Convert to CSV format
    const csvHeader = "Contract Number,Student Name,Student Email,Tutor Name,Tutor Email,Status,Price,Payment Status,Start Date,End Date,Signed,Created At\n";
    
    const csvRows = contracts.map(c => {
      const studentName = c.contractData?.studentName || c.student?.profile?.full_name || "N/A";
      const studentEmail = c.contractData?.studentEmail || c.student?.email || "N/A";
      const tutorName = c.tutorProfile?.user?.profile?.full_name || c.tutorProfile?.user?.email || "N/A";
      const tutorEmail = c.tutorProfile?.user?.email || "N/A";
      
      return [
        c.contractNumber || c._id,
        studentName,
        studentEmail,
        tutorName,
        tutorEmail,
        c.status,
        c.price || 0,
        c.paymentStatus,
        new Date(c.start).toISOString(),
        new Date(c.end).toISOString(),
        c.contractSigned ? "Yes" : "No",
        new Date(c.created_at).toISOString()
      ].join(",");
    }).join("\n");

    const csv = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=contracts-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error("❌ Error exporting contracts:", error);
    res.status(500).json({ message: "Failed to export contracts", error: error.message });
  }
});

// Get contract by ID (must be after static routes)
router.get("/:id", auth(), requireAdmin, async (req, res) => {
  try {
    const contract = await Booking.findById(req.params.id)
      .populate({
        path: "student",
        select: "email profile phone"
      })
      .populate({
        path: "tutorProfile",
        populate: {
          path: "user",
          select: "email profile phone"
        }
      })
      .populate("sessionId")
      .lean();

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    res.json({ contract });
  } catch (error) {
    console.error("❌ Error fetching contract:", error);
    res.status(500).json({ message: "Failed to fetch contract", error: error.message });
  }
});

// Update contract status (admin override)
router.patch("/:id/status", auth(), requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    const validStatuses = ["pending", "accepted", "rejected", "cancelled", "completed", "in_progress", "disputed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const contract = await Booking.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    contract.status = status;
    
    if (status === "cancelled" && !contract.cancelledBy) {
      contract.cancelledBy = "admin";
      contract.cancelledAt = new Date();
      contract.cancellationReason = adminNote || "Cancelled by admin";
    }

    if (status === "completed" && !contract.completedAt) {
      contract.completedAt = new Date();
    }

    await contract.save();

    res.json({ 
      message: "Contract status updated successfully",
      contract 
    });
  } catch (error) {
    console.error("❌ Error updating contract status:", error);
    res.status(500).json({ message: "Failed to update contract status", error: error.message });
  }
});

// Delete contract (soft delete - mark as cancelled)
router.delete("/:id", auth(), requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    const contract = await Booking.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    contract.status = "cancelled";
    contract.cancelledBy = "admin";
    contract.cancelledAt = new Date();
    contract.cancellationReason = reason || "Deleted by admin";

    await contract.save();

    res.json({ 
      message: "Contract deleted successfully",
      contract 
    });
  } catch (error) {
    console.error("❌ Error deleting contract:", error);
    res.status(500).json({ message: "Failed to delete contract", error: error.message });
  }
});

module.exports = router;

