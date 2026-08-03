/* =======================================================================
   Match & Attack — App bootstrap (screens, setup, wiring)
   ======================================================================= */

window.MA = window.MA || {};
MA.ui = MA.ui || {};

document.addEventListener("DOMContentLoaded", () => {
  applyStaticText();
  initState();
  buildTeamInputs();
  wireEvents();
  updateSoundButton();
  MA.ui.showScreen("welcome");
});

/* ------------------------------- state -------------------------------- */
function initState() {
  MA.state = {
    screen: "welcome",
    teams: CONFIG.teamColors.map((c) => ({ name: c.name, color: c.hex, colorName: c.name, score: 0, attacksMade: 0 })),
    order: CONFIG.teamColors.map((_, i) => i),
    questions: (window.QUESTIONS || []).slice(),
    turnPointer: 0,
    questionIndex: 0,
    currentTeamIndex: 0,
    answeringTeamIndex: 0,
    attackerIndex: null,
    activeAttackCard: null,
    activeAttackCardIdx: null,
    pendingEffect: null,
    phase: "idle"
  };
}

/* ------------------------------- screens ------------------------------ */
MA.ui.showScreen = function (name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("is-active"));
  const el = document.getElementById("screen-" + name);
  if (el) el.classList.add("is-active");
  if (MA.state) MA.state.screen = name;
  window.scrollTo(0, 0);
};

/* --------------------------- static text ------------------------------ */
function applyStaticText() {
  document.querySelectorAll("[data-txt]").forEach((el) => {
    const k = el.getAttribute("data-txt");
    if (TXT[k] != null) el.textContent = TXT[k];
  });
  const L = CONFIG.labels;
  setText("btn-start-game", L.startGame);
  setText("btn-continue", L.continue);
  setText("btn-start-playing", L.startPlaying);
  setText("btn-start-question", L.start);
  setText("btn-next", L.next);
  setText("btn-play-again", L.playAgain);
  setText("btn-skip-attack", L.skipAttack);
  setText("btn-end-game", L.endGame);
  document.title = CONFIG.title;
}

/* --------------------------- team setup ------------------------------- */
function buildTeamInputs() {
  const wrap = document.getElementById("team-inputs");
  wrap.innerHTML = "";
  CONFIG.teamColors.forEach((c, i) => {
    const field = document.createElement("label");
    field.className = "team-field";
    field.style.borderInlineStartColor = c.hex;
    field.innerHTML =
      `<span class="team-chip" style="background:${c.hex}"></span>` +
      `<input type="text" maxlength="18" placeholder="${escapeHtml(TXT.setupPlaceholder)}" value="${escapeHtml(c.name)}" data-team="${i}" />`;
    wrap.appendChild(field);
  });
}

function onContinue() {
  const inputs = Array.prototype.slice.call(document.querySelectorAll("#team-inputs input"));
  const names = inputs.map((i) => i.value.trim());
  const unique = new Set(names.map((n) => n.toLowerCase())).size === names.length;
  const valid = names.every((n) => n.length > 0) && unique;

  const err = document.getElementById("setup-error");
  if (!valid) { err.hidden = false; return; }
  err.hidden = true;

  MA.state.teams.forEach((t, i) => { t.name = names[i]; });
  MA.audio.play("click");
  MA.ui.showScreen("randomizer");
  runRandomizer();
}

/* --------------------------- randomizer ------------------------------- */
async function runRandomizer() {
  const s = MA.state;
  const btn = document.getElementById("btn-start-playing");
  const list = document.getElementById("order-result");
  const status = document.getElementById("randomizer-status");

  btn.hidden = true;
  list.innerHTML = "";
  status.textContent = TXT.randomizerSpinning;

  MA.wheel.render(s.teams);
  await MA.wheel.spin();

  s.order = MA.util.shuffle(s.teams.map((_, i) => i));
  status.textContent = TXT.randomizerDone;

  for (let r = 0; r < s.order.length; r++) {
    const ti = s.order[r];
    const li = document.createElement("li");
    li.style.setProperty("--team-color", s.teams[ti].color);
    li.style.animationDelay = r * 0.12 + "s";
    li.innerHTML = `<span class="rank">${r + 1}</span><span>${escapeHtml(s.teams[ti].name)}</span>`;
    list.appendChild(li);
    MA.audio.play("flip");
    await MA.util.sleep(420);
  }
  btn.hidden = false;
}

/* ---------------------------- confetti -------------------------------- */
MA.ui.confetti = function () {
  const c = document.getElementById("confetti");
  if (!c) return;
  c.innerHTML = "";
  const colors = MA.state.teams.map((t) => t.color);
  for (let i = 0; i < 80; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
    p.style.animationDelay = Math.random() * 0.6 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    c.appendChild(p);
  }
  setTimeout(() => { c.innerHTML = ""; }, 6000);
};

/* ------------------------------ wiring -------------------------------- */
function wireEvents() {
  on("btn-start-game", () => { MA.audio.play("click"); MA.ui.showScreen("setup"); });
  on("btn-continue", onContinue);
  on("btn-start-playing", () => { MA.audio.play("click"); MA.ui.showScreen("board"); MA.engine.startGame(); });
  on("btn-start-question", () => { MA.audio.play("click"); MA.engine.beginQuestion(); });
  on("btn-next", () => { MA.audio.play("click"); MA.engine.nextTurn(); });
  on("btn-skip-attack", () => { MA.audio.play("click"); MA.engine.skipAttack(); });
  on("btn-end-game", () => { MA.audio.play("click"); MA.engine.endGame(); });
  on("btn-play-again", () => { MA.audio.play("click"); resetGame(); });
  on("btn-sound", toggleSound);

  // Enter key on the last setup field submits
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && MA.state && MA.state.screen === "setup") onContinue();
  });
}

function resetGame() {
  initState();
  buildTeamInputs();
  const c = document.getElementById("confetti");
  if (c) c.innerHTML = "";
  MA.ui.showScreen("setup");
}

function toggleSound() {
  MA.audio.toggle();
  updateSoundButton();
}
function updateSoundButton() {
  const b = document.getElementById("btn-sound");
  if (!b) return;
  const on = MA.audio.isEnabled();
  b.textContent = on ? "🔊" : "🔇";
  b.classList.toggle("is-muted", !on);
}

/* ------------------------------ helpers ------------------------------- */
function on(id, fn) { const el = document.getElementById(id); if (el) el.addEventListener("click", fn); }
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
}
