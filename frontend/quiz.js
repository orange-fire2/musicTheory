/* =========================================================
   quiz.js — runs the practice session on demo.html

   1. Loads a set of questions from the backend
   2. Shows one question at a time
   3. Sends the chosen answer to the backend to be checked
   4. Shows correct / incorrect + the explanation

   Optional URL filters:  demo.html?level=1  ·  ?topic=Intervals  ·  ?type=multi
   ========================================================= */

const API_BASE = "http://localhost:3000/api";   // must match PORT in backend/.env
const SESSION_SIZE = 10;                        // questions per session
const TODAY_STORAGE_KEY = "musictheory:today";  // remembers today's question count


/* ---------- DOM ---------- */
const els = {
  eyebrow:  document.getElementById("quiz-eyebrow"),
  progress: document.getElementById("quiz-progress-value"),
  today:    document.getElementById("stat-today"),
  accuracy: document.getElementById("stat-accuracy"),
  counter:  document.getElementById("quiz-counter"),
  topic:    document.getElementById("quiz-topic"),
  question: document.getElementById("quiz-question"),
  options:  document.getElementById("quiz-options"),
  feedback: document.getElementById("quiz-feedback"),
  check:    document.getElementById("quiz-check"),
  next:     document.getElementById("quiz-next"),
};


/* ---------- State ---------- */
const state = {
  questions: [],
  index: 0,            // which question we're on
  answered: 0,
  correct: 0,
  locked: false,       // true while waiting for / after a result
  finished: false,
  selected: new Set(), // chosen option indexes (select-all questions)
};

const currentQuestion = () => state.questions[state.index];
const isLastQuestion = () => state.index === state.questions.length - 1;


/* ---------- API ---------- */
async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

function loadQuestions() {
  const page = new URLSearchParams(window.location.search);
  const query = new URLSearchParams({ limit: SESSION_SIZE, shuffle: "true" });

  for (const key of ["level", "topic", "type"]) {
    if (page.has(key)) query.set(key, page.get(key));
  }
  return fetchJson(`${API_BASE}/questions?${query}`);
}

function checkAnswer(questionId, answer) {
  return fetchJson(`${API_BASE}/questions/${questionId}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
}


/* ---------- "Today" counter (saved in the browser) ---------- */
function readToday() {
  try {
    const saved = JSON.parse(localStorage.getItem(TODAY_STORAGE_KEY));
    if (saved && saved.date === new Date().toDateString()) return saved.count;
  } catch { /* storage unavailable or corrupt — start from 0 */ }
  return 0;
}

function incrementToday() {
  const count = readToday() + 1;
  try {
    localStorage.setItem(
      TODAY_STORAGE_KEY,
      JSON.stringify({ date: new Date().toDateString(), count })
    );
  } catch { /* ignore */ }
  return count;
}


/* ---------- Rendering ---------- */
function updateStats() {
  const total = state.questions.length;
  els.progress.textContent = `${Math.round((state.answered / total) * 100)}%`;
  els.today.textContent = readToday();
  els.accuracy.textContent = state.answered
    ? `${Math.round((state.correct / state.answered) * 100)}%`
    : "—";
}

function createOption(text, index) {
  const button = document.createElement("button");
  button.className = "quiz-option";
  button.type = "button";
  button.dataset.index = index;

  const key = document.createElement("span");
  key.className = "quiz-option-key";
  key.textContent = `${String.fromCharCode(65 + index)}.`;   // 0 -> A, 1 -> B ...

  const label = document.createElement("span");
  label.className = "quiz-option-text";
  label.textContent = text;

  button.append(key, label);
  return button;
}

function showQuestion() {
  const q = currentQuestion();
  state.selected.clear();
  state.locked = false;

  els.counter.textContent = `Question ${state.index + 1} of ${state.questions.length}`;
  els.topic.textContent = q.topic;
  els.question.textContent = q.q;
  els.options.replaceChildren(...q.options.map(createOption));

  els.feedback.hidden = true;
  els.check.hidden = q.type !== "multi";
  els.check.disabled = true;
  els.next.disabled = true;
  els.next.textContent = isLastQuestion() ? "Finish →" : "Next question →";
}

function optionButtons() {
  return [...els.options.querySelectorAll(".quiz-option")];
}

function showResult(answer, result) {
  const picked = Array.isArray(answer) ? answer : [answer];
  const correctIndexes = [].concat(result.correctAnswer);

  optionButtons().forEach((button, i) => {
    button.classList.remove("is-selected");
    if (correctIndexes.includes(i)) button.classList.add("is-correct");
    else if (picked.includes(i)) button.classList.add("is-incorrect");
  });

  els.feedback.className = `quiz-feedback ${result.correct ? "is-correct" : "is-incorrect"}`;
  els.feedback.textContent = `${result.correct ? "✓ Correct" : "✗ Not quite"} — ${result.why}`;
  els.feedback.hidden = false;
}

function showSummary() {
  state.finished = true;
  els.counter.textContent = "Session complete";
  els.topic.textContent = "Done";
  els.question.textContent =
    `You got ${state.correct} of ${state.questions.length} correct.`;
  els.options.replaceChildren();
  els.feedback.hidden = true;
  els.check.hidden = true;
  els.next.disabled = false;
  els.next.textContent = "Practice again →";
}

function showFatal(message) {
  els.eyebrow.textContent = "Something went wrong";
  els.question.textContent = message;
  els.options.replaceChildren();
  els.check.hidden = true;
  els.next.hidden = true;
}


/* ---------- Actions ---------- */
async function submitAnswer(answer) {
  state.locked = true;
  optionButtons().forEach((b) => (b.disabled = true));
  els.check.disabled = true;

  try {
    const result = await checkAnswer(currentQuestion().id, answer);

    state.answered += 1;
    if (result.correct) state.correct += 1;
    incrementToday();

    showResult(answer, result);
    updateStats();
    els.next.disabled = false;
  } catch {
    // let the user try again
    state.locked = false;
    optionButtons().forEach((b) => (b.disabled = false));
    els.check.disabled = state.selected.size === 0;
    els.feedback.className = "quiz-feedback is-incorrect";
    els.feedback.textContent = "Couldn't check that answer. Is the backend running?";
    els.feedback.hidden = false;
  }
}

function toggleSelection(button, index) {
  if (state.selected.has(index)) state.selected.delete(index);
  else state.selected.add(index);

  button.classList.toggle("is-selected", state.selected.has(index));
  els.check.disabled = state.selected.size === 0;
}


/* ---------- Events ---------- */
els.options.addEventListener("click", (event) => {
  const button = event.target.closest(".quiz-option");
  if (!button || state.locked) return;

  const index = Number(button.dataset.index);
  if (currentQuestion().type === "multi") toggleSelection(button, index);
  else submitAnswer(index);
});

els.check.addEventListener("click", () => {
  if (!state.locked && state.selected.size) submitAnswer([...state.selected]);
});

els.next.addEventListener("click", () => {
  if (state.finished) return window.location.reload();   // new random session

  if (isLastQuestion()) showSummary();
  else {
    state.index += 1;
    showQuestion();
  }
});


/* ---------- Start ---------- */
async function init() {
  try {
    state.questions = await loadQuestions();
  } catch {
    return showFatal(`Couldn't reach the quiz server at ${API_BASE}. Is the backend running?`);
  }

  if (state.questions.length === 0) {
    return showFatal("No questions found for this selection.");
  }

  const topic = new URLSearchParams(window.location.search).get("topic");
  els.eyebrow.textContent = `${topic || "Mixed topics"} · ${state.questions.length} questions`;

  updateStats();
  showQuestion();
}

init();
