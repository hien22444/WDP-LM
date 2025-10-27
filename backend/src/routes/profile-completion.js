const router = require("express").Router();
const { auth } = require("../middlewares/auth");
const User = require("../models/User");
const TutorProfile = require("../models/TutorProfile");

// Check profile completion status
router.get("/status", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate completion percentage
    const completionData = calculateProfileCompletion(user);
    
    res.json({
      success: true,
      profileCompleted: user.profile_completed,
      completionStep: user.profile_completion_step,
      firstLogin: user.first_login,
      completionPercentage: completionData.percentage,
      missingFields: completionData.missingFields,
      nextStep: completionData.nextStep
    });

  } catch (error) {
    console.error("Error checking profile completion:", error);
    res.status(500).json({ message: "Failed to check profile completion" });
  }
});

// Update profile completion step
router.post("/update-step", auth(), async (req, res) => {
  try {
    const { step, data } = req.body;
    
    if (!step || !["basic_info", "contact_info", "preferences", "completed"].includes(step)) {
      return res.status(400).json({ message: "Invalid step" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user data based on step
    let updateData = { profile_completion_step: step };
    
    if (data) {
      // Update basic info
      if (step === "basic_info" && data.full_name) {
        updateData.full_name = data.full_name;
      }
      if (data.date_of_birth) {
        updateData.date_of_birth = data.date_of_birth;
      }
      if (data.gender) {
        updateData.gender = data.gender;
      }
      
      // Update contact info
      if (step === "contact_info") {
        if (data.phone_number) updateData.phone_number = data.phone_number;
        if (data.address) updateData.address = data.address;
        if (data.city) updateData.city = data.city;
      }
      
      // Update preferences
      if (step === "preferences" && data.preferences) {
        updateData.preferences = data.preferences;
      }
    }

    // Check if profile is now completed
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    const completionData = calculateProfileCompletion(updatedUser);
    
    // If profile is completed, update completion status
    if (completionData.percentage === 100) {
      await User.findByIdAndUpdate(req.user.id, {
        profile_completed: true,
        profile_completion_step: "completed",
        first_login: false,
        profile_completed_at: new Date()
      });
    }

    res.json({
      success: true,
      message: "Profile step updated successfully",
      profileCompleted: completionData.percentage === 100,
      completionPercentage: completionData.percentage,
      nextStep: completionData.nextStep
    });

  } catch (error) {
    console.error("Error updating profile step:", error);
    res.status(500).json({ message: "Failed to update profile step" });
  }
});

// Complete profile (final step)
router.post("/complete", auth(), async (req, res) => {
  try {
    const { profileData } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile
    const updateData = {
      ...profileData,
      profile_completed: true,
      profile_completion_step: "completed",
      first_login: false,
      profile_completed_at: new Date()
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    );

    // If user is a tutor, create tutor profile
    if (updatedUser.role === "tutor" && profileData.tutorProfile) {
      const tutorProfile = await TutorProfile.create({
        user: updatedUser._id,
        ...profileData.tutorProfile,
        status: "draft" // Will need admin approval
      });
      
      return res.json({
        success: true,
        message: "Profile completed successfully",
        user: updatedUser,
        tutorProfile,
        requiresTutorProfile: true
      });
    }

    res.json({
      success: true,
      message: "Profile completed successfully",
      user: updatedUser,
      requiresTutorProfile: false
    });

  } catch (error) {
    console.error("Error completing profile:", error);
    res.status(500).json({ message: "Failed to complete profile" });
  }
});

// Skip profile completion (for now)
router.post("/skip", auth(), async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      first_login: false,
      profile_completion_step: "completed"
    });

    res.json({
      success: true,
      message: "Profile completion skipped"
    });

  } catch (error) {
    console.error("Error skipping profile completion:", error);
    res.status(500).json({ message: "Failed to skip profile completion" });
  }
});

// Helper function to calculate profile completion
function calculateProfileCompletion(user) {
  const requiredFields = {
    basic_info: ['full_name', 'date_of_birth', 'gender'],
    contact_info: ['phone_number', 'address', 'city'],
    preferences: ['preferences']
  };

  const currentStep = user.profile_completion_step;
  const missingFields = [];
  let completedFields = 0;
  let totalFields = 0;

  // Check basic info
  requiredFields.basic_info.forEach(field => {
    totalFields++;
    if (user[field]) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });

  // Check contact info
  requiredFields.contact_info.forEach(field => {
    totalFields++;
    if (user[field]) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });

  // Check preferences
  requiredFields.preferences.forEach(field => {
    totalFields++;
    if (user[field]) {
      completedFields++;
    } else {
      missingFields.push(field);
    }
  });

  const percentage = Math.round((completedFields / totalFields) * 100);
  
  // Determine next step
  let nextStep = null;
  if (percentage < 33) {
    nextStep = "basic_info";
  } else if (percentage < 66) {
    nextStep = "contact_info";
  } else if (percentage < 100) {
    nextStep = "preferences";
  } else {
    nextStep = "completed";
  }

  return {
    percentage,
    missingFields,
    nextStep
  };
}

module.exports = router;
