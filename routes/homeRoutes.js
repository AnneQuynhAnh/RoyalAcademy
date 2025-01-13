const express = require("express");
const connection = require("../database"); // Ensure this points to your database connection file
const router = express.Router();

// Fetch all lessons with unit names
router.get("/lessons", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.session.user.id;

  try {
    const lessonsQuery = `
      SELECT 
        l.lesson_id,
        l.lesson_name,
        l.description,
        l.unit_name,
        l.unit_description,
        COALESCE(ul.status, 'not_started') AS status
      FROM lessons l
      LEFT JOIN user_lessons ul 
        ON l.lesson_id = ul.lesson_id AND ul.user_id = ?
      ORDER BY l.unit_name, l.lesson_id;
    `;

    const [lessons] = await connection.promise().query(lessonsQuery, [userId]);

    res.status(200).json(lessons);
  } catch (err) {
    console.error("Error fetching lessons:", err);
    res.status(500).json({ error: "Failed to fetch lessons" });
  }
});

// Get all questions for a specific lesson
router.get("/questions/:lessonId", async (req, res) => {
  const { lessonId } = req.params;

  try {
    const questionsQuery = `
      SELECT question_id, question_text, question_type, options, audio_url, correct_answer 
      FROM questions 
      WHERE lesson_id = ?;
    `;
    const [questions] = await connection
      .promise()
      .query(questionsQuery, [lessonId]);
    res.status(200).json(questions);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// Fetch lessons learned and not learned for the signed-in user
router.get("/user-lessons/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const userLessonsQuery = `
      SELECT 
        ul.lesson_id, 
        l.lesson_name, 
        l.description, 
        ul.status, 
        ul.score, 
        ul.started_at, 
        ul.completed_at
      FROM 
        user_lessons ul
      JOIN 
        lessons l ON ul.lesson_id = l.lesson_id
      WHERE 
        ul.user_id = ?;
    `;

    const [userLessons] = await connection
      .promise()
      .query(userLessonsQuery, [userId]);

    res.status(200).json(userLessons);
  } catch (err) {
    console.error("Error fetching user lessons:", err);
    res.status(500).json({ error: "Failed to fetch user lessons" });
  }
});
// Update lesson completion for a user
router.post("/updatelesson", async (req, res) => {
  const { lessonId, status, progress, correctAnswers } = req.body;

  if (!req.session || !req.session.user) {
    console.error("Unauthorized: Missing session user.");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.session.user.id;

  console.log("Incoming update request:", {
    userId,
    lessonId,
    status,
    progress,
    correctAnswers,
  });

  try {
    const query = `
      INSERT INTO user_lessons (user_id, lesson_id, status, progress, score, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, NOW(), IF(?, NOW(), NULL))
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        progress = VALUES(progress),
        score = VALUES(score), -- Now represents correct answers
        completed_at = IF(?, NOW(), completed_at);
    `;

    const [result] = await connection.promise().query(query, [
      userId,
      lessonId,
      status,
      progress,
      correctAnswers, // Pass correct answers here
      status === "completed",
      status === "completed",
    ]);

    console.log("Query executed successfully:", result);
    res.status(200).json({ message: "Lesson status updated successfully." });
  } catch (err) {
    console.error("Database query failed:", err.message);
    res.status(500).json({ error: "Failed to update lesson status." });
  }
});
//Fetch back to front-end lesson progress
router.get("/progress/:lessonId", async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.session.user.id;

  try {
    const [result] = await connection.promise().query(
      `SELECT score, completed_at, progress, status 
       FROM user_lessons 
       WHERE user_id = ? AND lesson_id = ?`,
      [userId, lessonId]
    );

    if (result.length > 0) {
      console.log("Fetched Progress:", result[0]); // Debug
      res.status(200).json(result[0]); // Send the first result
    } else {
      res.status(404).json({ error: "Progress not found for the lesson." });
    }
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ error: "Failed to fetch progress data." });
  }
});

module.exports = router;
