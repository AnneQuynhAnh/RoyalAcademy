document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("lessonModal");
  const closeButton = modal.querySelector(".close-button");
  const quizContainer = document.getElementById("quiz-container");
  const contentDiv = document.querySelector(".content");
  const correctAudio = new Audio("/audio/correct.mp3");
  const wrongAudio = new Audio("/audio/wrong.mp3");
  let totalQuestions = 0;
  let correctAnswers = 0;
  let currentLessonId = null; // Declare globally at the top of the script
  let units = {};
  const progressBarContainer = document.createElement("div");
  progressBarContainer.id = "progress-bar-container";
  progressBarContainer.style.marginBottom = "20px";
  quizContainer.before(progressBarContainer);
  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/users/current", {
        method: "GET",
        credentials: "include", // Important for cookies
      });
      if (!response.ok) throw new Error("Failed to fetch current user");
      const user = await response.json();
      console.log("Current User:", user);
      return user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  // Function to render the progress bar
  const renderProgressBar = (total) => {
    progressBarContainer.innerHTML = ""; // Clear existing progress bar

    const progressBarWrapper = document.createElement("div");
    progressBarWrapper.style.position = "relative";
    progressBarWrapper.style.width = "100%";
    progressBarWrapper.style.height = "40px"; // Enough space for both circles and bar
    progressBarWrapper.style.display = "flex";
    progressBarWrapper.style.alignItems = "flex-end"; // Aligns the bar and circles properly

    const progressBar = document.createElement("div");
    progressBar.id = "progress-bar";
    progressBar.style.position = "absolute";
    progressBar.style.bottom = "0"; // Aligns the bar at the bottom
    progressBar.style.width = "100%";
    progressBar.style.height = "4px"; // Thickness of the bar
    progressBar.style.backgroundColor = "#ccc";
    progressBar.style.borderRadius = "2px";

    // Add the circles for progress points
    for (let i = 0; i < total; i++) {
      const circle = document.createElement("div");
      circle.className = "progress-item";
      circle.style.position = "absolute";
      circle.style.width = "20px";
      circle.style.height = "20px";
      circle.style.backgroundColor = "#ccc";
      circle.style.color = "white";
      circle.style.borderRadius = "50%";
      circle.style.textAlign = "center";
      circle.style.lineHeight = "20px";
      circle.style.fontSize = "12px";
      circle.style.left = `${(i / (total - 1)) * 100}%`;
      circle.style.transform = "translate(-50%, -15px)"; // Moves the circle slightly above the bar
      circle.textContent = i + 1;

      progressBarWrapper.appendChild(circle);
    }

    // Append the bar and wrapper to the container
    progressBarWrapper.appendChild(progressBar);
    progressBarContainer.appendChild(progressBarWrapper);
  };

  // Now define updateProgressBar below renderProgressBar
  const updateProgressBar = (current, total) => {
    const progressItems = document.querySelectorAll(".progress-item");
    progressItems.forEach((item, index) => {
      if (index < current) {
        item.style.backgroundColor = "#1e6ea2"; // Active color
      } else {
        item.style.backgroundColor = "#ccc"; // Inactive color
      }
    });

    const progressLine = document.createElement("div");
    progressLine.id = "progress-line";
    progressLine.style.position = "absolute";
    progressLine.style.bottom = "0"; // Aligns with the bottom of the bar
    progressLine.style.height = "4px";
    progressLine.style.backgroundColor = "#1e6ea2";
    progressLine.style.width = `${(current / total) * 100}%`;
    progressLine.style.transition = "width 0.3s ease-in-out";

    const existingLine = document.getElementById("progress-line");
    if (existingLine) {
      existingLine.style.width = `${(current / total) * 100}%`;
    } else {
      document.getElementById("progress-bar").appendChild(progressLine);
    }
  };

  // Fetch lessons from backend
  const fetchLessons = async () => {
    try {
      const response = await fetch("/home/lessons");
      if (!response.ok) throw new Error("Failed to fetch lessons");
      return await response.json();
    } catch (error) {
      console.error("Error fetching lessons:", error);
      return [];
    }
  };

  // Fetch questions for a specific lesson
  const fetchQuestions = async (lessonId) => {
    try {
      const response = await fetch(`/home/questions/${lessonId}`);
      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();
      console.log(`Raw API data for lessonId ${lessonId}:`, data);

      // Ensure questions are valid and unique
      const uniqueQuestions = data.filter(
        (q, index, self) =>
          index === self.findIndex((t) => t.question_id === q.question_id)
      );

      console.log(
        `Unique questions count after filtering: ${uniqueQuestions.length}`
      );
      return uniqueQuestions;
    } catch (error) {
      console.error("Error fetching questions:", error);
      return [];
    }
  };

  // Fetch lessons and user progress
  const fetchLessonsWithProgress = async () => {
    try {
      const response = await fetch("/home/lessons", {
        method: "GET",
        credentials: "include", // Include session cookies
      });
      if (!response.ok) throw new Error("Failed to fetch lessons.");
      return await response.json(); // Returns lessons with progress
    } catch (error) {
      console.error("Error fetching lessons:", error);
      alert("Failed to load lessons. Please try again.");
      return [];
    }
  };

  // Render lessons dynamically
  const renderLessons = async () => {
    try {
      const lessons = await fetchLessons();
      if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
        console.error("No lessons available to render or invalid format.");
        return;
      }

      // Group lessons by unit name
      const units = lessons.reduce((acc, lesson) => {
        acc[lesson.unit_name] = acc[lesson.unit_name] || {
          description: lesson.unit_description,
          lessons: [],
        };
        acc[lesson.unit_name].lessons.push(lesson);
        return acc;
      }, {});

      // Sort unit names numerically
      const sortedUnitNames = Object.keys(units).sort((a, b) => {
        const aNumber = parseInt(a.match(/\d+/), 10) || 0; // Extract number from "Unit X"
        const bNumber = parseInt(b.match(/\d+/), 10) || 0;
        return aNumber - bNumber;
      });

      // Render sorted units
      sortedUnitNames.forEach((unitName, index) => {
        const unitDiv = document.createElement("div");
        unitDiv.classList.add("unit");

        if (index === 0) {
          unitDiv.classList.add("default"); // Keep Unit 1 styled as default
        } else {
          const isComplete = units[unitName].lessons.every(
            (lesson) => lesson.status === "completed"
          );
          unitDiv.classList.add(isComplete ? "default" : "incomplete");
        }

        const unitHeader = document.createElement("div");
        unitHeader.classList.add("unit-header");
        unitHeader.innerHTML = `
          <h2>${unitName}</h2>
          <p>${units[unitName].description}</p>
        `;
        unitDiv.appendChild(unitHeader);
        contentDiv.appendChild(unitDiv);

        const lessonsDiv = document.createElement("div");
        lessonsDiv.classList.add("lessons");

        units[unitName].lessons.forEach((lesson) => {
          const lessonDiv = document.createElement("div");
          lessonDiv.classList.add("lesson");
          lessonDiv.id = `lesson${lesson.lesson_id}`;

          // Add the check icon next to the lesson name if completed
          lessonDiv.innerHTML = `
            <h3>
              ${lesson.lesson_name}
              ${
                lesson.status === "completed"
                  ? `<img src="/assets/icons/blue/Icons-VnEng_completed-icon.png" 
                       alt="Completed" 
                       style="width: 24px; height: 24px; margin-left: 5px; position: relative; top: 5px;">`
                  : ""
              }
              ${
                lesson.status !== "completed"
                  ? `<img src="/assets/icons/blue/Icons-VnEng-21.png" 
                       alt="Not Started" 
                       style="width: 24px; height: 24px; margin-left: 5px; position: relative; top: 5px;">`
                  : ""
              }
            </h3>
            <p>${lesson.description}</p>
          `;

          lessonsDiv.appendChild(lessonDiv);

          lessonDiv.addEventListener("click", () =>
            loadLessonQuestions(lesson.lesson_id)
          );
        });

        contentDiv.appendChild(lessonsDiv);

        if (index !== 0) {
          unitHeader.addEventListener("click", () => {
            lessonsDiv.classList.toggle("expanded");
          });
        } else {
          lessonsDiv.classList.add("expanded"); // Always expanded for Unit 1
        }
      });
    } catch (error) {
      console.error("Error rendering lessons:", error);
    }
  };

  // Initialize rendering on DOMContentLoaded
  document.addEventListener("DOMContentLoaded", async () => {
    await renderLessons();
    console.log(units); // Debugging to ensure units is defined
  });

  // Function to update lesson status
  const updateLessonStatus = async (
    lessonId,
    status,
    progress,
    correctAnswers
  ) => {
    try {
      const response = await fetch("/home/updatelesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lessonId, status, progress, correctAnswers }),
      });

      if (!response.ok) {
        throw new Error("Failed to update lesson status.");
      }

      console.log("Lesson status updated successfully.");
    } catch (error) {
      console.error("Error updating lesson status:", error);
    }
  };

  // Initialize lessons rendering
  document.addEventListener("DOMContentLoaded", renderLessons);

  // Initialize lessons rendering
  document.addEventListener("DOMContentLoaded", renderLessons);

  // Render questions in the modal
  const loadLessonQuestions = async (lessonId) => {
    // Assign the lessonId to the global variable
    currentLessonId = lessonId;

    const questions = await fetchQuestions(lessonId);

    if (!questions.length) {
      console.error("No questions available for this lesson.");
      return;
    }

    // Set totalQuestions to the exact length of fetched questions
    totalQuestions = questions.length;
    console.log(`Total questions for lessonId ${lessonId}:`, totalQuestions);

    // Render the progress bar
    renderProgressBar(totalQuestions);
    updateProgressBar(0, totalQuestions);

    // Clear previous questions in the quiz container
    quizContainer.innerHTML = "";

    // Iterate over the questions to render them
    questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.classList.add("quiz-page");
      questionDiv.id = `question${index + 1}`;
      questionDiv.style.display = index === 0 ? "block" : "none";

      questionDiv.innerHTML = `
        <h2>${index + 1}. ${question.question_text}</h2>
        ${renderQuestionContent(question)}
        <button class="next-button" data-next="question${
          index + 2
        }" data-question-index="${index}">Next</button>
      `;

      quizContainer.appendChild(questionDiv);

      // Add logic for matching question type
      if (question.question_type === "matching") {
        const options = JSON.parse(question.options || "[]");
        attachMatchingLogic(options); // Pass the options to the function
      }
    });

    // Attach audio playback listeners
    questions.forEach((question) => {
      if (question.question_type === "audio_fill_blank" && question.audio_url) {
        const speakerIcon = document.getElementById(
          `speakerIcon${question.question_id}`
        );
        const progressBar = document.getElementById(
          `audioProgressBar${question.question_id}`
        );
        if (speakerIcon && progressBar) {
          speakerIcon.addEventListener("click", () =>
            playAudioWithProgress(question.audio_url, progressBar)
          );
        }
      }
    });

    // Open the modal
    openModal();

    // Add navigation logic for next buttons
    document.querySelectorAll(".next-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const currentPage = button.closest(".quiz-page");
        const nextPageId = button.getAttribute("data-next");
        const nextPage = document.getElementById(nextPageId);

        const questionIndex = parseInt(
          button.getAttribute("data-question-index"),
          10
        );
        const currentQuestion = questions[questionIndex];

        validateAnswer(currentPage, currentQuestion, nextPage);

        // Update the progress bar
        if (questionIndex + 1 < totalQuestions) {
          updateProgressBar(questionIndex + 1, totalQuestions);
        }
      });
    });
  };

  // Render question content based on type
  const renderQuestionContent = (question) => {
    switch (question.question_type) {
      case "multiple_choice":
        const options = JSON.parse(question.options || "[]");
        return `
          <div style="display: flex; flex-direction: column; justify-content: flex-end; height: 100%; padding: 20px;">
            <!-- Options placed above the Next button -->
            <div class="options-container" style="margin-bottom: 20px; ">
              ${options
                .map(
                  (opt) => `
                  <div class="option shared-width" data-answer="${opt.is_correct}" 
                      style="  padding: 10px; margin: 5px 0; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; transition: background-color 0.3s;">
                      ${opt.option}
                  </div>`
                )
                .join("")}
            </div>
            <!-- Placeholder for Next button -->
            <div class="next-button-container" style="margin-top: auto;">
              <button class="next-button" data-next="question${
                question.question_id + 1
              }" data-question-index="${question.question_id}" 
                style="padding: 10px 20px; background-color: #1e6ea2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Next
              </button>
            </div>
          </div>`;

      case "fill_in_the_blank":
        return `
          <div>
            <label for="fillInput${question.question_id}" style="font-weight: bold; display: block; margin-bottom: 5px;"></label>
            <input type="text" id="fillInput${question.question_id}" class="fill-input shared-width" placeholder="Type your answer here"
                style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;" />
          </div>`;

      case "audio_fill_blank":
        return question.audio_url
          ? `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <img src="/assets/icons/blue/Icons-VnEng_speakericon.png" alt="Play Audio"
                  class="speaker-icon" id="speakerIcon${question.question_id}" style="width: 50px; height: 50px; cursor: pointer;" />
              <input type="range" id="audioProgressBar${question.question_id}" value="0" max="100"
                  style="flex-grow: 1; height: 8px; cursor: pointer; appearance: none; background: #ddd; border-radius: 5px; margin-left: 15px;" />
            </div>
            <input type="text" id="audioFillInput${question.question_id}" class="fill-input shared-width" placeholder="Type your answer here"
                style="width: 100%; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;" />
          </div>`
          : `
          <div style="margin-top: 10px;">
            <p style="color: red; font-weight: bold;">Audio not available for this question.</p>
          </div>`;

      case "matching":
        const pairs = JSON.parse(question.options || "[]");

        // Shuffle left and right columns
        const leftItems = pairs
          .map((pair) => ({ text: pair.left, index: pairs.indexOf(pair) }))
          .sort(() => Math.random() - 0.5);
        const rightItems = pairs
          .map((pair) => ({ text: pair.right, index: pairs.indexOf(pair) }))
          .sort(() => Math.random() - 0.5);

        return `
          <div style="display: flex; justify-content: center; gap: 20px; padding: 20px;">
            <div style="flex: 1; text-align: center;">
              ${leftItems
                .map(
                  (item) => `
                  <div class="matching-item" data-index="${item.index}" data-side="left" 
                      style="padding: 10px; margin: 5px 0; border: 1px solid #ccc; border-radius: 5px; cursor: pointer;">
                      ${item.text}
                  </div>`
                )
                .join("")}
            </div>
            <div style="flex: 1; text-align: center;">
              ${rightItems
                .map(
                  (item) => `
                  <div class="matching-item" data-index="${item.index}" data-side="right" 
                      style="padding: 10px; margin: 5px 0; border: 1px solid #ccc; border-radius: 5px; cursor: pointer;">
                      ${item.text}
                  </div>`
                )
                .join("")}
            </div>
          </div>`;

      case "translation":
        const translationOptions = JSON.parse(question.options || "[]");
        return translationOptions
          .map(
            (opt) =>
              `<div class="option shared-width" data-answer="${opt.is_correct}" style="padding: 10px; margin: 5px 0; border: 1px solid #ccc; border-radius: 5px; cursor: pointer;">
                            ${opt.option}
                        </div>`
          )
          .join("");

      default:
        return "<p style='color: red; font-weight: bold;'>Unsupported question type</p>";
    }
  };

  const attachMatchingLogic = (options = []) => {
    if (!Array.isArray(options) || options.length === 0) {
      console.error("Matching options are invalid or empty.");
      return;
    }

    const selectedItems = [];
    const matches = options.reduce((acc, pair) => {
      acc[pair.left] = pair.right;
      return acc;
    }, {});

    document.querySelectorAll(".matching-item").forEach((item) => {
      item.addEventListener("click", () => {
        if (item.classList.contains("matched") || selectedItems.length === 2)
          return;

        // Toggle selection
        item.classList.toggle("selected");
        item.style.backgroundColor = item.classList.contains("selected")
          ? "#87CEEB"
          : ""; // Light blue for selected

        if (item.classList.contains("selected")) {
          selectedItems.push(item);
        } else {
          selectedItems.splice(selectedItems.indexOf(item), 1);
        }

        // Check match if two items are selected
        if (selectedItems.length === 2) {
          const [first, second] = selectedItems;

          const isMatch =
            (matches[first.innerText] === second.innerText &&
              first.dataset.side === "left" &&
              second.dataset.side === "right") ||
            (matches[second.innerText] === first.innerText &&
              second.dataset.side === "left" &&
              first.dataset.side === "right");

          if (isMatch) {
            // Correct match
            first.classList.add("matched");
            second.classList.add("matched");
            first.style.backgroundColor = "#D3D3D3"; // Light gray for matched
            second.style.backgroundColor = "#D3D3D3";
            first.style.pointerEvents = "none";
            second.style.pointerEvents = "none";

            selectedItems.length = 0; // Clear selection
            correctAudio.play(); // Play correct sound
          } else {
            // Incorrect match
            first.style.backgroundColor = "red";
            second.style.backgroundColor = "red";

            setTimeout(() => {
              first.style.backgroundColor = "";
              second.style.backgroundColor = "";
              first.classList.remove("selected");
              second.classList.remove("selected");
              selectedItems.length = 0; // Clear selection
            }, 500);

            wrongAudio.play(); // Play wrong sound
          }
        }
      });
    });
  };

  // Play audio feedback with error handling
  function playAudioFeedback(audio) {
    if (!audio) return;
    audio.currentTime = 0; // Reset audio playback
    audio
      .play()
      .then(() => console.log("Audio played successfully"))
      .catch((error) => console.error("Error playing audio:", error));
  }
  function validateAnswer(currentPage, question, nextPage) {
    let isCorrect = false;

    if (question.question_type === "multiple_choice") {
      const selectedOption = currentPage.querySelector(".option.selected");
      if (!selectedOption) {
        alert("You need to choose an answer."); // Handle unanswered cases
        return;
      }
      isCorrect = selectedOption.getAttribute("data-answer") === "true";

      if (!isCorrect) {
        selectedOption.style.backgroundColor = "red";
        setTimeout(() => {
          selectedOption.style.backgroundColor = ""; // Revert to original
        }, 500);
      }
    } else if (
      question.question_type === "fill_in_the_blank" ||
      question.question_type === "audio_fill_blank"
    ) {
      const userInput = currentPage.querySelector(".fill-input").value.trim();
      if (!userInput) {
        alert("You need to type an answer."); // Handle unanswered cases
        return;
      }
      isCorrect =
        userInput.toLowerCase() ===
        (question.correct_answer || "").toLowerCase();

      if (!isCorrect) {
        const inputField = currentPage.querySelector(".fill-input");
        inputField.style.borderColor = "red";
        setTimeout(() => {
          inputField.style.borderColor = ""; // Revert to original
        }, 500);
      }
    } else if (question.question_type === "matching") {
      const totalMatches = JSON.parse(question.options || "[]").length;
      const matchedItems = currentPage.querySelectorAll(
        ".matching-item.matched"
      );

      // Check if all items are matched
      isCorrect = matchedItems.length === totalMatches * 2;
    }

    // Increment correct answers if the answer is correct
    if (isCorrect) {
      correctAnswers++;
      playAudioFeedback(correctAudio); // Play correct sound
    } else {
      playAudioFeedback(wrongAudio); // Play wrong sound
    }

    // Update the progress bar
    const questionIndex =
      parseInt(currentPage.id.replace("question", ""), 10) - 1;
    updateProgressBar(questionIndex + 1, totalQuestions);

    // Navigate to the next question or show results
    if (nextPage) {
      setTimeout(() => {
        currentPage.style.display = "none";
        nextPage.style.display = "block";
      }, 1000);
    } else {
      setTimeout(() => {
        showQuizResults(); // Call the function to display results
      }, 1000);
    }
  }

  // Function to play audio with progress bar tracking
  function playAudioWithProgress(audioUrl, progressBar) {
    if (!audioUrl || !progressBar) {
      console.error("Invalid audio URL or progress bar.");
      return;
    }

    const audio = new Audio(audioUrl);

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
      }
    });

    progressBar.addEventListener("input", () => {
      if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
      }
    });

    audio
      .play()
      .then(() =>
        console.log("Audio with progress played successfully:", audioUrl)
      )
      .catch((error) =>
        console.error("Error playing audio with progress:", error)
      );
  }

  // Enable "Next" button after an answer is selected
  quizContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("option")) {
      const parentPage = e.target.closest(".quiz-page");
      const options = parentPage.querySelectorAll(".option");

      options.forEach((opt) => opt.classList.remove("selected"));
      e.target.classList.add("selected");
    }
  });

  // Open and close  modal

  const openModal = () => {
    modal.style.display = "block";
    document.body.classList.add("no-scroll");

    const navbar = document.querySelector(".bottom-nav");
    const topbar = document.querySelector(".top-nav");

    if (navbar) navbar.style.display = "none";
    if (topbar) topbar.style.display = "none";
  };

  const closeModal = () => {
    console.log("closeModal called");
    modal.style.display = "none";
    document.body.classList.remove("no-scroll");

    const navbar = document.querySelector(".bottom-nav");
    const topbar = document.querySelector(".top-nav");

    if (navbar) {
      console.log("Restoring navbar visibility");
      navbar.style.display = "flex";
    }
    if (topbar) {
      console.log("Restoring topbar visibility");
      topbar.style.display = "flex";
    }

    quizContainer.innerHTML = ""; // Clear content for next usage
    console.log("Modal closed and content cleared");
  };

  function showQuizResults() {
    if (!currentLessonId) {
      console.error("Lesson ID is undefined. Cannot update status.");
      return;
    }

    const status = "completed";
    const progress = 100; // Assuming full progress when completed

    console.log("Updating lesson status with:", {
      lessonId: currentLessonId,
      status,
      progress,
      correctAnswers, // Send only the correctAnswers now
    });

    // Update lesson status
    updateLessonStatus(currentLessonId, status, progress, correctAnswers);

    // Display the quiz results
    quizContainer.innerHTML = `
      <div style="text-align: center; color: #1e6ea2; font-family: Arial, sans-serif; margin-top: 20vh;">
        <h1 style="font-size: 4rem; font-weight: bold; margin-bottom: 20px;">${correctAnswers}/${totalQuestions}</h1>
        <h3 style="font-size: 2rem; font-weight: bold; margin: 0;">Well done!</h3>
        <h3 style="font-size: 1.6rem; font-weight: normal; margin-top: 10px;">You have completed the quiz</h3>
        <div style="margin-top: 30px;">
          <button id="continueButton" style="background-color: #87c8f0; color: #fff; padding: 10px 20px; font-size: 1.2rem; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
            Continue Learning
          </button>
          <button id="exitButton" style="background-color: transparent; color: #1e6ea2; padding: 10px 20px; font-size: 1.2rem; border: 2px solid #1e6ea2; border-radius: 5px; cursor: pointer;">
            Exit
          </button>
        </div>
      </div>
    `;

    // Attach event listeners for buttons
    const continueButton = document.getElementById("continueButton");
    const exitButton = document.getElementById("exitButton");

    continueButton.addEventListener("click", () => {
      console.log("Continue Learning clicked");
      closeModal(); // Close the modal
    });

    exitButton.addEventListener("click", () => {
      console.log("Exit clicked");
      // Redirect to the correct path for home.html
      window.location.href = "/HTML/home.html";
    });
  }

  // Dynamically create the confirmation modal
  const confirmationModal = document.createElement("div");
  confirmationModal.id = "confirmationModal";
  confirmationModal.style.display = "none";
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
   <h3 style="color: #1e6ea2; text-align: center; margin-bottom: 20px;">Are you sure you want to exit?</h3>
  <div style="display: flex; justify-content: center; gap: 20px; flex-direction: row-reverse;">
  <button id="cancelButton" style="background-color: #87c8f0; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
  <button id="confirmExitButton" style="background-color: transparent; color: #1e6ea2; padding: 10px 20px; border: 2px solid #1e6ea2; border-radius: 5px; cursor: pointer;">Exit</button>
</div>

 `;
  document.body.appendChild(confirmationModal);

  // Get the cancel and confirm exit buttons
  const cancelButton = document.getElementById("cancelButton");
  const confirmExitButton = document.getElementById("confirmExitButton");

  // Show confirmation modal when the close button is clicked
  closeButton.addEventListener("click", () => {
    modal.style.filter = "blur(5px)"; // Add blur to lesson modal
    modal.style.pointerEvents = "none"; // Disable interaction with lesson modal
    confirmationModal.style.display = "block"; // Show confirmation modal
  });

  // Handle "Cancel" button click
  cancelButton.addEventListener("click", () => {
    confirmationModal.style.display = "none"; // Close the confirmation modal
    modal.style.filter = ""; // Remove blur from lesson modal
    modal.style.pointerEvents = "auto"; // Re-enable interaction with lesson modal
  });

  // Handle "Exit" button click
  confirmExitButton.addEventListener("click", () => {
    confirmationModal.style.display = "none"; // Close the confirmation modal
    closeModal(); // Close the lesson modal
  });

  // Fetch lessons for the signed-in user
  const fetchUserLessons = async (userId) => {
    try {
      const response = await fetch(`/user-lessons/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user lessons");
      return await response.json();
    } catch (error) {
      console.error("Error fetching user lessons:", error);
      return [];
    }
  };

  // Initialize lessons rendering
  renderLessons();
  const initialize = async () => {
    try {
      const currentUser = await fetchCurrentUser();

      if (!currentUser) {
        console.error("No user is logged in or an error occurred.");
        // Optionally redirect to a login page or show an error message
        return;
      }

      console.log("Logged-in User:", currentUser);
      renderLessons(); // Render lessons for the logged-in user
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  };

  document.addEventListener("DOMContentLoaded", initialize);
  const fetchAndRenderLessons = async () => {
    const lessons = await fetchLessonsWithProgress();
    if (lessons.length) {
      renderLessons(lessons);
    } else {
      console.error("No lessons available to render.");
    }
  };
});
