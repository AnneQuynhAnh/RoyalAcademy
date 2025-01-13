const express = require("express");
const router = express.Router();
const dialogflow = require("@google-cloud/dialogflow");
const axios = require("axios");
require("dotenv").config(); // Load environment variables

// Dialogflow Session Client Setup
const sessionClient = new dialogflow.SessionsClient({
  keyFilename: "./winged-app-443903-a1-b51d352b18e4.json", // Your service account key file
});

router.post("/", async (req, res) => {
  const { message, sessionId } = req.body;

  // Validate incoming request
  if (!message || !sessionId) {
    return res.status(400).json({ error: "Missing 'message' or 'sessionId'" });
  }

  // Use the hardcoded Google Project ID
  const projectId = "winged-app-443903-a1"; // Replace with your project ID

  console.log("GOOGLE_PROJECT_ID:", projectId);
  console.log("Session ID:", sessionId);

  // Construct the session path
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );

  // Prepare Dialogflow request payload
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: "en", // Dialogflow agent's language
      },
    },
  };

  try {
    // Send request to Dialogflow API
    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult;

    console.log("Dialogflow Response:", result);

    // Extract intent and parameters
    const intentName = result.intent?.displayName || "UnknownIntent";
    const parameters = result.parameters?.fields || {};
    let responseText = result.fulfillmentText || "No response available.";

    // Handle intents dynamically
    switch (intentName) {
      case "GrammarQuery": {
        const topic = parameters.topic?.stringValue || "grammar";

        // Grammar details for various topics
        const grammarDetails = {
          "past simple":
            "The past simple tense is used to describe completed actions in the past. For example: 'I went to the store yesterday.'",
          "present simple":
            "The present simple tense is used to describe habitual actions or general truths. For example: 'The sun rises in the east.'",
          "present continuous":
            "The present continuous tense is used for actions happening now or around the present time. For example: 'I am reading a book.'",
          "future perfect":
            "The future perfect tense is used to describe actions that will be completed before a specific point in the future. For example: 'I will have finished the project by tomorrow.'",
        };

        // Respond with the grammar detail or a fallback message
        responseText =
          grammarDetails[topic.toLowerCase()] ||
          `Sorry, I don't have information about "${topic}".`;
        break;
      }

      case "VocabularyQuery": {
        const word = parameters.word?.stringValue || "word";
        // Example: Fetch definition using a public API or database
        const definition = await fetchWordDefinition(word);
        responseText = definition
          ? `The meaning of "${word}" is: ${definition}`
          : `Sorry, I couldn't find the meaning of "${word}".`;
        break;
      }
      case "PronunciationQuery": {
        const word = parameters.word?.stringValue || "word";
        // Add logic for pronunciation
        responseText = `Here's how to pronounce "${word}": [Insert pronunciation details here]`;
        break;
      }
      default:
        responseText =
          result.fulfillmentText || "Sorry, I couldn't understand your query.";
    }

    // Respond with the data
    res.json({
      fulfillmentText: responseText,
      intent: intentName,
      parameters,
    });
  } catch (error) {
    console.error("Dialogflow API error:", error.message);

    // Send a generic error response
    res.status(500).json({
      error: "Failed to connect to Dialogflow",
      details: error.message,
    });
  }
});

// Example: Function to fetch word definitions dynamically
async function fetchWordDefinition(word) {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.data[0]?.meanings[0]?.definitions[0]?.definition || null;
  } catch (error) {
    console.error("Error fetching word definition:", error.message);
    return null;
  }
}

module.exports = router;
