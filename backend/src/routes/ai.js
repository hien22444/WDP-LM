const express = require("express");
const {
  chatCompletion,
  searchTutorsWithAI,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/chat", chatCompletion);
router.post("/search-tutors", searchTutorsWithAI);

module.exports = router;
