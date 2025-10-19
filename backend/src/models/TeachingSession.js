const mongoose = require("mongoose");

const TeachingSessionSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    tutorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "TutorProfile", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    courseName: { type: String, required: true, trim: true },
    mode: { type: String, enum: ["online", "offline"], required: true },
    location: { type: String, default: null },
    meetingLink: { type: String, default: null }, // For online sessions
    status: { 
      type: String, 
      enum: ["scheduled", "ongoing", "completed", "cancelled", "no_show"], 
      default: "scheduled",
      index: true 
    },
    notes: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: null },
    attendance: {
      studentJoined: { type: Boolean, default: false },
      tutorJoined: { type: Boolean, default: false },
      joinTimes: {
        student: { type: Date, default: null },
        tutor: { type: Date, default: null }
      }
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "teaching_sessions",
  }
);

TeachingSessionSchema.index({ startTime: 1, status: 1 });
TeachingSessionSchema.index({ student: 1, startTime: 1 });
TeachingSessionSchema.index({ tutorProfile: 1, startTime: 1 });

module.exports = mongoose.model("TeachingSession", TeachingSessionSchema);
