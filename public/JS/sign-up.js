document
  .getElementById("signupForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Dynamically determine the base URL
    const baseUrl = window.location.origin; // Automatically detects 'https://study.royalacademy.vn' or 'http://localhost:3007'

    try {
      const response = await fetch(`${baseUrl}/users/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        // Redirect to signin.html
        window.location.href = "/HTML/signin.html"; // Reflects uppercase folder name
      } else {
        alert(data.message || "Sign-up failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  });
