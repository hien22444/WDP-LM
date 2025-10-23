const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const User = require("../models/User");

// Middleware to check admin role
const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Get all pending verifications
router.get("/pending", auth(), adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = "pending_review" } = req.query;
    
    const filter = {
      role: "tutor",
      "tutor_verification.overall_status": status
    };

    const skip = (Number(page) - 1) * Number(limit);
    
    const tutors = await User.find(filter)
      .select("full_name email tutor_verification created_at")
      .sort({ "tutor_verification.verified_at": -1, created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      tutors,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error getting pending verifications:", error);
    res.status(500).json({ message: "Failed to get pending verifications" });
  }
});

// Get verification details for a specific tutor
router.get("/tutor/:tutorId", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    
    const tutor = await User.findById(tutorId)
      .select("full_name email phone_number city tutor_verification created_at")
      .lean();

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (tutor.role !== "tutor") {
      return res.status(400).json({ message: "User is not a tutor" });
    }

    res.json({
      success: true,
      tutor
    });

  } catch (error) {
    console.error("Error getting tutor verification details:", error);
    res.status(500).json({ message: "Failed to get tutor verification details" });
  }
});

// Approve identity verification
router.post("/identity/:tutorId/approve", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { admin_notes = "" } = req.body;
    
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.tutor_verification) {
      return res.status(400).json({ message: "No verification data found" });
    }

    // Update identity verification status
    tutor.tutor_verification.identity_verified = true;
    tutor.tutor_verification.identity_documents.forEach(doc => {
      if (doc.status === "pending") {
        doc.status = "approved";
        doc.admin_notes = admin_notes;
      }
    });

    // Update overall verification score
    let score = 0;
    if (tutor.tutor_verification.identity_verified) score += 40;
    if (tutor.tutor_verification.education_verified) score += 40;
    if (tutor.tutor_verification.certificates_verified) score += 20;
    tutor.tutor_verification.verification_score = score;

    // Check if all verifications are complete
    if (tutor.tutor_verification.identity_verified && 
        tutor.tutor_verification.education_verified) {
      tutor.tutor_verification.overall_status = "approved";
      tutor.tutor_verification.verified_at = new Date();
    }

    await tutor.save();

    res.json({
      success: true,
      message: "Identity verification approved successfully"
    });

  } catch (error) {
    console.error("Error approving identity verification:", error);
    res.status(500).json({ message: "Failed to approve identity verification" });
  }
});

// Reject identity verification
router.post("/identity/:tutorId/reject", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { admin_notes = "" } = req.body;
    
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.tutor_verification) {
      return res.status(400).json({ message: "No verification data found" });
    }

    // Update identity verification status
    tutor.tutor_verification.identity_verified = false;
    tutor.tutor_verification.identity_documents.forEach(doc => {
      if (doc.status === "pending") {
        doc.status = "rejected";
        doc.admin_notes = admin_notes;
      }
    });

    tutor.tutor_verification.overall_status = "rejected";
    await tutor.save();

    res.json({
      success: true,
      message: "Identity verification rejected"
    });

  } catch (error) {
    console.error("Error rejecting identity verification:", error);
    res.status(500).json({ message: "Failed to reject identity verification" });
  }
});

// Approve education verification
router.post("/education/:tutorId/approve", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { admin_notes = "" } = req.body;
    
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.tutor_verification) {
      return res.status(400).json({ message: "No verification data found" });
    }

    // Update education verification status
    tutor.tutor_verification.education_verified = true;
    tutor.tutor_verification.education_documents.forEach(doc => {
      if (doc.status === "pending") {
        doc.status = "approved";
        doc.admin_notes = admin_notes;
      }
    });

    // Update overall verification score
    let score = 0;
    if (tutor.tutor_verification.identity_verified) score += 40;
    if (tutor.tutor_verification.education_verified) score += 40;
    if (tutor.tutor_verification.certificates_verified) score += 20;
    tutor.tutor_verification.verification_score = score;

    // Check if all verifications are complete
    if (tutor.tutor_verification.identity_verified && 
        tutor.tutor_verification.education_verified) {
      tutor.tutor_verification.overall_status = "approved";
      tutor.tutor_verification.verified_at = new Date();
    }

    await tutor.save();

    res.json({
      success: true,
      message: "Education verification approved successfully"
    });

  } catch (error) {
    console.error("Error approving education verification:", error);
    res.status(500).json({ message: "Failed to approve education verification" });
  }
});

// Reject education verification
router.post("/education/:tutorId/reject", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { admin_notes = "" } = req.body;
    
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.tutor_verification) {
      return res.status(400).json({ message: "No verification data found" });
    }

    // Update education verification status
    tutor.tutor_verification.education_verified = false;
    tutor.tutor_verification.education_documents.forEach(doc => {
      if (doc.status === "pending") {
        doc.status = "rejected";
        doc.admin_notes = admin_notes;
      }
    });

    tutor.tutor_verification.overall_status = "rejected";
    await tutor.save();

    res.json({
      success: true,
      message: "Education verification rejected"
    });

  } catch (error) {
    console.error("Error rejecting education verification:", error);
    res.status(500).json({ message: "Failed to reject education verification" });
  }
});

// Approve certificate
router.post("/certificates/:tutorId/:certId/approve", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId, certId } = req.params;
    const { admin_notes = "" } = req.body;
    
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.tutor_verification || !tutor.tutor_verification.certificates) {
      return res.status(400).json({ message: "No certificates found" });
    }

    const certificate = tutor.tutor_verification.certificates.find(cert => 
      cert._id.toString() === certId
    );

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    certificate.status = "approved";
    certificate.admin_notes = admin_notes;

    // Update certificates verification status
    const allCertificatesApproved = tutor.tutor_verification.certificates.every(cert => 
      cert.status === "approved" || cert.status === "rejected"
    );
    
    if (allCertificatesApproved) {
      tutor.tutor_verification.certificates_verified = true;
    }

    // Update overall verification score
    let score = 0;
    if (tutor.tutor_verification.identity_verified) score += 40;
    if (tutor.tutor_verification.education_verified) score += 40;
    if (tutor.tutor_verification.certificates_verified) score += 20;
    tutor.tutor_verification.verification_score = score;

    await tutor.save();

    res.json({
      success: true,
      message: "Certificate approved successfully"
    });

  } catch (error) {
    console.error("Error approving certificate:", error);
    res.status(500).json({ message: "Failed to approve certificate" });
  }
});

// Reject certificate
router.post("/certificates/:tutorId/:certId/reject", auth(), adminAuth, async (req, res) => {
  try {
    const { tutorId, certId } = req.params;
    const { admin_notes = "" } = req.body;
    
    const tutor = await User.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    if (!tutor.tutor_verification || !tutor.tutor_verification.certificates) {
      return res.status(400).json({ message: "No certificates found" });
    }

    const certificate = tutor.tutor_verification.certificates.find(cert => 
      cert._id.toString() === certId
    );

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    certificate.status = "rejected";
    certificate.admin_notes = admin_notes;

    await tutor.save();

    res.json({
      success: true,
      message: "Certificate rejected"
    });

  } catch (error) {
    console.error("Error rejecting certificate:", error);
    res.status(500).json({ message: "Failed to reject certificate" });
  }
});

// Get verification statistics
router.get("/stats", auth(), adminAuth, async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: "tutor" } },
      {
        $group: {
          _id: "$tutor_verification.overall_status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTutors = await User.countDocuments({ role: "tutor" });
    const verifiedTutors = await User.countDocuments({ 
      role: "tutor", 
      "tutor_verification.overall_status": "approved" 
    });

    res.json({
      success: true,
      stats: {
        total: totalTutors,
        verified: verifiedTutors,
        verification_rate: totalTutors > 0 ? (verifiedTutors / totalTutors * 100).toFixed(2) : 0,
        by_status: stats.reduce((acc, stat) => {
          acc[stat._id || "not_started"] = stat.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error("Error getting verification stats:", error);
    res.status(500).json({ message: "Failed to get verification statistics" });
  }
});

module.exports = router;
