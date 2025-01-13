const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const connection = require("../database");

const saltRounds = 10;

// Route: User Sign-Up
router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const query =
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    connection.query(
      query,
      [username, email, hashedPassword],
      (err, results) => {
        if (err) {
          console.error("Database query error:", err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Email already exists." });
          }
          return res.status(500).json({ message: "Internal server error." });
        }
        res.status(201).json({ message: "User registered successfully." });
      }
    );
  } catch (error) {
    console.error("Error hashing password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Route: User Sign-In
router.post("/signin", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  const query = "SELECT * FROM users WHERE email = ?";
  connection.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerating session:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      req.session.user = {
        id: user.user_id,
        username: user.username,
        email: user.email,
      };

      console.log("New session created for user:", req.session.user);

      res.json({ message: "Sign-in successful.", user: req.session.user });
    });
  });
});

// Route: User Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).json({ message: "Could not log out." });
    }

    res.clearCookie("user_sid");
    res.json({ message: "Logged out successfully." });
  });
});

// Route: Update User Profile
router.put("/update", async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.session.user.id;
  const { username, email, password, volume, goal, level } = req.body;

  // Build the update query and parameters
  let query = "UPDATE users SET ";
  const params = [];

  if (username) {
    query += "username = ?, ";
    params.push(username);
  }
  if (email) {
    query += "email = ?, ";
    params.push(email);
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    query += "password = ?, ";
    params.push(hashedPassword);
  }
  if (volume) {
    query += "volume = ?, ";
    params.push(volume);
  }
  if (goal) {
    query += "goal = ?, ";
    params.push(goal);
  }
  if (level) {
    query += "level = ?, ";
    params.push(level);
  }

  // Remove trailing comma and space
  query = query.slice(0, -2);
  query += " WHERE user_id = ?";
  params.push(userId);

  // Execute the update query
  connection.query(query, params, (err, results) => {
    if (err) {
      console.error("Database update error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    // Update session data
    if (username) req.session.user.username = username;
    if (email) req.session.user.email = email;

    res.json({ message: "Profile updated successfully." });
  });
});

// Route: Get Current Logged-In User
router.get("/current", (req, res) => {
  if (req.session && req.session.user) {
    const userId = req.session.user.id;

    // Fetch the full user details from the database
    const query = "SELECT * FROM users WHERE user_id = ?";
    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).json({ message: "Internal server error." });
      }

      if (results.length > 0) {
        const user = results[0];

        // Set the response data with fallback defaults if values are null
        res.json({
          id: user.user_id,
          username: user.username,
          email: user.email,
          volume:
            user.volume !== null && user.volume !== undefined
              ? user.volume
              : 50,
          goal: user.goal !== null && user.goal !== undefined ? user.goal : 5, // Set default to 5 minutes if null
          level: user.level || "beginner",
        });
      } else {
        res.status(404).json({ message: "User not found." });
      }
    });
  } else {
    res.status(401).json({ message: "No user is currently logged in." });
  }
});
// Route: Update Password
router.put("/update-password", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = req.session.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both old and new passwords are required." });
  }

  // Get the current hashed password from the database
  const query = "SELECT password FROM users WHERE user_id = ?";
  connection.query(query, [userId], async (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const currentPassword = results[0].password;

    // Compare the provided old password with the stored hashed password
    const isMatch = await bcrypt.compare(oldPassword, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password in the database
    const updateQuery = "UPDATE users SET password = ? WHERE user_id = ?";
    connection.query(updateQuery, [hashedNewPassword, userId], (updateErr) => {
      if (updateErr) {
        console.error("Database update error:", updateErr);
        return res.status(500).json({ message: "Failed to update password." });
      }

      res.json({ message: "Password updated successfully." });
    });
  });
});
// Route: Search Users
router.get("/search", (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: "Search query is required." });
  }

  const searchQuery =
    "SELECT user_id, username, email FROM users WHERE username LIKE ? OR email LIKE ?";
  const searchValue = `%${query}%`;

  connection.query(searchQuery, [searchValue, searchValue], (err, results) => {
    if (err) {
      console.error("Database query error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    res.json(results);
  });
});

module.exports = router;
