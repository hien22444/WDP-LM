const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, default: null, trim: true }, // e.g., Cap 2, IELTS, Beginner
  },
  { _id: false }
);

const AvailabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0=Sun
    start: { type: String, required: true }, // "18:00"
    end: { type: String, required: true }, // "20:00"
  },
  { _id: false }
);

const VerificationSchema = new mongoose.Schema(
  {
    idStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    degreeStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    adminNotes: { type: String, default: null },
  },
  { _id: false }
);

const TutorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
      index: true,
    },

    avatarUrl: { type: String, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },
    dateOfBirth: { type: Date, default: null },
    city: { type: String, default: null },
    district: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 2000 },

    idDocumentUrls: { type: [String], default: [] },
    degreeDocumentUrls: { type: [String], default: [] },

    subjects: { type: [SubjectSchema], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    experiencePlaces: { type: String, default: null },

    teachModes: { type: [String], enum: ["online", "offline"], default: [] },
    languages: { type: [String], default: [] },
    paymentType: {
      type: String,
      enum: ["per_session", "per_month", null],
      default: "per_session",
    },
    sessionRate: { type: Number, default: 0, min: 0 },

    availability: { type: [AvailabilitySlotSchema], default: [] },
    hasAvailability: { type: Boolean, default: false, index: true },

    verification: { type: VerificationSchema, default: () => ({}) },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
      index: true,
    },

    // Rating and review fields
    rating: { type: Number, default: 0, min: 0, max: 5, index: true },
    totalReviews: { type: Number, default: 0, min: 0 },
    ratingCategories: {
      teaching: { type: Number, default: 0, min: 0, max: 5 },
      punctuality: { type: Number, default: 0, min: 0, max: 5 },
      communication: { type: Number, default: 0, min: 0, max: 5 },
      preparation: { type: Number, default: 0, min: 0, max: 5 },
      friendliness: { type: Number, default: 0, min: 0, max: 5 },
    },

    // Wallet/Earnings fields
    earnings: {
      totalEarnings: { type: Number, default: 0, min: 0 },
      availableBalance: { type: Number, default: 0, min: 0 },
      pendingBalance: { type: Number, default: 0, min: 0 },
    },

    // Bank account for payout (optional)
    bankAccount: {
      accountNumber: { type: String, default: null },
      accountName: { type: String, default: null },
      bankName: { type: String, default: null },
      bankCode: { type: String, default: null },
      branch: { type: String, default: null },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "tutor_profiles",
  }
);

module.exports = mongoose.model("TutorProfile", TutorProfileSchema);

// Helpful indexes for search
TutorProfileSchema.index({ city: 1, status: 1 });
TutorProfileSchema.index({ "subjects.name": 1, status: 1 });
TutorProfileSchema.index({ sessionRate: 1 });
