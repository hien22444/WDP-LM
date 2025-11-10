const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    booking: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Booking", 
      required: true, 
      unique: true,
      index: true 
    },
    tutorProfile: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "TutorProfile", 
      required: true,
      index: true 
    },
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    rating: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 5,
      index: true 
    },
    comment: { 
      type: String, 
      maxlength: 1000,
      default: ""
    },
    categories: {
      teaching: { type: Number, min: 1, max: 5, default: 5 },
      punctuality: { type: Number, min: 1, max: 5, default: 5 },
      communication: { type: Number, min: 1, max: 5, default: 5 },
      preparation: { type: Number, min: 1, max: 5, default: 5 },
      friendliness: { type: Number, min: 1, max: 5, default: 5 }
    },
    isAnonymous: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true }, // Only verified bookings can review
    helpful: { type: Number, default: 0 }, // Number of helpful votes
    reported: { type: Number, default: 0 }, // Number of reports
    isHidden: { type: Boolean, default: false }, // Hide if reported too much
    response: {
      comment: { type: String, maxlength: 1000 },
      respondedAt: { type: Date }
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
    collection: "reviews",
  }
);

// Indexes for performance
ReviewSchema.index({ tutorProfile: 1, rating: -1 });
ReviewSchema.index({ student: 1, created_at: -1 });
ReviewSchema.index({ rating: -1, created_at: -1 });

// Calculate average rating for tutor
ReviewSchema.statics.calculateTutorRating = async function(tutorProfileId) {
  const stats = await this.aggregate([
    { $match: { tutorProfile: new mongoose.Types.ObjectId(tutorProfileId), isHidden: false } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        teachingAvg: { $avg: "$categories.teaching" },
        punctualityAvg: { $avg: "$categories.punctuality" },
        communicationAvg: { $avg: "$categories.communication" },
        preparationAvg: { $avg: "$categories.preparation" },
        friendlinessAvg: { $avg: "$categories.friendliness" }
      }
    }
  ]);

  if (stats.length === 0) {
    return {
      rating: 0,
      totalReviews: 0,
      categories: {
        teaching: 0,
        punctuality: 0,
        communication: 0,
        preparation: 0,
        friendliness: 0
      }
    };
  }

  const result = stats[0];
  return {
    rating: Math.round(result.averageRating * 10) / 10,
    totalReviews: result.totalReviews,
    categories: {
      teaching: Math.round(result.teachingAvg * 10) / 10,
      punctuality: Math.round(result.punctualityAvg * 10) / 10,
      communication: Math.round(result.communicationAvg * 10) / 10,
      preparation: Math.round(result.preparationAvg * 10) / 10,
      friendliness: Math.round(result.friendlinessAvg * 10) / 10
    }
  };
};

// Update tutor rating when review is saved
ReviewSchema.post('save', async function() {
  try {
    const ratingStats = await this.constructor.calculateTutorRating(this.tutorProfile);
    await mongoose.model('TutorProfile').findByIdAndUpdate(
      this.tutorProfile,
      { 
        rating: ratingStats.rating,
        totalReviews: ratingStats.totalReviews,
        ratingCategories: ratingStats.categories
      }
    );
  } catch (error) {
    console.error('Error updating tutor rating:', error);
  }
});

// Update tutor rating when review is deleted
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const ratingStats = await mongoose.model('Review').calculateTutorRating(doc.tutorProfile);
      await mongoose.model('TutorProfile').findByIdAndUpdate(
        doc.tutorProfile,
        { 
          rating: ratingStats.rating,
          totalReviews: ratingStats.totalReviews,
          ratingCategories: ratingStats.categories
        }
      );
    } catch (error) {
      console.error('Error updating tutor rating after delete:', error);
    }
  }
});

// Update tutor rating when review is updated
ReviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    try {
      const ratingStats = await mongoose.model('Review').calculateTutorRating(doc.tutorProfile);
      await mongoose.model('TutorProfile').findByIdAndUpdate(
        doc.tutorProfile,
        { 
          rating: ratingStats.rating,
          totalReviews: ratingStats.totalReviews,
          ratingCategories: ratingStats.categories
        }
      );
    } catch (error) {
      console.error('Error updating tutor rating after update:', error);
    }
  }
});

module.exports = mongoose.model("Review", ReviewSchema);
