const mongoose = require("mongoose");

const courseEnrollmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tutorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorProfile",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
courseEnrollmentSchema.index({ course: 1, student: 1 });
courseEnrollmentSchema.index({ student: 1, status: 1 });
courseEnrollmentSchema.index({ tutorProfile: 1, status: 1 });

// Methods
courseEnrollmentSchema.methods.markAsPaid = function (paymentId) {
  this.paymentStatus = "paid";
  this.paymentId = paymentId;
  this.paidAt = new Date();
  this.status = "active";
  return this.save();
};

courseEnrollmentSchema.methods.cancel = function (reason) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

courseEnrollmentSchema.methods.complete = function () {
  this.status = "completed";
  this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model("CourseEnrollment", courseEnrollmentSchema);
