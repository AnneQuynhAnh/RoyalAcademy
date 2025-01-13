document.addEventListener("DOMContentLoaded", () => {
  // Goal Mapping
  const goalMap = {
    5: "5 minutes (Easy)",
    10: "10 minutes (Great Job)",
    15: "15 minutes (Pro)",
    20: "20 minutes (Super Pro)",
  };

  // Fetch user data when the page loads
  fetch("/users/current", {
    method: "GET",
    credentials: "include", // Ensure cookies are sent with the request
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch user data.");
      }
      return response.json();
    })
    .then((user) => {
      // Populate the form fields with the user's data
      document.getElementById("username").value = user.username || "";
      document.getElementById("gmail").value = user.email || "";

      // Set volume; default to 50 if not present
      const volume = user.volume !== undefined ? user.volume : 50;
      document.getElementById("volume").value = volume;
      document.getElementById("volume-value").textContent = volume;

      // Set daily goal; default to 5 if not present or null
      const goalValue =
        user.goal !== null && user.goal !== undefined
          ? parseInt(user.goal, 10)
          : 5;
      console.log("Goal value fetched from DB:", goalValue);
      if (goalMap.hasOwnProperty(goalValue)) {
        document.getElementById("set-goals").value = goalValue;
      } else {
        document.getElementById("set-goals").value = 5; // Default to 5 if the value is invalid
      }

      // Set level; default to "beginner" if not present
      const level = user.level || "beginner";
      document.getElementById("choose-levels").value = level;
    })
    .catch((error) => {
      console.error("Error fetching user data:", error);
    });

  // Volume slider update
  const volumeSlider = document.getElementById("volume");
  const volumeValue = document.getElementById("volume-value");

  if (volumeSlider && volumeValue) {
    volumeSlider.addEventListener("input", () => {
      volumeValue.textContent = volumeSlider.value;
    });
  }

  // Save button functionality
  const saveButton = document.getElementById("save-button");

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const gmail = document.getElementById("gmail").value;
      const volume = volumeSlider ? parseInt(volumeSlider.value, 10) : 50;

      // Get the numeric goal value from the dropdown
      const goalValue = parseInt(
        document.getElementById("set-goals").value,
        10
      );

      // Logging goal value to ensure it's being fetched correctly
      console.log("Saving Goal Value:", goalValue);

      const level =
        document.getElementById("choose-levels").value || "beginner";

      // Update the user profile
      fetch("/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify({
          username,
          email: gmail,
          password,
          volume,
          goal: goalValue, // Use the numeric goal value for saving to the database
          level,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to update profile.");
          }
          return response.json();
        })
        .then((data) => {
          if (data.message === "Profile updated successfully.") {
            alert("Profile updated successfully!");
          } else {
            alert("Failed to update profile: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Error updating profile:", error);
          alert("An error occurred. Please try again.");
        });
    });
  }

  // Sign Out button functionality
  const signOutButton = document.getElementById("signout-button");

  if (signOutButton) {
    signOutButton.addEventListener("click", async () => {
      try {
        const response = await fetch("/users/logout", {
          method: "POST",
          credentials: "include", // Ensure cookies are sent
        });

        if (!response.ok) {
          throw new Error("Failed to log out.");
        }

        const data = await response.json();

        if (data.message === "Logged out successfully.") {
          // Redirect to the sign-in page
          window.location.href = "../HTML/signin.html";
        } else {
          alert("Failed to log out: " + data.message);
        }
      } catch (error) {
        console.error("Error logging out:", error);
        alert("An error occurred. Please try again.");
      }
    });
  }

  // Change Password button functionality
  const changePasswordButton = document.getElementById(
    "change-password-button"
  );
  const changePasswordModal = document.getElementById("change-password-modal");
  const closeModalButton = document.querySelector(".close-button");
  const updatePasswordButton = document.getElementById(
    "update-password-button"
  );

  if (
    changePasswordButton &&
    changePasswordModal &&
    closeModalButton &&
    updatePasswordButton
  ) {
    // Show the change password modal when the button is clicked
    changePasswordButton.addEventListener("click", () => {
      changePasswordModal.style.display = "block";
    });

    // Close the modal when the close button is clicked
    closeModalButton.addEventListener("click", () => {
      changePasswordModal.style.display = "none";
    });

    // Update password functionality
    updatePasswordButton.addEventListener("click", () => {
      const oldPassword = document.getElementById("old-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById(
        "confirm-new-password"
      ).value;

      if (newPassword !== confirmPassword) {
        alert("New passwords do not match. Please try again.");
        return;
      }

      fetch("/users/update-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({ oldPassword, newPassword }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to update password.");
          }
          return response.json();
        })
        .then((data) => {
          if (data.message === "Password updated successfully.") {
            alert("Password updated successfully!");
            changePasswordModal.style.display = "none";
          } else {
            alert("Failed to update password: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Error updating password:", error);
          alert("An error occurred. Please try again.");
        });
    });
  }
});
