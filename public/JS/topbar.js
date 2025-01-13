document.addEventListener("DOMContentLoaded", () => {
  const topbar = `
    <div class="top-nav">
      <div class="nav-item logo">
        <img src="../assets/logo/logo.png" alt="Logo" />
      </div>
      <div class="nav-item profile">
        <a href="../HTML/profile.html">
          <img src="../assets/icons/white/Icons-VnEng_avaicon.png" alt="Profile Icon" />
        </a>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("afterbegin", topbar);
});
