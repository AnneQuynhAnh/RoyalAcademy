const express = require("express");
const axios = require("axios");
const connection = require("../database");
const router = express.Router();

// WordsAPI credentials
const API_KEY = "993232d0d6mshfb56d5381cbe977p17f572jsn5aca605529b1";
const API_HOST = "wordsapiv1.p.rapidapi.com";

// Endpoint to fetch dictionary data
router.get("/:word", async (req, res) => {
  const word = req.params.word;
  const url = `https://${API_HOST}/words/${word}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "X-RapidAPI-Key": "993232d0d6mshfb56d5381cbe977p17f572jsn5aca605529b1",
        "X-RapidAPI-Host": "wordsapiv1.p.rapidapi.com",
      },
    });

    const data = response.data;

    // Extract relevant information
    const synonyms = data.synonyms || [];
    const definitions =
      data.results?.map((result) => ({
        definition: result.definition,
        partOfSpeech: result.partOfSpeech || "unknown",
      })) || [];
    const examples = data.results
      ?.flatMap((result) => result.examples || [])
      .filter(Boolean); // Remove undefined/null examples

    // Extract IPA (International Phonetic Alphabet)
    const ipa = data.pronunciation?.all || ""; // Get IPA pronunciation if available

    res.json({
      word,
      ipa, // Add IPA to the response
      synonyms,
      definitions,
      examples,
    });
  } catch (error) {
    console.error("Error fetching dictionary data:", error.message);
    res.status(500).json({ error: "Failed to fetch dictionary data" });
  }
});

// Route to fetch folders for a user
// Fetch folders for a user
router.get("/folders/:userId", (req, res) => {
  const userId = req.params.userId;
  const query =
    "SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC";

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Failed to fetch folders" });
    }
    res.json(results);
  });
});

// Save a word to a folder
router.post("/vocabularies", (req, res) => {
  const { folder_id, word, meaning, ipa } = req.body;

  if (!folder_id || !word || !meaning || !ipa) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const query =
    "INSERT INTO vocabularies (folder_id, word, meaning, ipa, created_at) VALUES (?, ?, ?, ?, NOW())";

  connection.query(query, [folder_id, word, meaning, ipa], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Failed to save word." });
    }
    res.json({ vocab_id: results.insertId });
  });
});

module.exports = router;
