document.addEventListener("DOMContentLoaded", () => {
  const searchButton = document.getElementById("searchButton");
  const dictionarySearch = document.getElementById("dictionarySearch");

  searchButton.addEventListener("click", () => {
    const word = dictionarySearch.value.trim();

    if (!word) {
      alert("Please enter a word to search.");
      return;
    }

    fetchCombinedWordData(word);
  });

  async function fetchCombinedWordData(word) {
    const baseUrl = window.location.origin;
    const dictionaryUrl = `${baseUrl}/dictionary/${encodeURIComponent(word)}`;
    const wiktionaryUrl = `https://en.wiktionary.org/w/api.php?action=query&titles=${encodeURIComponent(
      word
    )}&prop=extracts&explaintext=true&format=json&origin=*`;

    try {
      const [dictionaryResponse, wiktionaryResponse] = await Promise.all([
        fetch(dictionaryUrl),
        fetch(wiktionaryUrl),
      ]);

      if (!dictionaryResponse.ok) {
        throw new Error(`WordsAPI error: ${dictionaryResponse.status}`);
      }
      const dictionaryData = await dictionaryResponse.json();

      if (!wiktionaryResponse.ok) {
        throw new Error(`Wiktionary API error: ${wiktionaryResponse.status}`);
      }
      const wiktionaryData = await wiktionaryResponse.json();

      const ipa = extractIPAFromWiktionary(wiktionaryData);
      const translatedWord = await translateToVietnamese(word);

      parseAndDisplayContent(word, translatedWord, dictionaryData, ipa);
    } catch (error) {
      console.error("Error fetching word data:", error);
      alert("An error occurred while fetching word data. Please try again.");
    }
  }

  async function translateToVietnamese(text) {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/translate`;
    const params = { q: text, source: "en", target: "vi", format: "text" };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      console.error("Error translating text:", error);
      return text;
    }
  }

  function extractIPAFromWiktionary(data) {
    const pages = data.query.pages;
    const page = pages[Object.keys(pages)[0]];
    if (page && page.extract) {
      const ipaMatch = page.extract.match(/IPA.*?\/[^\n]+/);
      return ipaMatch ? ipaMatch[0].replace("IPA", "").trim() : "Not available";
    }
    return "Not available";
  }

  function parseAndDisplayContent(word, translatedWord, data, ipa) {
    const filteredDefinitions = data.definitions?.filter((def) => {
      const excludedKeywords = ["vehicle", "machinery", "construction"];
      return !excludedKeywords.some((keyword) =>
        def.definition.toLowerCase().includes(keyword)
      );
    });

    const definitions = filteredDefinitions?.length
      ? filteredDefinitions
          .slice(0, 3)
          .map(
            (def) => `<strong>(${def.partOfSpeech}):</strong> ${def.definition}`
          )
          .join("<br>")
      : "No definitions available.";

    const examples = data.examples?.length
      ? data.examples.slice(0, 3).join("<br>")
      : "No sentence examples available.";

    const synonyms = data.synonyms?.length
      ? data.synonyms.join(", ")
      : "No synonyms available.";

    let resultDiv = document.getElementById("result");
    if (!resultDiv) {
      resultDiv = document.createElement("div");
      resultDiv.id = "result";
      document.querySelector(".notebook-container").appendChild(resultDiv);
    }

    resultDiv.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        <h1 style="margin: 0;  color: #1e6ea2;">${word}</h1>
        <button id="saveButton" style="background: none; border: none; cursor: pointer;">
          <img src="../assets/icons/blue/Icons-VnEng-15.png" alt="Save Icon" />
        </button>
      </div>
      <h3 style="margin: 0;  color: #1e6ea2;"> <strong>${translatedWord}</strong></h3>
      <div>
        <h4>Pronunciation</h4>
        <p>${ipa}</p>
      </div>
      <div>
        <h4>Definitions</h4>
        <p>${definitions}</p>
      </div>
      <div>
        <h4>Examples</h4>
        <p>${examples}</p>
      </div>
      <div>
        <h4>Synonyms</h4>
        <p>${synonyms}</p>
      </div>
    `;

    document.getElementById("saveButton").addEventListener("click", () => {
      showFolderPopup(word, translatedWord);
    });
  }

  function showFolderPopup(word, translatedWord) {
    const existingPopup = document.getElementById("folderPopup");
    if (existingPopup) existingPopup.remove();

    const popup = document.createElement("div");
    popup.id = "folderPopup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "#fff";
    popup.style.padding = "20px";
    popup.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
    popup.style.width = "80%";
    popup.style.maxHeight = "90%";
    popup.style.overflowY = "auto";
    popup.style.borderRadius = "10px";
    popup.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; text-align: center; flex-grow: 1; color: #1e6ea2;">Select a notebook</h2>
        <button id="closePopupButton" style="background: none; border: none; font-size: 24px; font-weight: bold; cursor: pointer; color: #1e6ea2;">&times;</button>
      </div>
      <div id="folderList" style="display: flex; flex-direction: column; gap: 15px; padding: 10px;"></div>
      <button id="createFolderButton" style="background-color: #87c8f0; color: white; padding: 10px 20px; font-size: 14px; border: none; cursor: pointer; border-radius: 5px; float: right; margin-top: 10px;">
        Create New Notebook
      </button>
    `;

    document.body.appendChild(popup);

    // Add event listener after the popup is added to the DOM
    document
      .getElementById("createFolderButton")
      .addEventListener("click", showCreateFolderPopup);

    // Fetch folders and populate the list
    fetchFolders().then((folders) =>
      populateFolderList(folders, word, translatedWord)
    );

    // Close the popup
    document
      .getElementById("closePopupButton")
      .addEventListener("click", () => popup.remove());
  }

  function populateFolderList(folders = [], word, translatedWord) {
    const folderList = document.getElementById("folderList");
    folderList.innerHTML = ""; // Clear existing content

    if (!Array.isArray(folders) || folders.length === 0) {
      folderList.innerHTML = `<p style="text-align: center; color: #666;">No notebook available. Create one now!</p>`;
      return;
    }

    folders.forEach((folder) => {
      const folderDiv = document.createElement("div");
      folderDiv.style.cursor = "pointer";
      folderDiv.style.padding = "10px";
      folderDiv.style.border = "1px solid #ccc";
      folderDiv.style.borderRadius = "5px";
      folderDiv.style.display = "flex";
      folderDiv.style.alignItems = "center";

      folderDiv.innerHTML = `
        <img src="../assets/icons/blue/Icons-VnEng-18.png" alt="Folder Icon" style="width: 25px; height: 25px; margin-right: 10px; vertical-align: middle;">
        ${folder.folder_name}
      `;

      folderDiv.addEventListener("click", () => {
        saveWord(folder.folder_id, word, translatedWord);
        document.getElementById("folderPopup").remove();
      });

      folderList.appendChild(folderDiv);
    });
  }

  async function saveWord(folderId, word, meaning) {
    try {
      const response = await fetch("/api/notebook/vocabularies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ folder_id: folderId, word, meaning }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save word. Status: ${response.status}`);
      }

      alert(`Word "${word}" saved successfully in folder "${folderId}"!`);
    } catch (error) {
      console.error("Error saving word:", error);
      alert("Failed to save word. Please try again.");
    }
  }

  async function fetchFolders() {
    try {
      const response = await fetch("/api/notebook/folders", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch folders. Status: ${response.status}`);
      }

      const folders = await response.json();
      return folders;
    } catch (error) {
      console.error("Error fetching folders:", error);
      alert("Failed to load folders. Please try again.");
      return [];
    }
  }

  // Function to create a new notebook folder
  async function createFolder(folderName) {
    try {
      console.log("Attempting to create folder with name:", folderName);

      // Fetch current user's ID
      const response = await fetch("/users/current");
      if (!response.ok) {
        throw new Error("Failed to fetch current user.");
      }

      const user = await response.json();
      const folderPayload = { user_id: user.id, folder_name: folderName };

      console.log("POST request payload:", folderPayload);

      const folderResponse = await fetch("/api/notebook/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderPayload),
      });

      if (!folderResponse.ok) {
        const errorResponse = await folderResponse.json();
        console.error("Error response from server:", errorResponse);
        throw new Error(errorResponse.error || "Failed to create folder.");
      }

      console.log("Folder created successfully");
      fetchFolders(); // Refresh folder list after creation if needed
    } catch (error) {
      console.error("Error creating folder:", error.message);
      alert(error.message);
    }
  }
  // Show the popup for creating a new notebook
  function showCreateFolderPopup() {
    const existingPopup = document.getElementById("createFolderPopup");
    if (existingPopup) existingPopup.remove();

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
        <button id="cancelFolderPopupButton" style="background-color: transparent; color: black; padding: 10px 20px;border: 2px solid #1e6ea2; border-radius: 5px; cursor: pointer;">Cancel</button>
        <button id="createFolderPopupButton" style="background-color: #87c8f0; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 30px;">Create</button>
      </div>
    `;

    document.body.appendChild(popup);

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
      createFolder(folderName).then(() => {
        popup.remove();
      });
    });

    cancelButton.addEventListener("click", () => {
      popup.remove();
    });
  }
});
