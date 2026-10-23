/**
 * Life Dashboard — app.js
 * Vanilla JavaScript, no frameworks.
 * Features:
 *  - Live clock & greeting (time-aware)
 *  - Custom name (LocalStorage)
 *  - Focus Timer with custom duration & SVG progress ring
 *  - To-Do List (add / edit / complete / delete, prevent duplicates, sort)
 *  - Quick Links (add with optional custom icon / delete, LocalStorage, vertical scroll)
 *  - Light / Dark mode toggle switch (LocalStorage)
 */

"use strict";

/* ============================================================
   SECTION 1 — UTILITIES
   ============================================================ */

function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("LocalStorage write failed:", e);
  }
}

function sanitise(str) {
  return String(str).trim();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ============================================================
   SECTION 2 — THEME (LIGHT / DARK TOGGLE SWITCH)
   ============================================================ */

const themeToggle = document.getElementById("themeToggle");

function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("light", !isDark);
  themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
}

function initTheme() {
  const saved = lsGet("dashboard_theme", "dark");
  applyTheme(saved === "dark");
}

themeToggle.addEventListener("click", () => {
  const isDark = !document.documentElement.classList.contains("dark");
  applyTheme(isDark);
  lsSet("dashboard_theme", isDark ? "dark" : "light");
});

initTheme();

/* ============================================================
   SECTION 3 — CLOCK, DATE, AND GREETING
   ============================================================ */

const clockEl     = document.getElementById("clock");
const dateEl      = document.getElementById("dateDisplay");
const greetingEl  = document.getElementById("greeting");

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getGreetingText(hour) {
  if (hour >= 5  && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 21) return "Good evening";
  return "Good night";
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  clockEl.textContent  = `${h}:${m}:${s}`;
  dateEl.textContent   = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const name  = lsGet("dashboard_name", "");
  const greet = getGreetingText(now.getHours());
  greetingEl.textContent = name ? `${greet}, ${name}! 👋` : `${greet}! 👋`;
}

updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   SECTION 4 — CUSTOM NAME
   ============================================================ */

const editNameBtn = document.getElementById("editNameBtn");
const nameForm    = document.getElementById("nameForm");
const nameInput   = document.getElementById("nameInput");
const saveNameBtn = document.getElementById("saveNameBtn");

nameInput.value = lsGet("dashboard_name", "");

editNameBtn.addEventListener("click", () => {
  nameForm.classList.toggle("hidden");
  if (!nameForm.classList.contains("hidden")) nameInput.focus();
});

saveNameBtn.addEventListener("click", () => {
  lsSet("dashboard_name", sanitise(nameInput.value));
  nameForm.classList.add("hidden");
  updateClock();
});

nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter")  saveNameBtn.click();
  if (e.key === "Escape") nameForm.classList.add("hidden");
});

/* ============================================================
   SECTION 5 — FOCUS TIMER
   ============================================================ */

const timerDisplay      = document.getElementById("timerDisplay");
const timerStatus       = document.getElementById("timerStatus");
const timerProgress     = document.getElementById("timerProgress");
const startBtn          = document.getElementById("startBtn");
const stopBtn           = document.getElementById("stopBtn");
const resetBtn          = document.getElementById("resetBtn");
const timerDurationInput = document.getElementById("timerDurationInput");
const timerNotification = document.getElementById("timerNotification");
const closeNotification = document.getElementById("closeNotification");

const CIRCUMFERENCE = 276.46; // 2π × 44

let timerInterval   = null;
let timerRunning    = false;
let totalSeconds    = 25 * 60;
let remainingSeconds = totalSeconds;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function updateTimerUI() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const progress = remainingSeconds / totalSeconds;
  timerProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function setTimerStatus(text, extraClass = "") {
  timerStatus.textContent = text;
  timerStatus.className = `text-xs mb-4 ${extraClass || "text-gray-500"}`;
}

function timerDone() {
  clearInterval(timerInterval);
  timerInterval  = null;
  timerRunning   = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  setTimerStatus("Session complete! ✓", "text-green-400");
  timerNotification.classList.remove("hidden");
  playBeep();
}

function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
  } catch (_) { /* fail silently */ }
}

startBtn.addEventListener("click", () => {
  if (timerRunning) return;
  if (remainingSeconds === totalSeconds) {
    const mins = parseInt(timerDurationInput.value, 10);
    if (!isNaN(mins) && mins >= 1 && mins <= 120) {
      totalSeconds     = mins * 60;
      remainingSeconds = totalSeconds;
    }
  }
  timerRunning      = true;
  startBtn.disabled = true;
  stopBtn.disabled  = false;
  setTimerStatus("Focusing... 🎯", "text-purple-400");
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerUI();
    if (remainingSeconds <= 0) { remainingSeconds = 0; updateTimerUI(); timerDone(); }
  }, 1000);
});

stopBtn.addEventListener("click", () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval     = null;
  timerRunning      = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  setTimerStatus("Paused ⏸", "text-orange-400");
});

resetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  timerInterval     = null;
  timerRunning      = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  const mins = parseInt(timerDurationInput.value, 10);
  totalSeconds      = (!isNaN(mins) && mins >= 1 && mins <= 120) ? mins * 60 : 25 * 60;
  remainingSeconds  = totalSeconds;
  updateTimerUI();
  setTimerStatus("Ready");
  timerNotification.classList.add("hidden");
});

timerDurationInput.addEventListener("change", () => {
  if (!timerRunning) {
    const mins = parseInt(timerDurationInput.value, 10);
    if (!isNaN(mins) && mins >= 1 && mins <= 120) {
      totalSeconds = mins * 60;
      remainingSeconds = totalSeconds;
      updateTimerUI();
    }
  }
});

closeNotification.addEventListener("click", () => timerNotification.classList.add("hidden"));

updateTimerUI();

/* ============================================================
   SECTION 6 — TO-DO LIST
   ============================================================ */

const taskInput   = document.getElementById("taskInput");
const addTaskBtn  = document.getElementById("addTaskBtn");
const taskList    = document.getElementById("taskList");
const emptyState  = document.getElementById("emptyState");
const dupWarning  = document.getElementById("dupWarning");
const taskCountEl = document.getElementById("taskCount");
const sortBtns    = document.querySelectorAll(".sort-btn");

let tasks       = lsGet("dashboard_tasks", []);
let currentSort = "default";
let editingTaskId = null;

function saveTasks() { lsSet("dashboard_tasks", tasks); }

function isDuplicate(text, excludeId = null) {
  const lower = text.toLowerCase();
  return tasks.some((t) => t.text.toLowerCase() === lower && t.id !== excludeId);
}

function getSortedTasks() {
  const copy = [...tasks];
  if (currentSort === "az")   copy.sort((a, b) => a.text.localeCompare(b.text));
  if (currentSort === "done") copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy;
}

function renderTasks() {
  taskList.innerHTML = "";
  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    emptyState.classList.remove("hidden");
    taskCountEl.textContent = "";
    return;
  }

  emptyState.classList.add("hidden");
  const done = tasks.filter((t) => t.done).length;
  taskCountEl.textContent = `${done}/${tasks.length} done`;

  sorted.forEach((task) => {
    const li = document.createElement("li");
    li.className = `task-item flex items-center gap-3 px-4 py-3 rounded-xl group${task.done ? " task-done" : ""}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <button
        class="task-check flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
          task.done
            ? "task-check-done border-transparent"
            : "border-gray-500 hover:border-purple-400"
        }"
        aria-label="Toggle complete"
      >
        ${task.done ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>` : ""}
      </button>
      <span class="task-text flex-1 text-sm break-words">${escapeHTML(task.text)}</span>
      <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          class="task-edit p-1.5 rounded-lg transition-all hover:bg-blue-500/15 text-gray-500 hover:text-blue-400"
          aria-label="Edit task" title="Edit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828 9 16l.172-2.828z"/>
          </svg>
        </button>
        <button
          class="task-delete p-1.5 rounded-lg transition-all hover:bg-red-500/15 text-gray-500 hover:text-red-400"
          aria-label="Delete task" title="Delete"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

/* --- Add Task --- */
function addTask() {
  const text = sanitise(taskInput.value);
  if (!text) return;
  if (isDuplicate(text)) { showWarn(dupWarning); taskInput.focus(); return; }
  hideWarn(dupWarning);
  tasks.push({ id: uid(), text, done: false });
  saveTasks();
  renderTasks();
  taskInput.value = "";
  taskInput.focus();
}

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); else hideWarn(dupWarning); });
taskInput.addEventListener("input", () => hideWarn(dupWarning));

/* --- Task list click delegation --- */
taskList.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-id]");
  if (!li) return;
  const id = li.dataset.id;
  if (e.target.closest(".task-check"))  toggleTask(id);
  if (e.target.closest(".task-edit"))   openEditModal(id);
  if (e.target.closest(".task-delete")) deleteTask(id);
});

function toggleTask(id) {
  const t = tasks.find((t) => t.id === id);
  if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
}
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

/* --- Sort --- */
sortBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    sortBtns.forEach((b) => b.classList.remove("active-sort"));
    btn.classList.add("active-sort");
    currentSort = btn.dataset.sort;
    renderTasks();
  });
});

/* --- Warning helpers --- */
let warnTimers = {};
function showWarn(el) {
  el.classList.remove("hidden");
  clearTimeout(warnTimers[el.id]);
  warnTimers[el.id] = setTimeout(() => hideWarn(el), 3000);
}
function hideWarn(el) { el.classList.add("hidden"); }

/* ============================================================
   SECTION 7 — EDIT TASK MODAL
   ============================================================ */

const editModal      = document.getElementById("editModal");
const editTaskInput  = document.getElementById("editTaskInput");
const saveEditBtn    = document.getElementById("saveEditBtn");
const cancelEditBtn  = document.getElementById("cancelEditBtn");
const editDupWarning = document.getElementById("editDupWarning");

function openEditModal(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  editingTaskId = id;
  editTaskInput.value = task.text;
  hideWarn(editDupWarning);
  editModal.classList.remove("hidden");
  editTaskInput.focus();
  editTaskInput.select();
}
function closeEditModal() {
  editModal.classList.add("hidden");
  editingTaskId = null;
}

saveEditBtn.addEventListener("click", () => {
  const newText = sanitise(editTaskInput.value);
  if (!newText) return;
  if (isDuplicate(newText, editingTaskId)) { showWarn(editDupWarning); return; }
  const task = tasks.find((t) => t.id === editingTaskId);
  if (task) { task.text = newText; saveTasks(); renderTasks(); }
  closeEditModal();
});

cancelEditBtn.addEventListener("click", closeEditModal);
editTaskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter")  saveEditBtn.click();
  if (e.key === "Escape") closeEditModal();
});
editModal.addEventListener("click", (e) => { if (e.target === editModal) closeEditModal(); });

/* ============================================================
   SECTION 8 — QUICK LINKS
   ============================================================ */

const linkNameInput  = document.getElementById("linkNameInput");
const linkUrlInput   = document.getElementById("linkUrlInput");
const linkIconInput  = document.getElementById("linkIconInput");
const iconBoxDefault = document.getElementById("iconBoxDefault");
const iconPreviewImg = document.getElementById("iconPreview");
const clearIconBtn   = document.getElementById("clearIconBtn");
const addLinkBtn     = document.getElementById("addLinkBtn");
const linksList      = document.getElementById("linksList");
const linksEmpty     = document.getElementById("linksEmpty");

let links           = lsGet("dashboard_links", []);
let pendingIconData = null; // base64 data URL of selected icon

/* ---- Icon uploader ---- */
linkIconInput.addEventListener("change", () => {
  const file = linkIconInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingIconData = e.target.result;
    // Show preview image, hide camera-icon placeholder
    iconPreviewImg.src = pendingIconData;
    iconPreviewImg.classList.remove("hidden");
    iconBoxDefault.classList.add("hidden");
    clearIconBtn.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

clearIconBtn.addEventListener("click", () => {
  pendingIconData = null;
  linkIconInput.value = "";
  iconPreviewImg.classList.add("hidden");
  iconBoxDefault.classList.remove("hidden");
  clearIconBtn.classList.add("hidden");
});

/* ---- Brand SVG icons for well-known sites ---- */
const BRAND_SVG = {
  "google.com": `<svg viewBox="0 0 24 24" class="brand-icon" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>`,

  "youtube.com": `<svg viewBox="0 0 24 24" class="brand-icon" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
  </svg>`,

  "github.com": `<svg viewBox="0 0 24 24" class="brand-icon" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#181717"/>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="url(#ghGrad)"/>
    <defs>
      <linearGradient id="ghGrad" x1="0" y1="0" x2="24" y2="24">
        <stop offset="0%" stop-color="#c4b5fd" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#93c5fd" stop-opacity="0.4"/>
      </linearGradient>
    </defs>
  </svg>`,

  "linkedin.com": `<svg viewBox="0 0 24 24" class="brand-icon" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2"/>
    <path d="M6.94 5a2 2 0 11-4-.002A2 2 0 016.94 5zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" fill="white"/>
  </svg>`,
};

/** Get the brand icon SVG string or null if unknown. */
function getBrandIcon(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    return BRAND_SVG[host] || null;
  } catch { return null; }
}

/** Fallback emoji for unrecognised sites. */
function getFallbackEmoji(url) {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    const map = {
      "twitter.com": "𝕏", "x.com": "𝕏",
      "reddit.com": "📣", "notion.so": "📝",
      "figma.com": "🎨", "spotify.com": "🎵",
      "netflix.com": "🎬", "amazon.com": "🛒",
      "wikipedia.org": "📖", "stackoverflow.com": "💬",
    };
    return map[host] || "🌐";
  } catch { return "🌐"; }
}

/* ---- Default links — first-run only, plus migrations for returning users ---- */
function initDefaultLinks() {
  if (links.length === 0) {
    // Brand-new user: set all five defaults in correct order
    links = [
      { id: uid(), name: "Google",   url: "https://google.com",                        icon: null },
      { id: uid(), name: "YouTube",  url: "https://youtube.com",                       icon: null },
      { id: uid(), name: "GitHub",   url: "https://github.com",                        icon: null },
      { id: uid(), name: "LinkedIn", url: "https://linkedin.com/in/rusyda-mulayyana",  icon: null },
    ];
    lsSet("dashboard_links", links);
  } else {
    let changed = false;

    // Migration 1: ensure LinkedIn is present
    const hasLinkedIn = links.some((l) => l.url.includes("linkedin.com/in/rusyda-mulayyana"));
    if (!hasLinkedIn) {
      links.push({ id: uid(), name: "LinkedIn", url: "https://linkedin.com/in/rusyda-mulayyana", icon: null });
      changed = true;
    }

    // Migration 2: ensure Google is present and sits before YouTube
    const googleIdx  = links.findIndex((l) => new URL(l.url).hostname.replace("www.", "") === "google.com");
    const youtubeIdx = links.findIndex((l) => new URL(l.url).hostname.replace("www.", "") === "youtube.com");

    if (googleIdx === -1) {
      // Google is missing entirely — insert it before YouTube (or at position 0)
      const insertAt = youtubeIdx > -1 ? youtubeIdx : 0;
      links.splice(insertAt, 0, { id: uid(), name: "Google", url: "https://google.com", icon: null });
      changed = true;
    } else if (youtubeIdx > -1 && googleIdx > youtubeIdx) {
      // Google exists but is after YouTube — move it to just before YouTube
      const [googleEntry] = links.splice(googleIdx, 1);
      // recalculate YouTube position after splice
      const newYoutubeIdx = links.findIndex((l) => new URL(l.url).hostname.replace("www.", "") === "youtube.com");
      links.splice(newYoutubeIdx, 0, googleEntry);
      changed = true;
    }

    if (changed) lsSet("dashboard_links", links);
  }
}

function saveLinks() { lsSet("dashboard_links", links); }

/* ---- Render: vertical list rows ---- */
function renderLinks() {
  linksList.innerHTML = "";
  if (links.length === 0) {
    linksEmpty.classList.remove("hidden");
    return;
  }
  linksEmpty.classList.add("hidden");

  links.forEach((link) => {
    const div = document.createElement("div");
    div.className = "link-row-item flex items-center gap-3 px-3 py-2.5 rounded-xl group relative";
    div.dataset.id = link.id;

    /* Icon — priority: custom uploaded > brand SVG > fallback emoji */
    let iconHTML;
    if (link.icon) {
      // User uploaded a custom image (stored as base64 data URL)
      iconHTML = `<img src="${escapeAttr(link.icon)}" alt="${escapeHTML(link.name)} icon" class="w-6 h-6 rounded-md object-cover flex-shrink-0" />`;
    } else {
      const brand = getBrandIcon(link.url);
      if (brand) {
        iconHTML = `<span class="flex-shrink-0">${brand}</span>`;
      } else {
        iconHTML = `<span class="text-xl flex-shrink-0 leading-none">${getFallbackEmoji(link.url)}</span>`;
      }
    }

    div.innerHTML = `
      <a
        href="${escapeAttr(link.url)}"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-3 flex-1 min-w-0"
        title="${escapeHTML(link.url)}"
      >
        ${iconHTML}
        <span class="link-name-text text-sm font-medium truncate">${escapeHTML(link.name)}</span>
      </a>

      <!-- Action buttons on the right -->
      <div class="flex items-center gap-1 flex-shrink-0 ml-1">
        <!-- Open-link icon: always visible, moves left beside delete on hover -->
        <a
          href="${escapeAttr(link.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="link-open-btn w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-400 hover:bg-blue-500/15 transition-all"
          aria-label="Open link"
          title="Open ${escapeHTML(link.name)}"
          tabindex="-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
        <!-- Delete icon: hidden until hover -->
        <button
          class="link-delete w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all"
          data-id="${link.id}"
          aria-label="Delete link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;
    linksList.appendChild(div);
  });
}

/* ---- Add link ---- */
function addLink() {
  const name = sanitise(linkNameInput.value);
  let url    = sanitise(linkUrlInput.value);
  if (!name || !url) return;

  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  try { new URL(url); } catch {
    linkUrlInput.style.outline = "2px solid rgba(239,68,68,0.6)";
    setTimeout(() => (linkUrlInput.style.outline = ""), 2000);
    return;
  }

  links.push({ id: uid(), name, url, icon: pendingIconData || null });
  saveLinks();
  renderLinks();

  // Reset form
  linkNameInput.value = "";
  linkUrlInput.value  = "";
  pendingIconData     = null;
  linkIconInput.value = "";
  iconPreviewImg.classList.add("hidden");
  iconBoxDefault.classList.remove("hidden");
  clearIconBtn.classList.add("hidden");
  linkNameInput.focus();
}

addLinkBtn.addEventListener("click", addLink);
linkUrlInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addLink(); });

/* ---- Delete link (delegated) ---- */
linksList.addEventListener("click", (e) => {
  const btn = e.target.closest(".link-delete");
  if (!btn) return;
  const id = btn.dataset.id;
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
});

/* ============================================================
   SECTION 9 — INITIALISE
   ============================================================ */

initDefaultLinks();
renderLinks();
renderTasks();
