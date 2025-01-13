const express = require("express");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const usersRoutes = require("./routes/usersRoutes");
const dictionaryRoutes = require("./routes/dictionaryRoutes");
const notebookRoutes = require("./routes/notebookRoutes");
const homeRoutes = require("./routes/homeRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const connection = require("./database");
const { Translate } = require("@google-cloud/translate").v2;
const dialogflow = require("@google-cloud/dialogflow");

// Initialize Express app
const app = express();
const PORT = 3007;

// Initialize Google Translate client with the provided key file
const translate = new Translate({
  keyFilename: path.join(__dirname, "winged-app-443903-a1-017742b75aa2.json"),
});
// Dialogflow Session Client Setup
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: path.join(__dirname, "winged-app-443903-a1-017742b75aa2.json"),
});

// Middleware for parsing JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/favicon.ico", (req, res) => res.status(204).send());
app.use("/chatbot", chatbotRoutes);

// Set up session middleware with MySQLStore
const sessionStore = new MySQLStore({}, connection); // Ensure this is initialized properly
app.use(
  session({
    key: "user_sid",
    secret: "your_secure_session_key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true, // Prevent client-side access
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      domain:
        process.env.NODE_ENV === "production" ? ".royalacademy.vn" : undefined,
      path: "/", // Cookie valid site-wide
    },
  })
);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(
  cors({
    origin: "https://study.royalacademy.vn", // Frontend domain
    credentials: true, // Allow cookies
  })
);

// Debug Middleware for Session Data (optional, remove in production)
app.use((req, res, next) => {
  console.log("Session Data:", req.session);
  next();
});
// Redirect root path to /HTML/signin.html
app.get("/", (req, res) => {
  res.redirect("/HTML/signin.html");
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, "public")));

// Register routes
app.use("/home", homeRoutes);
app.use("/users", usersRoutes);
app.use("/dictionary", dictionaryRoutes);
app.use("/api/notebook", notebookRoutes);

// Google Translation Endpoint
app.post("/translate", async (req, res) => {
  const { q, source, target } = req.body;

  if (!q || !source || !target) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [translation] = await translate.translate(q, {
      from: source,
      to: target,
    });
    res.json({ translatedText: translation });
  } catch (error) {
    console.error("Error during translation:", error);
    res.status(500).json({
      error: "Translation failed",
      details: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
