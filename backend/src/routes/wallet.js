const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const TutorProfile = require("../models/TutorProfile");
const Withdrawal = require("../models/Withdrawal");

// Get wallet balance
router.get("/balance", auth(), async (req, res) => {
  try {
    const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
    
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    res.json({
      earnings: tutorProfile.earnings || {
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0
      },
      bankAccount: tutorProfile.bankAccount || null
    });
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update bank account
router.put("/bank-account", auth(), async (req, res) => {
  try {
    const { accountNumber, accountName, bankName, bankCode, branch } = req.body;
    
    const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    tutorProfile.bankAccount = {
      accountNumber,
      accountName,
      bankName,
      bankCode,
      branch
    };
    
    await tutorProfile.save();
    
    res.json({ 
      message: "Đã cập nhật thông tin tài khoản",
      bankAccount: tutorProfile.bankAccount
    });
  } catch (error) {
    console.error("Error updating bank account:", error);
    res.status(500).json({ message: error.message });
  }
});

// Request withdrawal
router.post("/withdraw", auth(), async (req, res) => {
  try {
    const { amount } = req.body;
    
    const tutorProfile = await TutorProfile.findOne({ user: req.user.id });
    if (!tutorProfile) {
      return res.status(404).json({ message: "Tutor profile not found" });
    }

    // Check balance
    const availableBalance = tutorProfile.earnings?.availableBalance || 0;
    if (amount > availableBalance) {
      return res.status(400).json({
        message: `Không đủ số dư. Số dư hiện tại: ${availableBalance} VNĐ`
      });
    }

    // Check minimum amount
    const MIN_AMOUNT = 50000; // 50k minimum
    if (amount < MIN_AMOUNT) {
      return res.status(400).json({
        message: `Số tiền tối thiểu: ${MIN_AMOUNT.toLocaleString('vi-VN')} VNĐ`
      });
    }

    // Check bank account
    if (!tutorProfile.bankAccount?.accountNumber) {
      return res.status(400).json({
        message: "Vui lòng cập nhật thông tin tài khoản ngân hàng",
        requiredAction: "update_bank_account"
      });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      tutor: req.user.id,
      amount,
      bankAccount: tutorProfile.bankAccount,
      status: "pending",
      transferMethod: "manual"
    });

    res.json({
      message: "Yêu cầu rút tiền đã được tạo",
      withdrawal: {
        _id: withdrawal._id,
        amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get withdrawal history
router.get("/withdrawals", auth(), async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ tutor: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ withdrawals });
  } catch (error) {
    console.error("Error getting withdrawals:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get single withdrawal
router.get("/withdrawals/:id", auth(), async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findOne({
      _id: req.params.id,
      tutor: req.user.id
    });
    
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    
    res.json({ withdrawal });
  } catch (error) {
    console.error("Error getting withdrawal:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

