const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    tutorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    mode: { type: String, enum: ["online", "offline"], required: true },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled", "completed"], default: "pending", index: true },
    notes: { type: String, default: null },
    paymentStatus: { type: String, enum: ["none", "prepaid", "postpaid", "escrow"], default: "none" },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSession", default: null }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "bookings",
  }
);

BookingSchema.index({ start: 1, tutorProfile: 1 });

module.exports = mongoose.model("Booking", BookingSchema);


