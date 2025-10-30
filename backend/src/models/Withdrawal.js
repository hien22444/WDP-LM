const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true
    },
    
    // Bank account info
    bankAccount: {
      accountNumber: String,
      accountName: String,
      bankName: String,
      bankCode: String,
      branch: String
    },
    
    // Transaction info
    transactionId: String,
    transferMethod: { type: String, enum: ["bank_transfer", "manual"], default: "manual" },
    
    // Admin info
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    processedAt: Date,
    notes: String,
    
    // Failure info
    failureReason: String,
    failureDetails: String
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "withdrawals",
  }
);

// Indexes
WithdrawalSchema.index({ tutor: 1, status: 1 });
WithdrawalSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);

