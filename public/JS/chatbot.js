const chatInput = document.querySelector(".chat-input input");
const chatMessages = document.querySelector(".chat-messages");
const sendButton = document.querySelector(".chat-input button");

// Dynamically determine backend URL
const backendURL = window.location.href.includes("localhost")
  ? "http://localhost:3007/chatbot" // Local development
  : "https://yourdomain.com/chatbot"; // Replace with your production domain

// Function to append messages
const appendMessage = (message, type) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add(
    type === "user" ? "user-message" : "bot-message"
  );
  messageElement.innerHTML = `<p>${message}</p>`;
  chatMessages.appendChild(messageElement);

  // Auto-scroll to the bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Function to show a typing indicator
const showTypingIndicator = () => {
  const typingElement = document.createElement("div");
  typingElement.classList.add("bot-message", "typing-indicator");
  typingElement.innerHTML = `<p>Bot is typing...</p>`;
  chatMessages.appendChild(typingElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
};

// Function to remove typing indicator
const removeTypingIndicator = () => {
  const typingIndicator = document.querySelector(".typing-indicator");
  if (typingIndicator) {
    chatMessages.removeChild(typingIndicator);
  }
};

// Generate or retrieve a unique session ID
const sessionId =
  localStorage.getItem("chatbotSessionId") || generateSessionId();
localStorage.setItem("chatbotSessionId", sessionId);

function generateSessionId() {
  return Math.random().toString(36).substr(2, 9); // Simple session ID generator
}

// Event listener for the send button
sendButton.addEventListener("click", () => {
  const userMessage = chatInput.value.trim();

  if (userMessage) {
    appendMessage(userMessage, "user");
    showTypingIndicator();

    fetch(backendURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: sessionId, // Use the generated session ID
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        removeTypingIndicator();
        appendMessage(data.fulfillmentText || "No response received.", "bot");
      })
      .catch((error) => {
        console.error("Error:", error);
        removeTypingIndicator();
        appendMessage(
          "Oops! Something went wrong. Please try again later.",
          "bot"
        );
      });

    chatInput.value = ""; // Clear the input field
  } else {
    alert("Please enter a message!"); // Alert for empty input
  }
});

// Allow pressing "Enter" to send messages
chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") sendButton.click();
});

// Disable send button for empty input
chatInput.addEventListener("input", () => {
  sendButton.disabled = !chatInput.value.trim();
});
