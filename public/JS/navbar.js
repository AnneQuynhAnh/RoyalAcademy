document.addEventListener("DOMContentLoaded", function () {
  // Define the navbar HTML
  const navbarHTML = `
    <div class="bottom-nav">
      <div class="nav-item" id="chatbot">
        <a href="chatbot.html">
          <img src="../assets/icons/white/Icons-VnEng_chatboticon.png" alt="Chatbot Icon" />
        </a>
      </div>
      <div class="nav-item" id="notebook">
        <a href="notebook.html">
          <img src="../assets/icons/white/Icons-VnEng_notebookicon.png" alt="Notebook Icon" />
        </a>
      </div>
      <div class="nav-item" id="homepage">
        <a href="home.html">
          <img src="../assets/icons/white/Icons-VnEng_homeicon.png" alt="Home Icon" />
        </a>
      </div>
      <div class="nav-item" id="progress">
        <a href="progress.html">
          <img src="../assets/icons/white/Icons-VnEng_progressicon.png" alt="Progress Icon" />
        </a>
      </div>
      <div class="nav-item" id="feed">
        <a href="feed.html">
          <img src="../assets/icons/white/Icons-VnEng_feedicon.png" alt="Feed Icon" />
        </a>
      </div>
    </div>
  `;

  // Inject navbar
  document.body.insertAdjacentHTML("beforeend", navbarHTML);

  // Set active state
  const navItems = document.querySelectorAll(".nav-item a");
  const currentPath = window.location.pathname.split("/").pop().toLowerCase();

  console.log("Current Path:", currentPath); // Debugging: Verify current page path

  navItems.forEach((item) => {
    const linkPath = item.getAttribute("href").toLowerCase();
    console.log("Checking link:", linkPath); // Debugging: Verify each link path

    if (linkPath === currentPath) {
      console.log("Active link:", linkPath); // Debugging: Log active link
      item.parentElement.classList.add("active");
    }
  });
});
