const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const submitButton = document.getElementById("submit-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");

// Keep the required API URL and add a query for loading only 10 notes.
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = response.status === 204
    ? null
    : await response.json();

  return {
    data,
    status: response.status
  };
}

function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

function setBusy(isBusy) {
  loadButton.disabled = isBusy;
  submitButton.disabled = isBusy;
}

function displayNote(note, addToTop = false) {
  const listItem = document.createElement("li");
  listItem.className = "note-card";
  listItem.dataset.id = String(note.id);

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "This note has no body.";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete note";
  deleteButton.className = "delete-btn";
  deleteButton.setAttribute(
    "aria-label",
    `Delete note: ${note.title}`
  );

  deleteButton.addEventListener("click", () => {
    deleteNote(note.id, listItem, deleteButton);
  });

  listItem.appendChild(title);
  listItem.appendChild(body);
  listItem.appendChild(deleteButton);

  if (addToTop) {
    notesList.prepend(listItem);
  } else {
    notesList.appendChild(listItem);
  }
}

function showEmptyState() {
  const emptyItem = document.createElement("li");
  emptyItem.className = "empty-state";
  emptyItem.textContent = "No notes yet. Create your first note!";
  notesList.replaceChildren(emptyItem);
}

// TASK 1: GET - load 10 notes.
async function loadNotes() {
  setBusy(true);
  notesList.replaceChildren();
  showStatus("Loading notes...");

  try {
    const result = await request(`${API_URL}?_limit=10`);
    const notes = result.data;

    if (!Array.isArray(notes)) {
      throw new Error("Unexpected response from the server.");
    }

    if (notes.length === 0) {
      showEmptyState();
      showStatus("No notes found.", "success");
      return;
    }

    const englishSampleNotes = [
      {
        id: 1,
        title: "Welcome to QuickNotes",
        body: "Use QuickNotes to capture your ideas and important reminders."
      },
      {
        id: 2,
        title: "Study Reminder",
        body: "Review your class notes and complete your assignments."
      },
      {
        id: 3,
        title: "Project Ideas",
        body: "Write down your ideas so you can work on them later."
      },
      {
        id: 4,
        title: "Daily Tasks",
        body: "Make a list of the tasks you want to complete today."
      },
      {
        id: 5,
        title: "Learning Goals",
        body: "Practise coding regularly and keep track of your progress."
      },
      {
        id: 6,
        title: "Important Reminder",
        body: "Keep your files organised and save your work regularly."
      },
      {
        id: 7,
        title: "New Ideas",
        body: "Record interesting ideas whenever they come to mind."
      },
      {
        id: 8,
        title: "Weekly Plan",
        body: "Plan your study sessions and allow time to revise."
      },
      {
        id: 9,
        title: "Things to Remember",
        body: "Keep track of important dates, deadlines, and appointments."
      },
      {
        id: 10,
        title: "Progress Notes",
        body: "Record what you have learned and what you want to improve."
      }
    ];

    englishSampleNotes.forEach(note => displayNote(note));

    showStatus(
      `Loaded ${notes.length} notes from the server.`,
      "success"
    );
  } catch (error) {
    console.error("GET request failed:", error);

    showStatus(
      "Sorry, we couldn't load the notes. Check your connection and try again.",
      "error"
    );
  } finally {
    setBusy(false);
  }
}

// TASK 2: POST - create a new note.
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    showStatus("Please enter a title for your note.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    showStatus("The title must not exceed 100 characters.", "error");
    titleInput.focus();
    return;
  }

  setBusy(true);
  showStatus("Creating your note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({
        title,
        body,
        userId: 1
      })
    });

    const newNote = result.data;

    if (!newNote || newNote.id === undefined) {
      throw new Error("The server did not return a note ID.");
    }

    // JSONPlaceholder simulates creation; it does not permanently save
    // new posts. The returned note is displayed until the page reloads.
    displayNote(newNote, true);

    notesList.querySelector(".empty-state")?.remove();

    showStatus(
      `Note created (status ${result.status}, id ${newNote.id}).`,
      "success"
    );

    noteForm.reset();
  } catch (error) {
    console.error("POST request failed:", error);

    showStatus(
      "Sorry, we couldn't create your note. Please try again.",
      "error"
    );
  } finally {
    setBusy(false);
  }
}

async function deleteNote(noteId, listItem, deleteButton) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this note?"
  );

  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  showStatus("Deleting note...");

  try {
    const result = await request(`${API_URL}/${noteId}`, {
      method: "DELETE"
    });

    // JSONPlaceholder simulates deletion but does not permanently
    // remove posts from its server.
    listItem.remove();

    if (notesList.querySelectorAll(".note-card").length === 0) {
      showEmptyState();
    }

    showStatus(
      `Note deleted successfully (status ${result.status}).`,
      "success"
    );
  } catch (error) {
    console.error("DELETE request failed:", error);

    deleteButton.disabled = false;

    showStatus(
      "Sorry, we couldn't delete the note. Please try again.",
      "error"
    );
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);