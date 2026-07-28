const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("title-input");
const descriptionInput = document.getElementById("description-input");
const filterInput = document.getElementById("filter-input");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");

const modal = document.getElementById("task-modal");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalTimeline = document.getElementById("modal-timeline");
const modalTimelineEmpty = document.getElementById("modal-timeline-empty");
const modalClose = document.getElementById("modal-close");
const updateForm = document.getElementById("update-form");
const updateInput = document.getElementById("update-input");

let tasks = [];
let currentTaskId = null;

async function fetchTasks() {
  const response = await fetch(`${API_URL}/tasks`);
  tasks = await response.json();
  renderTasks(filterInput.value);
}

async function createTask(title, description) {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      alert("Error del servidor: " + (err.error || response.status));
      return;
    }
    await fetchTasks();
  } catch (error) {
    alert("No se pudo conectar con el servidor (" + API_URL + "). Detalle: " + error.message);
  }
}

async function toggleTask(id, completed) {
  await fetch(`${API_URL}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  await fetchTasks();
}

async function deleteTask(id) {
  await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
  await fetchTasks();
}

function renderTasks(filterText = "") {
  const normalizedFilter = filterText.trim().toLowerCase();
  const filtered = tasks.filter((task) => {
    const haystack = `${task.title} ${task.description || ""}`.toLowerCase();
    return haystack.includes(normalizedFilter);
  });

  taskList.innerHTML = "";
  emptyMessage.hidden = filtered.length > 0;

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));

    const textWrapper = document.createElement("div");
    textWrapper.className = "task-text";
    const titleEl = document.createElement("strong");
    titleEl.textContent = task.title;
    const descEl = document.createElement("p");
    descEl.textContent = task.description || "";
    textWrapper.append(titleEl, descEl);
    textWrapper.addEventListener("click", () => openTaskModal(task));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, textWrapper, deleteBtn);
    taskList.appendChild(li);
  });
}

async function openTaskModal(task) {
  currentTaskId = task.id;
  modalTitle.textContent = task.title;
  modalDescription.textContent = task.description || "";
  modal.hidden = false;
  await loadTimeline(task.id);
}

function closeTaskModal() {
  modal.hidden = true;
  currentTaskId = null;
  updateInput.value = "";
}

async function loadTimeline(taskId) {
  modalTimeline.innerHTML = "";
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}/updates`);
    const items = await response.json();
    modalTimelineEmpty.hidden = items.length > 0;
    items.forEach((item) => {
      const li = document.createElement("li");
      const note = document.createElement("span");
      note.className = "timeline-note";
      note.textContent = item.note;
      const date = document.createElement("span");
      date.className = "timeline-date";
      date.textContent = new Date(item.created_at).toLocaleString();
      li.append(note, date);
      modalTimeline.appendChild(li);
    });
  } catch (error) {
    alert("No se pudo cargar la línea de tiempo. Detalle: " + error.message);
  }
}

updateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const note = updateInput.value.trim();
  if (!note || currentTaskId === null) return;
  try {
    const response = await fetch(`${API_URL}/tasks/${currentTaskId}/updates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      alert("Error del servidor: " + (err.error || response.status));
      return;
    }
    updateInput.value = "";
    await loadTimeline(currentTaskId);
  } catch (error) {
    alert("No se pudo guardar el avance. Detalle: " + error.message);
  }
});

modalClose.addEventListener("click", closeTaskModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeTaskModal();
});

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  await createTask(title, descriptionInput.value.trim());
  titleInput.value = "";
  descriptionInput.value = "";
});

filterInput.addEventListener("input", () => renderTasks(filterInput.value));

fetchTasks();
