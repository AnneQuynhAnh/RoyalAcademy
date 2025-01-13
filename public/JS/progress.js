// Chart.js: Learning Progress Chart
const ctx = document.getElementById("learningProgressChart").getContext("2d");
const learningProgressChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Hours Spent Learning",
        data: [1, 2, 1.5, 3, 2.5, 4, 3.5], // Example data
        backgroundColor: "rgba(30, 110, 162, 0.8)",
        borderColor: "rgba(30, 110, 162, 1)",
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide legend
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Days of the Week",
        },
      },
      y: {
        title: {
          display: true,
          text: "Hours",
        },
        beginAtZero: true,
      },
    },
  },
});

// Search functionality for users
document.getElementById("searchButton").addEventListener("click", () => {
  const query = document.getElementById("usersearch").value.trim();
  if (query) {
    fetch(`/users/search?query=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        const resultsContainer = document.getElementById("result");
        if (data.length > 0) {
          resultsContainer.innerHTML = data
            .map(
              (user) =>
                `<p><strong>User ID:</strong> ${user.user_id}, <strong>Username:</strong> ${user.username}, <strong>Email:</strong> ${user.email}</p>`
            )
            .join("");
        } else {
          resultsContainer.innerHTML = "<p>No results found.</p>";
        }
      })
      .catch(() => {
        alert("An error occurred while searching for users.");
      });
  } else {
    alert("Please enter a search query.");
  }
});
