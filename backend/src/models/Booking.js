const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    // Booking type: single (one-time) or recurring (multiple sessions)
    type: {
      type: String,
      enum: ["single", "recurring"],
      default: "single",
      required: true,
    },

    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorProfile",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // For single bookings
    start: { type: Date },
    end: { type: Date },

    // For recurring bookings
    recurrencePattern: {
      selectedSlots: [{
        dayOfWeek: { type: Number, required: true }, // 0-6 (Sunday-Saturday)
        start: { type: String, required: true }, // "08:00"
        end: { type: String, required: true } // "10:00"
      }],
      startDate: { type: Date },
      endDate: { type: Date },
      numberOfWeeks: { type: Number }
    },

    // Session tracking for recurring bookings
    totalSessionsPlanned: { type: Number, default: 1 },
    completedSessions: { type: Number, default: 0 },
    upcomingSessions: { type: Number, default: 0 },

    mode: { type: String, enum: ["online", "offline"], required: true },
    subject: { type: String, default: null }, // Môn học học sinh đặt
    price: { type: Number, default: 0 }, // Price per session
    totalPrice: { type: Number, default: 0 }, // Total for all sessions
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "cancelled",
        "completed",
        "in_progress",
        "disputed",
      ],
      default: "pending",
      index: true,
    },
    notes: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ["none", "paid"],
      default: "none",
    },
    paymentId: { type: String, default: null },
    cancellationReason: { type: String, default: null },
    cancelledBy: {
      type: String,
      enum: ["student", "tutor", "admin"],
      default: null,
    },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    disputeReason: { type: String, default: null },
    disputeOpenedAt: { type: Date, default: null },
    disputeResolvedAt: { type: Date, default: null },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingSession",
      default: null,
    },
    roomId: { type: String, default: null, index: true },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeachingSlot",
      default: null,
      index: true,
    },
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
      endDate: { type: Date, default: null },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "bookings",
  }
);

BookingSchema.index({ start: 1, tutorProfile: 1 });
BookingSchema.index({ "recurrencePattern.startDate": 1, tutorProfile: 1 });
BookingSchema.index({ type: 1, status: 1 });

// Virtual to get all teaching sessions for this booking
BookingSchema.virtual("sessions", {
  ref: "TeachingSession",
  localField: "_id",
  foreignField: "booking"
});

module.exports = mongoose.model("Booking", BookingSchema);
