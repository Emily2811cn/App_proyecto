const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("title-input");
const descriptionInput = document.getElementById("description-input");
const filterInput = document.getElementById("filter-input");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");

let tasks = [];

async function fetchTasks() {
  const response = await fetch(`${API_URL}/tasks`);
  tasks = await response.json();
  renderTasks(filterInput.value);
}

async function createTask(title, description) {
  await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description }),
  });
  await fetchTasks();
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

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "delete-btn";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    li.append(checkbox, textWrapper, deleteBtn);
    taskList.appendChild(li);
  });
}

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
