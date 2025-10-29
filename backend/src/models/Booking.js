const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    tutorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    mode: { type: String, enum: ["online", "offline"], required: true },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled", "completed", "in_progress", "disputed"], default: "pending", index: true },
    notes: { type: String, default: null },
    paymentStatus: { type: String, enum: ["none", "prepaid", "postpaid", "escrow", "held", "released", "refunded"], default: "none" },
    escrowAmount: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    tutorPayout: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    paymentId: { type: String, default: null },
    cancellationReason: { type: String, default: null },
    cancelledBy: { type: String, enum: ["student", "tutor", "admin"], default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    disputeReason: { type: String, default: null },
    disputeOpenedAt: { type: Date, default: null },
    disputeResolvedAt: { type: Date, default: null },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSession", default: null },
    roomId: { type: String, default: null, index: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSlot", default: null, index: true },
    reminderSent: { type: Boolean, default: false },
    
    // Contract fields
    contractSigned: { type: Boolean, default: false },
    contractNumber: { type: String, default: null },
    studentSignature: { type: String, default: null },
    studentSignedAt: { type: Date, default: null },
    tutorSignature: { type: String, default: null },
    tutorSignedAt: { type: Date, default: null },
    contractData: {
      studentName: { type: String, default: null },
      studentPhone: { type: String, default: null },
      studentEmail: { type: String, default: null },
      studentAddress: { type: String, default: null },
      subject: { type: String, default: null },
      totalSessions: { type: Number, default: 1 },
      sessionDuration: { type: Number, default: 150 },
      weeklySchedule: [{ type: Number }],
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null }
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "bookings",
  }
);

BookingSchema.index({ start: 1, tutorProfile: 1 });

module.exports = mongoose.model("Booking", BookingSchema);


