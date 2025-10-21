const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    orderCode: { type: String, required: true, index: true },
    // Transaction reference for VNPay or other gateways. Some existing DB index
    // expects this field to be present and unique (older migrations created a
    // unique index on vnp_txnref). Ensure we store a non-null value when
    // creating payments to avoid duplicate-null insert errors.
    vnp_txnref: { type: String, default: null },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingSlot",
      default: null,
    },
    amount: { type: Number, required: true },
    productName: { type: String },
    checkoutUrl: { type: String, default: null },
    qrUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },
    metadata: { type: Object, default: {} },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    collection: "payments",
  }
);

module.exports = mongoose.model("Payment", PaymentSchema);
