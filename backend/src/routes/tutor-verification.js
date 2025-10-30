const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const User = require("../models/User");
const multer = require("multer");
const {
  notifyTutorVerificationReceived,
  notifyAdminNewTutorVerification,
} = require("../services/NotificationService");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/verification");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Chỉ cho phép file ảnh (JPG, PNG) hoặc PDF"));
    }
  }
});

// Get verification status
router.get("/status", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow access for users who are tutors OR are in the process of becoming tutors
    if (user.role !== "tutor" && user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    const verification = user.tutor_verification || {};
    
    // Calculate verification score
    let score = 0;
    if (verification.identity_verified) score += 40;
    if (verification.education_verified) score += 40;
    if (verification.certificates_verified) score += 20;

    res.json({
      success: true,
      verification: {
        ...verification,
        verification_score: score
      }
    });

  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({ message: "Failed to get verification status" });
  }
});

// Upload identity documents
router.post("/identity", auth(), upload.fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 }
]), async (req, res) => {
  try {
    const { type } = req.body;
    const { front_image, back_image } = req.files;

    if (!type || !front_image || !back_image) {
      return res.status(400).json({ 
        message: "Type, front_image, and back_image are required" 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow access for users who are tutors OR are in the process of becoming tutors
    if (user.role !== "tutor" && user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Initialize tutor_verification if not exists
    if (!user.tutor_verification) {
      user.tutor_verification = {};
    }

    // Add new identity document
    const identityDoc = {
      type,
      front_image: front_image[0].path,
      back_image: back_image[0].path,
      status: "pending",
      uploaded_at: new Date()
    };

    user.tutor_verification.identity_documents = user.tutor_verification.identity_documents || [];
    user.tutor_verification.identity_documents.push(identityDoc);
    user.tutor_verification.overall_status = "in_progress";

    await user.save();

    res.json({
      success: true,
      message: "Identity documents uploaded successfully",
      document: identityDoc
    });

  } catch (error) {
    console.error("Error uploading identity documents:", error);
    res.status(500).json({ message: "Failed to upload identity documents" });
  }
});

// Upload education documents
router.post("/education", auth(), upload.single("document_image"), async (req, res) => {
  try {
    const { type, institution_name, major, graduation_year, gpa } = req.body;
    const document_image = req.file;

    if (!type || !document_image || !institution_name || !major) {
      return res.status(400).json({ 
        message: "Type, document_image, institution_name, and major are required" 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Allow access for users who are tutors OR are in the process of becoming tutors
    if (user.role !== "tutor" && user.role !== "student") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Initialize tutor_verification if not exists
    if (!user.tutor_verification) {
      user.tutor_verification = {};
    }

    // Add new education document
    const educationDoc = {
      type,
      document_image: document_image.path,
      institution_name,
      major,
      graduation_year: graduation_year ? parseInt(graduation_year) : null,
      gpa,
      status: "pending",
      uploaded_at: new Date()
    };

    user.tutor_verification.education_documents = user.tutor_verification.education_documents || [];
    user.tutor_verification.education_documents.push(educationDoc);
    user.tutor_verification.overall_status = "in_progress";

    await user.save();

    res.json({
      success: true,
      message: "Education document uploaded successfully",
      document: educationDoc
    });

  } catch (error) {
    console.error("Error uploading education document:", error);
    res.status(500).json({ message: "Failed to upload education document" });
  }
});

// Upload certificates
router.post("/certificates", auth(), upload.single("document_image"), async (req, res) => {
  try {
    const { name, type, issuing_organization, issue_date, expiry_date, score } = req.body;
    const document_image = req.file;

    if (!name || !type || !document_image || !issuing_organization) {
      return res.status(400).json({ 
        message: "Name, type, document_image, and issuing_organization are required" 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "tutor") {
      return res.status(403).json({ message: "Only tutors can upload certificates" });
    }

    // Initialize tutor_verification if not exists
    if (!user.tutor_verification) {
      user.tutor_verification = {};
    }

    // Add new certificate
    const certificate = {
      name,
      type,
      document_image: document_image.path,
      issuing_organization,
      issue_date: issue_date ? new Date(issue_date) : null,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
      score,
      status: "pending",
      uploaded_at: new Date()
    };

    user.tutor_verification.certificates = user.tutor_verification.certificates || [];
    user.tutor_verification.certificates.push(certificate);
    user.tutor_verification.overall_status = "in_progress";

    await user.save();

    res.json({
      success: true,
      message: "Certificate uploaded successfully",
      certificate
    });

  } catch (error) {
    console.error("Error uploading certificate:", error);
    res.status(500).json({ message: "Failed to upload certificate" });
  }
});


// Sign commitment
router.post("/commitment", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "tutor") {
      return res.status(403).json({ message: "Only tutors can sign commitment" });
    }

    // Initialize tutor_verification if not exists
    if (!user.tutor_verification) {
      user.tutor_verification = {};
    }

    // Sign commitment
    user.tutor_verification.commitment_signed = true;
    user.tutor_verification.commitment_signed_at = new Date();
    user.tutor_verification.overall_status = "pending_review";

    await user.save();

    res.json({
      success: true,
      message: "Commitment signed successfully"
    });

  } catch (error) {
    console.error("Error signing commitment:", error);
    res.status(500).json({ message: "Failed to sign commitment" });
  }
});

// Submit for review
router.post("/submit", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "tutor") {
      return res.status(403).json({ message: "Only tutors can submit for review" });
    }

    const verification = user.tutor_verification;
    if (!verification) {
      return res.status(400).json({ message: "No verification data found" });
    }

    // Check if all required documents are uploaded
    const hasIdentity = verification.identity_documents && verification.identity_documents.length > 0;
    const hasEducation = verification.education_documents && verification.education_documents.length > 0;
    const hasCommitment = verification.commitment_signed;

    if (!hasIdentity || !hasEducation || !hasCommitment) {
      return res.status(400).json({ 
        message: "Please complete all required verification steps before submitting" 
      });
    }

    // Update status to pending review
    user.tutor_verification.overall_status = "pending_review";
    await user.save();

    // Send notifications (email + in-app)
    try {
      await notifyTutorVerificationReceived(user, user.tutor_verification);
      await notifyAdminNewTutorVerification(user, user.tutor_verification);
    } catch (e) {
      console.warn("Tutor verification email notifications failed:", e.message);
    }

    res.json({
      success: true,
      message: "Verification submitted for review successfully"
    });

  } catch (error) {
    console.error("Error submitting verification:", error);
    res.status(500).json({ message: "Failed to submit verification" });
  }
});

// Delete document
router.delete("/documents/:type/:id", auth(), async (req, res) => {
  try {
    const { type, id } = req.params;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "tutor") {
      return res.status(403).json({ message: "Only tutors can delete documents" });
    }

    const verification = user.tutor_verification;
    if (!verification) {
      return res.status(404).json({ message: "No verification data found" });
    }

    let document = null;
    let documents = null;

    switch (type) {
      case "identity":
        documents = verification.identity_documents;
        break;
      case "education":
        documents = verification.education_documents;
        break;
      case "certificates":
        documents = verification.certificates;
        break;
      default:
        return res.status(400).json({ message: "Invalid document type" });
    }

    if (!documents) {
      return res.status(404).json({ message: "Document type not found" });
    }

    document = documents.find(doc => doc._id.toString() === id);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Remove document from array
    const index = documents.findIndex(doc => doc._id.toString() === id);
    documents.splice(index, 1);

    await user.save();

    res.json({
      success: true,
      message: "Document deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

module.exports = router;
