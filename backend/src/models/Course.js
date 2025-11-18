const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorProfile",
      required: true,
    },
    subject: {
      // Store subject info directly (not reference) since TutorProfile.subjects is embedded
      name: { type: String, required: true },
      level: { type: String, default: null },
      _id: { type: String, required: true }, // ID from frontend (tutorProfileId_index)
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      weeks: {
        type: Number,
        required: true,
        min: 1,
        max: 52,
      },
    },
    schedule: [
      {
        dayOfWeek: {
          type: String,
          enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          required: true,
        },
        startTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              // Validate time format HH:MM and evening hours (17:00-23:00)
              const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
              if (!timeRegex.test(v)) return false;
              
              const hour = parseInt(v.split(":")[0]);
              return hour >= 17 && hour < 23;
            },
            message: "Start time must be in format HH:MM and between 17:00-23:00",
          },
        },
        endTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
              if (!timeRegex.test(v)) return false;
              
              const hour = parseInt(v.split(":")[0]);
              return hour >= 17 && hour <= 23;
            },
            message: "End time must be in format HH:MM and between 17:00-23:00",
          },
        },
      },
    ],
    price: {
      type: Number,
      required: true,
      min: 2000,
    },
    maxStudents: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
      default: 10,
    },
    currentStudents: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v >= new Date();
        },
        message: "Start date must be in the future",
      },
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate end date before saving
courseSchema.pre("save", function (next) {
  if (this.startDate && this.duration && this.duration.weeks) {
    const endDate = new Date(this.startDate);
    endDate.setDate(endDate.getDate() + this.duration.weeks * 7);
    this.endDate = endDate;
  }
  next();
});

// Virtual for total sessions
courseSchema.virtual("totalSessions").get(function () {
  return this.schedule.length * this.duration.weeks;
});

// Ensure virtuals are included in JSON
courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
