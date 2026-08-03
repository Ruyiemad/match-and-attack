/* =======================================================================
   Match & Attack — Question panel + countdown timer
   ======================================================================= */

window.MA = window.MA || {};

MA.quiz = (function () {
  const CIRC = 2 * Math.PI * 44; // circumference of the timer ring (r=44)
  let timerId = null;
  let remaining = 0;
  let total = 0;
  let answered = false;
  let onAnswerCb = null;

  const $ = (id) => document.getElementById(id);

  function showQuestion(q, opts) {
    answered = false;
    onAnswerCb = opts.onAnswer || null;

    $("question-hidden").hidden = true;
    $("question-live").hidden = false;
    $("question-text").textContent = q.q;

    const feedback = $("answer-feedback");
    feedback.textContent = "";
    feedback.className = "answer-feedback";

    const ans = $("answers");
    ans.innerHTML = "";
    q.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "answer";
      b.textContent = opt;
      b.dataset.i = i;
      if (opts.disabled) {
        b.disabled = true;
      } else {
        b.addEventListener("click", () => pick(i, q));
      }
      ans.appendChild(b);
    });
  }

  function pick(i, q) {
    if (answered) return;
    answered = true;
    stopTimer();
    revealAnswer(q, i);
    const correct = i === q.answerIndex;
    if (onAnswerCb) onAnswerCb(correct, i);
  }

  function revealAnswer(q, chosen) {
    document.querySelectorAll("#answers .answer").forEach((b) => {
      const i = Number(b.dataset.i);
      b.disabled = true;
      if (i === q.answerIndex) b.classList.add("correct");
      else if (i === chosen) b.classList.add("wrong");
    });
  }

  function startTimer(seconds, onEnd) {
    stopTimer();
    total = seconds;
    remaining = seconds;
    const t = $("timer");
    t.dataset.state = "run";
    update();
    timerId = setInterval(() => {
      remaining--;
      if (remaining <= 10 && remaining > 0) {
        t.dataset.state = "warn";
        MA.audio.play("tick");
      }
      update();
      if (remaining <= 0) {
        stopTimer();
        t.dataset.state = "idle";
        if (onEnd) onEnd();
      }
    }, 1000);
  }

  function update() {
    $("timer-text").textContent = Math.max(0, remaining);
    const frac = total > 0 ? remaining / total : 0;
    $("timer-arc").style.strokeDashoffset = String(CIRC * (1 - frac));
  }

  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function resetTimerDisplay() {
    stopTimer();
    const t = $("timer");
    t.dataset.state = "idle";
    $("timer-text").textContent = "–";
    $("timer-arc").style.strokeDashoffset = "0";
  }

  function hideQuestion() {
    $("question-live").hidden = true;
    $("question-hidden").hidden = false;
    const feedback = $("answer-feedback");
    if (feedback) { feedback.textContent = ""; feedback.className = "answer-feedback"; }
  }

  // Reveal the correct answer without any interaction (used for the "skip" effect)
  function forceReveal(q) { revealAnswer(q, -1); }

  return { showQuestion, startTimer, stopTimer, resetTimerDisplay, hideQuestion, forceReveal };
})();
