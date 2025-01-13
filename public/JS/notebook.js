document.addEventListener("DOMContentLoaded", () => {
  let folders = []; // Declare folders globally to avoid "not defined" errors
  const learnButton = document.getElementById("learnButton");
  const lessonModal = document.getElementById("lessonModal");
  const closeModalButton = document.getElementById("closeModalButton");
  const createFolderIcon = document.getElementById("createFolderIcon");
  if (createFolderIcon) {
    createFolderIcon.addEventListener("click", showCreateFolderPopup);
  }
  // Fetch folders and populate on page load
  fetchFolders();

  /**
   * Show popup to create a folder
   */
  /**
   * Show popup to create a folder
   */
  function showCreateFolderPopup() {
    // Remove existing popup if it exists
    const existingPopup = document.getElementById("createFolderPopup");
    if (existingPopup) existingPopup.remove();

    // Create popup container
    const popup = document.createElement("div");
    popup.id = "createFolderPopup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.zIndex = "1000";
    popup.style.background = "#fff";
    popup.style.padding = "20px";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    popup.style.borderRadius = "10px";
    popup.style.width = "300px";

    popup.innerHTML = `
      <h3 style="text-align: center; color: #1e6ea2; margin-bottom: 20px;">Create new notebook</h3>
      <label for="folderNameInput" style="display: block; margin-bottom: 10px; font-size: 14px; color: #555;">Notebook name:</label>
      <input id="folderNameInput" type="text" placeholder="Enter notebook name" style="width: 90%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
      <div style="text-align: center;">
        <button id="cancelFolderPopupButton" style="background-color: transparent; color: black; padding: 10px 20px;border: 2px solid #1e6ea2; border-radius: 5px; cursor: pointer; ">Cancel</button>
        <button id="createFolderPopupButton" style="background-color: #87c8f0;; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;margin-left: 30px;">Create</button>
      </div>
    `;

    document.body.appendChild(popup);

    // Event listeners for popup buttons
    const createButton = document.getElementById("createFolderPopupButton");
    const cancelButton = document.getElementById("cancelFolderPopupButton");

    createButton.addEventListener("click", () => {
      const folderName = document
        .getElementById("folderNameInput")
        .value.trim();
      if (!folderName) {
        alert("Folder name cannot be empty!");
        return;
      }
      createFolder(folderName);
      popup.remove();
    });

    cancelButton.addEventListener("click", () => {
      popup.remove();
    });
  }

  /**
   * Create a new folder dynamically with the logged-in user ID
   */
  async function createFolder(folderName) {
    try {
      console.log("Attempting to create folder with name:", folderName); // Debug log

      // Fetch the current user's ID from the session
      const response = await fetch("/users/current");
      if (!response.ok) {
        throw new Error("Failed to fetch current user.");
      }

      const user = await response.json();
      const userId = user.id;

      console.log("Fetched user ID:", userId); // Debug log

      // Post the new folder to the server
      const folderPayload = { user_id: userId, folder_name: folderName };
      console.log("POST request payload:", folderPayload); // Debug log

      const folderResponse = await fetch("/api/notebook/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderPayload),
      });

      if (!folderResponse.ok) {
        const errorResponse = await folderResponse.json();
        console.error("Error response from server:", errorResponse); // Debug log
        throw new Error(errorResponse.error || "Failed to create folder.");
      }

      console.log("Folder created successfully");
      fetchFolders(); // Refresh folder list after creation
    } catch (error) {
      console.error("Error creating folder:", error.message);
      alert(error.message);
    }
  }

  // Add event listener to the "Create Folder" button
  const createFolderButton = document.getElementById("createFolderButton");
  if (createFolderButton) {
    createFolderButton.addEventListener("click", showCreateFolderPopup);
  }

  // Event listener for "Recently Added" section
  const recentWordsList = document.getElementById("recentWords");
  if (recentWordsList) {
    recentWordsList.addEventListener("click", (event) => {
      const listItem = event.target;
      if (listItem.tagName === "LI" && listItem.dataset.folderId) {
        const folderId = parseInt(listItem.dataset.folderId, 10); // Convert folderId to a number
        const folder = folders.find((f) => f.folder_id === folderId); // Find folder in global array
        const folderName = folder ? folder.folder_name : "Folder"; // Get folder name or default

        console.log(
          `Fetching vocabulary for folder ID: ${folderId}, Name: ${folderName}`
        ); // Debug log
        fetchVocabulary(folderId, folderName); // Fetch vocabulary and pass folder name
      }
    });
  }

  // Event listener for saving a word
  const saveButton = document.getElementById("saveButton");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const word = document.getElementById("word")?.textContent;
      const meaning = document.getElementById("meaning")?.textContent;
      const folderId = document.getElementById("folderDropdown").value;

      if (!folderId) {
        alert("Please select a notebook or create one.");
        return;
      }

      if (!word || !meaning) {
        alert("Word and meaning must be defined before saving.");
        return;
      }

      saveWord(folderId, word, meaning);
    });
  }

  // Event listener for folder selection
  const folderDropdown = document.getElementById("folderDropdown");
  if (folderDropdown) {
    folderDropdown.addEventListener("change", (event) => {
      const folderId = parseInt(event.target.value, 10);
      const folder = folders.find((f) => f.folder_id === folderId);
      const folderName = folder ? folder.folder_name : "Folder";

      fetchVocabulary(folderId, folderName);
    });
  }

  /**
   * Fetch folders for the current user
   */
  async function fetchFolders() {
    try {
      const response = await fetch("/api/notebook/folders");
      if (!response.ok) {
        throw new Error(`Failed to fetch folders. Status: ${response.status}`);
      }

      const folders = await response.json();
      console.log("Fetched folders:", folders);

      // Populate the Recently Added section
      const recentWordsList = document.getElementById("recentWords");
      recentWordsList.innerHTML = ""; // Clear existing content

      if (folders.length === 0) {
        // If no folders, display a message in the "Recently Added" section
        const noFoldersMessage = document.createElement("p");
        noFoldersMessage.textContent = "No folders available. Create one now!";
        noFoldersMessage.style.color = "#666";
        noFoldersMessage.style.textAlign = "center";
        noFoldersMessage.style.marginTop = "20px";

        recentWordsList.appendChild(noFoldersMessage);
        return;
      }

      // Populate folders if they exist
      folders.forEach((folder) => {
        const listItem = document.createElement("li");
        listItem.classList.add("folder");

        // Create folder icon
        const folderIcon = document.createElement("div");
        folderIcon.classList.add("folder-icon");

        // Create folder name
        const folderName = document.createElement("div");
        folderName.classList.add("folder-name");
        folderName.textContent = folder.folder_name;

        // Append icon and name to the folder
        listItem.appendChild(folderIcon);
        listItem.appendChild(folderName);

        // Attach click event listener
        listItem.addEventListener("click", () => {
          fetchVocabulary(folder.folder_id, folder.folder_name);
        });

        // Append to the list
        recentWordsList.appendChild(listItem);
      });

      console.log("Recently Added list populated successfully.");
    } catch (error) {
      console.error("Error fetching folders:", error.message);
      alert("Failed to load folders. Please try again.");
    }
  }

  /**
   * Fetch and display words in a folder inside a popup
   */
  async function fetchVocabulary(folderId, folderName) {
    console.log(
      "Fetching vocabulary for folder ID:",
      folderId,
      "Name:",
      folderName
    ); // Debug log
    try {
      const response = await fetch(`/api/notebook/vocabularies/${folderId}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch vocabulary. Status: ${response.status}`
        );
      }

      const vocabularies = await response.json();
      console.log("Fetched vocabularies:", vocabularies); // Debug log
      createPopup(folderName, vocabularies, folderId); // Pass folderId to createPopup
    } catch (error) {
      console.error("Error fetching vocabulary:", error); // Debug error
      alert("Failed to load vocabulary. Please try again.");
    }
  }

  /**
   * Create a popup to display folder content
   */
  // Function to create the popup to display folder content
  function createPopup(folderName, vocabularies, folderId) {
    const existingPopup = document.getElementById("addWordPopup");
    if (existingPopup) existingPopup.remove();
    const popup = document.createElement("div");
    popup.id = "dynamicPopup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.zIndex = "1000";
    popup.style.background = "#fff";
    popup.style.padding = "20px";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    popup.style.width = "80%";
    popup.style.maxHeight = "80%";
    popup.style.overflowY = "auto";
    popup.style.borderRadius = "10px";

    // Header container
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center"; // Align vertically
    header.style.marginBottom = "20px";

    // Title and Delete Icon Wrapper
    const titleWrapper = document.createElement("div");
    titleWrapper.style.display = "flex";
    titleWrapper.style.alignItems = "center";
    titleWrapper.style.gap = "10px"; // Adjust spacing between title and delete icon

    const title = document.createElement("h2");
    title.textContent = folderName || "Folder";
    title.style.margin = "0";
    title.style.color = "#1e6ea2";

    const deleteFolderIcon = document.createElement("img");
    deleteFolderIcon.src = "/assets/icons/blue/dustbin-17.png";
    deleteFolderIcon.alt = "Delete Folder";
    deleteFolderIcon.style.width = "35px";
    deleteFolderIcon.style.cursor = "pointer";
    deleteFolderIcon.addEventListener("click", () => {
      showConfirmationModal(
        "Are you sure you want to delete this folder?",
        () => {
          deleteFolder(folderId);
        }
      );
    });

    // Append title and delete icon to titleWrapper
    titleWrapper.appendChild(title);
    titleWrapper.appendChild(deleteFolderIcon);

    // Close Button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.background = "none";
    closeButton.style.border = "none";
    closeButton.style.fontSize = "24px";
    closeButton.style.fontWeight = "bold";
    closeButton.style.cursor = "pointer";
    closeButton.style.color = "#1e6ea2";
    closeButton.addEventListener("click", () => popup.remove());

    // Append titleWrapper and closeButton to header
    header.appendChild(titleWrapper); // Title and delete icon on the left
    header.appendChild(closeButton); // Close button on the right

    // Add header to popup
    popup.appendChild(header);

    // Content
    const content = document.createElement("div");
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.gap = "10px";

    if (vocabularies.length === 0) {
      const noWordsMessage = document.createElement("p");
      noWordsMessage.textContent = "No words saved in this folder.";
      noWordsMessage.style.textAlign = "center";
      noWordsMessage.style.color = "#666";
      content.appendChild(noWordsMessage);
    } else {
      vocabularies.forEach((vocab, index) => {
        const wordContainer = document.createElement("div");
        wordContainer.style.display = "flex";
        wordContainer.style.justifyContent = "space-between";
        wordContainer.style.alignItems = "center";
        wordContainer.style.borderBottom = "1px solid #eee";
        wordContainer.style.padding = "10px 0";

        const wordNumber = document.createElement("span");
        wordNumber.textContent = `${index + 1}.`;
        wordNumber.style.color = "#555";

        const wordText = document.createElement("span");
        wordText.textContent = `${vocab.word}: ${vocab.meaning}`;
        wordText.style.flexGrow = "1";
        wordText.style.color = "#333";

        const deleteWordIcon = document.createElement("img");
        deleteWordIcon.src = "/assets/icons/blue/dustbin-17.png";
        deleteWordIcon.alt = "Delete Word";
        deleteWordIcon.style.width = "20px";
        deleteWordIcon.style.cursor = "pointer";
        deleteWordIcon.addEventListener("click", () => {
          showConfirmationModal(
            "Are you sure you want to delete this word?",
            () => {
              deleteWord(vocab.vocab_id);
            }
          );
        });

        wordContainer.appendChild(wordNumber);
        wordContainer.appendChild(wordText);
        wordContainer.appendChild(deleteWordIcon);
        content.appendChild(wordContainer);
      });
    }

    popup.appendChild(content);

    // Learn Button Wrapper
    const learnButtonWrapper = document.createElement("div");
    learnButtonWrapper.style.display = "flex";
    learnButtonWrapper.style.justifyContent = "space-between"; // Align Add Word and Learn buttons
    learnButtonWrapper.style.marginTop = "20px";

    // Add Word Button
    const addWordButton = document.createElement("button");
    addWordButton.textContent = "Add Word";
    addWordButton.style.backgroundColor = "transparent";
    addWordButton.style.color = "#1e6ea2";
    addWordButton.style.padding = "10px 20px";
    addWordButton.style.border = "2px solid #1e6ea2";
    addWordButton.style.borderRadius = "5px";
    addWordButton.style.cursor = "pointer";
    addWordButton.style.fontSize = "16px";
    addWordButton.addEventListener("click", () => openAddWordPopup(folderId)); // Add Word popup

    // Learn Button
    const learnButton = document.createElement("button");
    learnButton.textContent = "Learn";
    learnButton.style.backgroundColor = "#87c8f0";
    learnButton.style.color = "white";
    learnButton.style.padding = "10px 20px";
    learnButton.style.border = "none";
    learnButton.style.borderRadius = "5px";
    learnButton.style.cursor = "pointer";
    learnButton.style.fontSize = "16px";
    learnButton.addEventListener("click", () => openFlashcards(vocabularies));

    // Add buttons to the wrapper
    learnButtonWrapper.appendChild(addWordButton); // Add Word button on the left
    learnButtonWrapper.appendChild(learnButton); // Learn button on the right
    popup.appendChild(learnButtonWrapper);

    document.body.appendChild(popup);
  }

  function openFlashcards(vocabularies) {
    const modal = document.getElementById("lessonModal");
    const flashcardContainer = document.getElementById("flashcardContainer");
    let currentIndex = 0;

    // Clear existing flashcards and navigation
    flashcardContainer.innerHTML = "";

    // Remove duplicate button container if it exists
    const existingButtons = document.querySelector(".button-container");
    if (existingButtons) {
      existingButtons.remove();
    }

    // Function to create a flashcard
    function createFlashcard(vocab) {
      const flashcard = document.createElement("div");
      flashcard.classList.add("flashcard");
      flashcard.innerHTML = `
        <div class="flashcard-front">
          <h3>${vocab.word}</h3>
          <p class="ipa">${vocab.ipa || "/IPA/"}</p>
        </div>
        <div class="flashcard-back">
          <h3>${vocab.meaning}</h3>
        </div>
      `;
      return flashcard;
    }

    // Function to render a flashcard
    function renderFlashcard(index) {
      flashcardContainer.innerHTML = ""; // Clear the container
      const flashcard = createFlashcard(vocabularies[index]);
      flashcard.addEventListener("click", () =>
        flashcard.classList.toggle("flip")
      );
      flashcardContainer.appendChild(flashcard);
    }

    // Navigation Buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("button-container");

    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.classList.add("submit-quiz");
    prevButton.disabled = currentIndex === 0;
    prevButton.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderFlashcard(currentIndex);
        nextButton.disabled = false;
      }
      prevButton.disabled = currentIndex === 0;
    });

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.classList.add("next-button");
    nextButton.disabled = vocabularies.length <= 1;
    nextButton.addEventListener("click", () => {
      if (currentIndex < vocabularies.length - 1) {
        currentIndex++;
        renderFlashcard(currentIndex);
        prevButton.disabled = false;
      }
      nextButton.disabled = currentIndex === vocabularies.length - 1;
    });

    buttonContainer.appendChild(prevButton);
    buttonContainer.appendChild(nextButton);

    // Display the first flashcard
    renderFlashcard(currentIndex);

    // Add buttons to modal content
    flashcardContainer.after(buttonContainer);

    // Show the modal
    modal.style.display = "flex"; // Use flex to center modal content
  }

  // Close the modal
  function closeModal() {
    const modal = document.getElementById("lessonModal");
    modal.style.display = "none";
    document.body.classList.remove("no-scroll");
  }

  function flipFlashcard(card) {
    card.classList.toggle("flip");
  }

  // Function to Open the Learn Modal
  function openModal() {
    const modal = document.getElementById("lessonModal");
    modal.style.display = "block";
    document.body.classList.add("no-scroll");

    const navbar = document.querySelector(".navbar");
    const topbar = document.querySelector(".topbar");

    if (navbar) navbar.style.display = "none";
    if (topbar) topbar.style.display = "none";
  }

  // Function to Close the Learn Modal
  function closeModal() {
    const modal = document.getElementById("lessonModal");
    modal.style.display = "none";
    document.body.classList.remove("no-scroll");

    const navbar = document.querySelector(".navbar");
    const topbar = document.querySelector(".topbar");

    if (navbar) navbar.style.display = "flex";
    if (topbar) topbar.style.display = "flex";
  }
  // Attach closeModal to the window object
  window.closeModal = closeModal;

  // Delete a folder from the database
  async function deleteFolder(folderId) {
    try {
      const response = await fetch(`/api/notebook/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete folder.");
      }

      alert("Folder deleted successfully.");
      fetchFolders(); // Refresh the folder list
      const popup = document.getElementById("dynamicPopup");
      if (popup) popup.remove(); // Close the popup after deletion
    } catch (error) {
      console.error("Error deleting folder:", error.message);
      alert("Failed to delete folder.");
    }
  }
  // Function to delete a word
  async function deleteWord(vocabId) {
    try {
      const response = await fetch(`/api/notebook/vocabularies/${vocabId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete word.");
      }

      alert("Word deleted successfully.");
      // Optionally, refresh the vocabulary list in the UI
    } catch (error) {
      console.error("Error deleting word:", error.message);
      alert("Failed to delete word.");
    }
  }

  // Function to show a confirmation modal
  function showConfirmationModal(message, onConfirm) {
    // Remove any existing modal or overlay
    const existingModal = document.getElementById("confirmationModal");
    const existingOverlay = document.getElementById("modalOverlay");
    if (existingModal) existingModal.remove();
    if (existingOverlay) existingOverlay.remove();

    // Create an overlay to blur the background
    const overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.4)"; // Semi-transparent background
    overlay.style.zIndex = "1999";
    overlay.style.backdropFilter = "blur(5px)"; // Apply blur effect to the background

    // Append the overlay to the body
    document.body.appendChild(overlay);

    // Create the modal element
    const confirmationModal = document.createElement("div");
    confirmationModal.id = "confirmationModal";
    confirmationModal.style.position = "fixed";
    confirmationModal.style.top = "50%";
    confirmationModal.style.left = "50%";
    confirmationModal.style.transform = "translate(-50%, -50%)";
    confirmationModal.style.zIndex = "2000";
    confirmationModal.style.backgroundColor = "white";
    confirmationModal.style.padding = "40px";
    confirmationModal.style.borderRadius = "30px";
    confirmationModal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    confirmationModal.innerHTML = `
      <h3 style="color: #1e6ea2; text-align: center; margin-bottom: 20px;">${message}</h3>
      <div style="display: flex; justify-content: center; gap: 20px; flex-direction: row-reverse;">
        <button id="confirmDeleteButton" style="background-color: transparent; color: #1e6ea2; padding: 10px 20px; border: 2px solid #1e6ea2; border-radius: 5px; cursor: pointer;">Delete</button>
        <button id="cancelDeleteButton" style="background-color: #87c8f0; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
      </div>
    `;

    // Append the modal to the body
    document.body.appendChild(confirmationModal);

    // Add event listeners for modal buttons
    document
      .getElementById("confirmDeleteButton")
      .addEventListener("click", () => {
        onConfirm();
        confirmationModal.remove();
        overlay.remove(); // Remove overlay when confirmed
      });

    document
      .getElementById("cancelDeleteButton")
      .addEventListener("click", () => {
        confirmationModal.remove();
        overlay.remove(); // Remove overlay when canceled
      });
  }

  function flipFlashcard() {
    const flashcard = document.querySelector(".flashcard");
    flashcard.classList.toggle("flip");
  }

  // Attach flipFlashcard to the window object for global access
  window.flipFlashcard = flipFlashcard;
  // Add this inside createPopup function where you define the Learn Button Wrapper
  const addWordButton = document.createElement("button");
  addWordButton.textContent = "Add Word";
  addWordButton.style.backgroundColor = "transparent";
  addWordButton.style.color = "#1e6ea2";
  addWordButton.style.padding = "10px 20px";
  addWordButton.style.border = "2px solid #1e6ea2";
  addWordButton.style.borderRadius = "5px";
  addWordButton.style.cursor = "pointer";
  addWordButton.style.fontSize = "16px";
  addWordButton.style.marginRight = "auto"; // Align to the left
  addWordButton.addEventListener("click", () => openAddWordPopup(folderId));

  learnButtonWrapper.insertBefore(addWordButton, learnButton);
  function openAddWordPopup(folderId) {
    // Remove existing popup if it exists
    const existingPopup = document.getElementById("addWordPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "addWordPopup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.zIndex = "1000";
    popup.style.background = "#fff";
    popup.style.padding = "20px";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    popup.style.borderRadius = "10px";
    popup.style.width = "300px";

    popup.innerHTML = `
      <h3 style="text-align: center; color: #1e6ea2; margin-bottom: 20px;">Add Word</h3>
      <label for="wordInput" style="display: block; margin-bottom: 10px; font-size: 14px; color: #555;">Word/Phrase:</label>
      <input id="wordInput" type="text" placeholder="Enter word or phrase" style="width: 90%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
      <label for="ipaInput" style="display: block; margin-bottom: 10px; font-size: 14px; color: #555;">IPA (optional):</label>
      <input id="ipaInput" type="text" placeholder="Enter IPA" style="width: 90%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
      <label for="meaningInput" style="display: block; margin-bottom: 10px; font-size: 14px; color: #555;">Meaning:</label>
      <input id="meaningInput" type="text" placeholder="Enter meaning" style="width: 90%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; margin-bottom: 20px; font-size: 14px;">
      <div style="text-align: center;">
        <button id="cancelAddWordButton" style="background-color: transparent; color: black; padding: 10px 20px; border: 2px solid #1e6ea2; border-radius: 5px; cursor: pointer;">Cancel</button>
        <button id="saveWordButton" style="background-color: #87c8f0; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 30px;">Save</button>
      </div>
    `;

    document.body.appendChild(popup);

    const cancelButton = document.getElementById("cancelAddWordButton");
    const saveButton = document.getElementById("saveWordButton");

    cancelButton.addEventListener("click", () => popup.remove());

    saveButton.addEventListener("click", () => {
      const word = document.getElementById("wordInput").value.trim();
      const ipa = document.getElementById("ipaInput").value.trim();
      const meaning = document.getElementById("meaningInput").value.trim();

      if (!word || !meaning) {
        alert("Word and Meaning cannot be empty!");
        return;
      }

      saveWord(folderId, word, ipa, meaning);
      popup.remove();
    });
  }
  async function saveWord(folderId, word, ipa, meaning) {
    try {
      const response = await fetch(`/api/notebook/vocabularies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId, word, ipa, meaning }),
      });

      if (!response.ok) {
        throw new Error("Failed to save word.");
      }

      alert("Word added successfully.");
      fetchVocabulary(folderId); // Refresh vocabulary list
    } catch (error) {
      console.error("Error saving word:", error.message);
      alert("Failed to save word. Please try again.");
    }
  }
});
