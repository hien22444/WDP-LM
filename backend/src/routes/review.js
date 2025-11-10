const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const TutorProfile = require("../models/TutorProfile");
const User = require("../models/User");

// Create review for completed booking
router.post("/", auth(), async (req, res) => {
  try {
    const { bookingId, rating, comment, categories, isAnonymous } = req.body;

    // Validation
    if (!bookingId || !rating) {
      return res.status(400).json({ 
        message: "Booking ID and rating are required" 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Check if booking exists and belongs to user
    const booking = await Booking.findById(bookingId)
      .populate("tutorProfile", "_id user")
      .populate("student", "_id");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Extract student ID (handle both populated and non-populated)
    const studentId = booking.student?._id || booking.student;
    
    if (String(studentId) !== String(req.user.id)) {
      return res.status(403).json({ 
        message: "Not authorized to review this booking" 
      });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.status(400).json({ 
        message: "Can only review completed bookings" 
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ 
        message: "Review already exists for this booking" 
      });
    }

    // Validate categories if provided
    if (categories) {
      const categoryKeys = ['teaching', 'punctuality', 'communication', 'preparation', 'friendliness'];
      for (const key of categoryKeys) {
        if (categories[key] !== undefined) {
          const value = Number(categories[key]);
          if (isNaN(value) || value < 1 || value > 5) {
            return res.status(400).json({ 
              message: `Category ${key} must be between 1 and 5` 
            });
          }
        }
      }
    }

    // Extract tutorProfile ID (handle both populated and non-populated)
    const tutorProfileId = booking.tutorProfile?._id || booking.tutorProfile;

    // Create review
    const review = await Review.create({
      booking: bookingId,
      tutorProfile: tutorProfileId,
      student: req.user.id,
      rating,
      comment: comment || "",
      categories: {
        teaching: categories?.teaching || rating,
        punctuality: categories?.punctuality || rating,
        communication: categories?.communication || rating,
        preparation: categories?.preparation || rating,
        friendliness: categories?.friendliness || rating
      },
      isAnonymous: isAnonymous || false
    });

    // Populate review with user info
    const populatedReview = await Review.findById(review._id)
      .populate("student", "full_name avatar")
      .populate("tutorProfile", "user")
      .populate("booking", "start end mode price");

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: populatedReview
    });

  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Failed to create review" });
  }
});

// Get reviews for a tutor
router.get("/tutor/:tutorId", async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { page = 1, limit = 10, sortBy = "newest" } = req.query;

    // Check if tutor exists
    const tutor = await TutorProfile.findById(tutorId);
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { created_at: -1 };
        break;
      case "oldest":
        sort = { created_at: 1 };
        break;
      case "highest":
        sort = { rating: -1 };
        break;
      case "lowest":
        sort = { rating: 1 };
        break;
      default:
        sort = { created_at: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const reviews = await Review.find({ 
      tutorProfile: tutorId, 
      isHidden: false 
    })
      .populate("student", "full_name avatar")
      .populate("booking", "start end mode")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments({ 
      tutorProfile: tutorId, 
      isHidden: false 
    });

    // Get rating statistics
    const ratingStats = await Review.calculateTutorRating(tutorId);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      },
      ratingStats
    });

  } catch (error) {
    console.error("Error getting tutor reviews:", error);
    res.status(500).json({ message: "Failed to get reviews" });
  }
});

// Get user's reviews
router.get("/my-reviews", auth(), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({ student: req.user.id })
      .populate("tutorProfile", "user subjects")
      .populate("booking", "start end mode price")
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments({ student: req.user.id });

    res.json({
      success: true,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Error getting user reviews:", error);
    res.status(500).json({ message: "Failed to get reviews" });
  }
});

// Update review
router.put("/:reviewId", auth(), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, categories, isAnonymous } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.student) !== String(req.user.id)) {
      return res.status(403).json({ 
        message: "Not authorized to update this review" 
      });
    }

    // Validate rating if provided
    if (rating !== undefined) {
      const ratingNum = Number(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ 
          message: "Rating must be between 1 and 5" 
        });
      }
    }

    // Validate categories if provided
    if (categories) {
      const categoryKeys = ['teaching', 'punctuality', 'communication', 'preparation', 'friendliness'];
      for (const key of categoryKeys) {
        if (categories[key] !== undefined) {
          const value = Number(categories[key]);
          if (isNaN(value) || value < 1 || value > 5) {
            return res.status(400).json({ 
              message: `Category ${key} must be between 1 and 5` 
            });
          }
        }
      }
    }

    // Update review
    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;
    if (categories !== undefined) updateData.categories = categories;
    if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    )
      .populate("student", "full_name avatar")
      .populate("tutorProfile", "user")
      .populate("booking", "start end mode price");

    res.json({
      success: true,
      message: "Review updated successfully",
      review: updatedReview
    });

  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Failed to update review" });
  }
});

// Delete review
router.delete("/:reviewId", auth(), async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.student) !== String(req.user.id)) {
      return res.status(403).json({ 
        message: "Not authorized to delete this review" 
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: "Review deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

// Tutor response to review
router.post("/:reviewId/response", auth(), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Response comment is required" });
    }

    const review = await Review.findById(reviewId)
      .populate("tutorProfile", "user");
    
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (String(review.tutorProfile.user) !== String(req.user.id)) {
      return res.status(403).json({ 
        message: "Not authorized to respond to this review" 
      });
    }

    // Update review with response
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        "response.comment": comment,
        "response.respondedAt": new Date()
      },
      { new: true }
    )
      .populate("student", "full_name avatar")
      .populate("tutorProfile", "user")
      .populate("booking", "start end mode price");

    res.json({
      success: true,
      message: "Response added successfully",
      review: updatedReview
    });

  } catch (error) {
    console.error("Error adding response:", error);
    res.status(500).json({ message: "Failed to add response" });
  }
});

// Report review
router.post("/:reviewId/report", auth(), async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Report reason is required" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Increment report count
    await Review.findByIdAndUpdate(reviewId, {
      $inc: { reported: 1 }
    });

    // Hide review if reported too many times
    if (review.reported >= 4) {
      await Review.findByIdAndUpdate(reviewId, {
        isHidden: true
      });
    }

    res.json({
      success: true,
      message: "Review reported successfully"
    });

  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({ message: "Failed to report review" });
  }
});

// Mark review as helpful
router.post("/:reviewId/helpful", auth(), async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Increment helpful count
    await Review.findByIdAndUpdate(reviewId, {
      $inc: { helpful: 1 }
    });

    res.json({
      success: true,
      message: "Review marked as helpful"
    });

  } catch (error) {
    console.error("Error marking review as helpful:", error);
    res.status(500).json({ message: "Failed to mark review as helpful" });
  }
});

module.exports = router;
