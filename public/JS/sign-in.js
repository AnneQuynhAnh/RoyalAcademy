document
  .getElementById("signinForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Use relative URL to dynamically adapt to the current host
    const baseUrl = window.location.origin; // Dynamically gets 'https://study.royalacademy.vn' or 'http://localhost:3007'

    try {
      const response = await fetch(`${baseUrl}/users/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent with the request
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Login successful:", data);

        // Redirect to home.html on successful login
        window.location.href = "../HTML/home.html"; // Adjust the path as needed
      } else {
        // Extract the error message from the response
        const errorData = await response.json();
        console.error("Login failed:", errorData.message);

        // Show error message to the user
        alert(`Login failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle network or unexpected errors
      alert("An error occurred while signing in. Please try again.");
    }
  });
