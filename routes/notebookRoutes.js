const express = require("express");
const connection = require("../database"); // Ensure this points to your database connection file
const router = express.Router();

// Fetch folders for a user with word count
router.get("/folders", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.user.id;

  const query = `
    SELECT f.folder_id, f.folder_name, f.created_at, COUNT(v.vocab_id) AS word_count
    FROM folders f
    LEFT JOIN vocabularies v ON f.folder_id = v.folder_id
    WHERE f.user_id = ?
    GROUP BY f.folder_id
    ORDER BY f.created_at DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Database error while fetching folders:", err.message);
      return res.status(500).json({ error: "Failed to fetch folders" });
    }

    res.json(results); // Returns folder data with word count
  });
});

// Create a new folder
router.post("/folders", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.user.id; // Fetch user ID from the session
  const { folder_name } = req.body; // Retrieve folder name from request body

  if (!folder_name || typeof folder_name !== "string") {
    return res.status(400).json({ error: "Invalid folder name." });
  }

  // Debug logs to ensure the correct values are used
  console.log("Session user:", req.session.user);
  console.log("Creating folder for user_id:", userId); // User ID from the session
  console.log("Folder name:", folder_name); // Folder name provided by the user

  const query =
    "INSERT INTO folders (user_id, folder_name, created_at) VALUES (?, ?, NOW())";

  // Pass userId and folder_name as parameters
  connection.query(query, [userId, folder_name], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ error: "Folder name already exists." });
      }
      return res.status(500).json({ error: "Failed to create folder." });
    }
    res.json({ folder_id: results.insertId }); // Return the newly created folder's ID
  });
});

// Save a word to a folder
router.post("/vocabularies", (req, res) => {
  const { folder_id, word, meaning } = req.body;

  // Check if folder_id, word, and meaning are provided
  if (!folder_id || !word || !meaning) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const query =
    "INSERT INTO vocabularies (folder_id, word, meaning, created_at) VALUES (?, ?, ?, NOW())";

  connection.query(query, [folder_id, word, meaning], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res.status(500).json({ error: "Failed to save word" });
    }
    res.json({ vocab_id: results.insertId });
  });
});

// Fetch words in a folder
router.get("/vocabularies/:folderId", (req, res) => {
  const folderId = req.params.folderId;

  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = "SELECT * FROM vocabularies WHERE folder_id = ?";

  connection.query(query, [folderId], (err, results) => {
    if (err) {
      console.error("Database error:", err.message);
      return res
        .status(500)
        .json({ error: "Failed to fetch vocabulary words" });
    }

    res.json(results); // Send results to the frontend
  });
});

// Delete a folder
router.delete("/folders/:folderId", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.session.user.id;
  const folderId = req.params.folderId;

  // Ensure the folder belongs to the logged-in user
  const query = "DELETE FROM folders WHERE folder_id = ? AND user_id = ?";

  connection.query(query, [folderId, userId], (err, results) => {
    if (err) {
      console.error("Database error while deleting folder:", err.message);
      return res.status(500).json({ error: "Failed to delete folder." });
    }

    if (results.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Folder not found or unauthorized." });
    }

    res.json({ message: "Folder deleted successfully." });
  });
});

// Delete a word
router.delete("/vocabularies/:vocabId", (req, res) => {
  const vocabId = req.params.vocabId;

  const query = "DELETE FROM vocabularies WHERE vocab_id = ?";

  connection.query(query, [vocabId], (err, results) => {
    if (err) {
      console.error("Database error while deleting word:", err.message);
      return res.status(500).json({ error: "Failed to delete word." });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Word not found." });
    }

    res.json({ message: "Word deleted successfully." });
  });
});
// Add a word
router.post("/vocabularies", (req, res) => {
  const { folder_id, word, meaning, ipa } = req.body;

  // Check if folder_id, word, and meaning are provided
  if (!folder_id || !word || !meaning) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const query = `
    INSERT INTO vocabularies (folder_id, word, meaning, ipa, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  connection.query(
    query,
    [folder_id, word, meaning, ipa || null], // Use null if IPA is not provided
    (err, results) => {
      if (err) {
        console.error("Database error:", err.message);
        return res.status(500).json({ error: "Failed to save word." });
      }
      res.json({ vocab_id: results.insertId });
    }
  );
});

module.exports = router;
