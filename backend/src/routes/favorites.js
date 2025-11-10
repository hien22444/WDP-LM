const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");

// GET /favorites/tutors - list favorite tutors for current user
router.get("/tutors", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "favoriteTutors",
      populate: { path: "user", select: "full_name image" },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ tutors: user.favoriteTutors || [] });
  } catch (err) {
    console.error("Error getting favorite tutors:", err);
    res.status(500).json({ message: "Failed to get favorite tutors" });
  }
});

// POST /favorites/tutors/:tutorId - add favorite
router.post("/tutors/:tutorId", auth(), async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const tutor = await TutorProfile.findById(tutorId);
    if (!tutor) return res.status(404).json({ message: "Tutor not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent duplicates
    if (!user.favoriteTutors) user.favoriteTutors = [];
    if (user.favoriteTutors.some((t) => String(t) === String(tutorId))) {
      return res.json({ message: "Already favorited" });
    }

    user.favoriteTutors.push(tutorId);
    await user.save();

    res.json({ message: "Added to favorites", tutorId });
  } catch (err) {
    console.error("Error adding favorite tutor:", err);
    res.status(500).json({ message: "Failed to add favorite tutor" });
  }
});

// DELETE /favorites/tutors/:tutorId - remove favorite
router.delete("/tutors/:tutorId", auth(), async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.favoriteTutors = (user.favoriteTutors || []).filter(
      (t) => String(t) !== String(tutorId)
    );
    await user.save();

    res.json({ message: "Removed from favorites", tutorId });
  } catch (err) {
    console.error("Error removing favorite tutor:", err);
    res.status(500).json({ message: "Failed to remove favorite tutor" });
  }
});

// GET /favorites/tutors/:tutorId - check favorite status
router.get("/tutors/:tutorId", auth(false), async (req, res) => {
  try {
    const tutorId = req.params.tutorId;
    // If no auth provided, return false
    if (!req.user || !req.user.id) return res.json({ isFavorite: false });

    const user = await User.findById(req.user.id);
    if (!user) return res.json({ isFavorite: false });

    const isFav = (user.favoriteTutors || []).some(
      (t) => String(t) === String(tutorId)
    );
    res.json({ isFavorite: Boolean(isFav) });
  } catch (err) {
    console.error("Error checking favorite tutor:", err);
    res.status(500).json({ message: "Failed to check favorite tutor" });
  }
});

module.exports = router;
