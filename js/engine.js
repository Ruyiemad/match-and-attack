/* =======================================================================
   Match & Attack — Game engine (turn loop, rules, scoring)
   -----------------------------------------------------------------------
   Phases per turn:
     attack-await-flip -> (attacker flips one card)
        defend card  -> fizzle -> question-ready
        attack card  -> defense-await-flip -> (current team flips one card)
             correct match -> block, pair locked      -> question-ready
             wrong match   -> attack lands, apply effect -> question-ready
     question-ready -> (controller clicks Start) -> question-live
     question-live  -> answer / timeout                 -> answered
     answered       -> (controller clicks Next)         -> next turn
   ======================================================================= */

window.MA = window.MA || {};

MA.engine = (function () {
  const S = () => MA.state;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  }
  const teamName = (i) => S().teams[i].name;

  // Every phase change repaints the role circles in the question box.
  function setPhase(p) { S().phase = p; renderRoles(); }

  /* ------------------------------ lifecycle --------------------------- */
  function startGame() {
    const s = S();
    s.turnPointer = 0;
    s.questionIndex = 0;
    s.teams.forEach((t) => { t.score = 0; t.attacksMade = 0; t.mustSkip = 0; });
    MA.board.deal();
    MA.quiz.resetTimerDisplay();
    renderScoreboard();
    beginTurn();
  }

  function beginTurn() {
    const s = S();
    // The game is over when the board is cleared, or when we simply run out
    // of questions — whichever comes first.
    if (!CONFIG.reshuffleOnEmpty && MA.board.allLocked()) { endGame(); return; }
    if (s.questionIndex >= s.questions.length) { endGame(); return; }
    hideVerse();

    // Advance past any team that must skip this turn (the "skipNext" punishment).
    let guard = 0, skipped = null;
    let idx = s.order[s.turnPointer % s.order.length];
    while (s.teams[idx].mustSkip > 0 && guard < s.order.length) {
      s.teams[idx].mustSkip--;
      skipped = idx;
      s.turnPointer++;
      idx = s.order[s.turnPointer % s.order.length];
      guard++;
    }

    if (skipped != null) {
      // Let the room see who lost their turn, then start the next team's turn.
      setPhase("idle"); // clears the role circles while the message is up
      renderScoreboard();
      updateProgress();
      setBanner("turnSkipped", { team: teamName(skipped) }, "attack");
      MA.audio.play("wrong");
      MA.board.setEnabled(false);
      showControls({ skip: false, start: false, next: false });
      setTimeout(() => setupTurn(idx), 1500);
    } else {
      setupTurn(idx);
    }
  }

  function setupTurn(idx) {
    const s = S();
    s.currentTeamIndex = idx;
    s.answeringTeamIndex = s.currentTeamIndex;
    s.attackerIndex = null;
    s.activeAttackCard = null;
    s.activeAttackCardIdx = null;
    s.pendingEffect = null;

    MA.quiz.hideQuestion();
    MA.quiz.resetTimerDisplay();
    updateProgress();
    renderScoreboard();

    if (MA.board.hasFlippable()) {
      s.phase = "attack-await-flip";
      s.attackerIndex = chooseFairAttacker(s.currentTeamIndex);
      renderScoreboard(); // re-render now that attackerIndex is known, so the attack badge shows
      renderRoles();
      setBanner("attackBanner", { attacker: teamName(s.attackerIndex) }, "attack");
      MA.board.setEnabled(true);
      MA.board.setClickHandler(onAttackerFlip);
      showControls({ skip: true, start: false, next: false });
    } else {
      // board fully matched and no reshuffle -> straight to the question
      setPhase("question-ready");
      setBanner("skipAttackBanner", {}, "");
      MA.board.setEnabled(false);
      MA.quiz.showLockedPrompt();
      showControls({ skip: false, start: true, next: false });
    }
  }

  /* ------------------------- attack / defend -------------------------- */
  function onAttackerFlip(idx, card) {
    const s = S();
    if (s.phase !== "attack-await-flip") return;
    setPhase("resolving");
    MA.board.setClickHandler(null);
    MA.board.setEnabled(false);
    showControls({ skip: false, start: false, next: false });
    MA.board.flip(idx);

    if (card.type === "defend") {
      // fizzle: no effect, flip back and move on
      setBanner("attackFizzle", {}, "");
      MA.audio.play("block");
      setTimeout(() => { MA.board.flipBack(idx); toQuestionReady(); }, 3200);
    } else {
      // attack card: the current team must now defend
      s.activeAttackCard = card;
      s.activeAttackCardIdx = idx;
      renderRoles();
      setBanner("defenseBanner", { team: teamName(s.currentTeamIndex) }, "defend");
      MA.audio.play("attack");
      setTimeout(() => {
        setPhase("defense-await-flip");
        MA.board.setEnabled(true);
        MA.board.setClickHandler(onDefenderFlip);
      }, 700);
    }
  }

  function onDefenderFlip(idx, card) {
    const s = S();
    if (s.phase !== "defense-await-flip") return;
    setPhase("resolving");
    MA.board.setClickHandler(null);
    MA.board.setEnabled(false);
    MA.board.flip(idx);

    const atk = s.activeAttackCard;
    const success = card.type === "defend" && card.pairId === atk.pairId;

    if (success) {
      setBanner("defenseBlocked", {}, "defend");
      showVerse(atk);
      MA.audio.play("block");
      setTimeout(() => {
        MA.board.lock(atk.pairId);
        maybeReshuffle();
        s.pendingEffect = null;
        toQuestionReady();
      }, 2400);
    } else {
      s.pendingEffect = atk.effect || "skip";
      MA.audio.play("attack");
      setBanner("defenseFailed", { effect: effectText(s.pendingEffect, atk) }, "attack");
      // Don't reveal the matching verse here — the pair isn't locked, so the
      // same attack card can reappear and this would give away its answer.
      // The two cards stay face-up until the room closes the punishment
      // modal, then linger a beat longer so the mismatch can be studied.
      shockwave(effectText(s.pendingEffect, atk), () => {
        setTimeout(() => {
          MA.board.flipBack(idx);
          if (s.activeAttackCardIdx != null) MA.board.flipBack(s.activeAttackCardIdx);
          toQuestionReady();
        }, 1400);
      });
    }
  }

  // Facilitator chooses not to attack this round
  function skipAttack() {
    const s = S();
    if (s.phase !== "attack-await-flip") return;
    MA.board.setClickHandler(null);
    MA.board.setEnabled(false);
    // give the attacker's fairness credit back since they didn't actually attack
    if (s.attackerIndex != null) {
      s.teams[s.attackerIndex].attacksMade = Math.max(0, s.teams[s.attackerIndex].attacksMade - 1);
    }
    s.pendingEffect = null;
    setBanner("skipAttackBanner", {}, "");
    toQuestionReady();
  }

  function toQuestionReady() {
    const s = S();
    s.phase = "question-ready";

    // "steal" hands the question to the attacking team
    s.answeringTeamIndex =
      s.pendingEffect === "steal" && s.attackerIndex != null ? s.attackerIndex : s.currentTeamIndex;

    // "lose" is applied immediately to the attacked (current) team
    if (s.pendingEffect === "lose") addScore(s.currentTeamIndex, -loseAmount(s.activeAttackCard));

    // "skipNext" marks the attacked team to miss its NEXT turn (it still answers now)
    if (s.pendingEffect === "skipNext") s.teams[s.currentTeamIndex].mustSkip += 1;

    // The punishment (if any) stays readable in the phase banner above —
    // its text isn't overwritten again until beginQuestion() runs.
    MA.quiz.showLockedPrompt(); // Start is now visible below

    renderScoreboard();
    renderRoles();
    showControls({ skip: false, start: true, next: false });
  }

  /* ---------------------------- question ------------------------------ */
  function beginQuestion() {
    const s = S();
    if (s.phase !== "question-ready") return;

    const q = s.questions[s.questionIndex];
    const effect = s.pendingEffect;

    if (effect === "skip") {
      setPhase("answered");
      MA.quiz.showQuestion(q, { disabled: true });
      MA.quiz.forceReveal(q);
      setBanner("questionSkipped", {}, "attack");
      MA.audio.play("wrong");
      renderScoreboard();
      showControls({ skip: false, start: false, next: true });
      return;
    }

    setPhase("question-live");
    let seconds = CONFIG.timerSeconds;
    if (effect === "cut") {
      const frac = (s.activeAttackCard && s.activeAttackCard.effectValue) || (CONFIG.effects.cut.fraction || 0.5);
      seconds = Math.max(5, Math.round(seconds * frac));
    }

    MA.quiz.showQuestion(q, { disabled: false, onAnswer: (correct) => onAnswer(correct) });
    setBanner(effect === "steal" ? "answeringNow" : "turnBanner", { team: teamName(s.answeringTeamIndex) },
      effect === "steal" ? "attack" : "");
    showControls({ skip: false, start: false, next: false });
    MA.quiz.startTimer(seconds, () => onTimeUp(q));
  }

  function onAnswer(correct) {
    const s = S();
    if (s.phase !== "question-live") return;
    setPhase("answered");
    let pts = correct ? CONFIG.points.correct : CONFIG.points.wrong;
    // "halfPoints" punishment: a correct answer is worth only half this round
    if (correct && s.pendingEffect === "halfPoints") pts = Math.round(pts * (CONFIG.effects.half.fraction || 0.5));
    addScore(s.answeringTeamIndex, pts);
    setFeedback(correct, pts);
    setBanner(correct ? "answerCorrect" : "answerWrong", { n: pts }, correct ? "defend" : "attack");
    showControls({ skip: false, start: false, next: true });
  }

  function onTimeUp(q) {
    const s = S();
    if (s.phase !== "question-live") return;
    setPhase("answered");
    MA.quiz.forceReveal(q);
    addScore(s.answeringTeamIndex, CONFIG.points.wrong);
    MA.audio.play("wrong");
    setBanner("timeUp", {}, "attack");
    showControls({ skip: false, start: false, next: true });
  }

  function nextTurn() {
    const s = S();
    s.questionIndex++;
    s.turnPointer++;
    beginTurn();
  }

  /* ----------------------------- helpers ------------------------------ */
  function chooseFairAttacker(currentIdx) {
    const s = S();
    const candidates = s.teams.map((_, i) => i).filter((i) => i !== currentIdx);
    const min = Math.min.apply(null, candidates.map((i) => s.teams[i].attacksMade));
    const pool = candidates.filter((i) => s.teams[i].attacksMade === min);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    s.teams[pick].attacksMade++;
    return pick;
  }

  function maybeReshuffle() {
    if (MA.board.allLocked() && CONFIG.reshuffleOnEmpty) setTimeout(() => MA.board.reset(), 500);
  }

  function loseAmount(atk) { return (atk && atk.effectValue) || (CONFIG.effects.lose.points || 10); }

  function effectText(effect, atk) {
    switch (effect) {
      case "steal": return TXT.effectSteal;
      case "cut": return TXT.effectCut;
      case "lose": return MA.util.fmt(TXT.effectLose, { n: loseAmount(atk) });
      case "skipNext": return TXT.effectSkipNext;
      case "halfPoints": return TXT.effectHalf;
      case "skip":
      default: return TXT.effectSkip;
    }
  }

  function addScore(teamIdx, pts) {
    S().teams[teamIdx].score += pts;
    renderScoreboard();
    if (pts !== 0) bump(teamIdx);
  }

  function bump(teamIdx) {
    const el = document.querySelector(`#scoreboard .team-score[data-team="${teamIdx}"]`);
    if (el) { el.classList.add("bump"); setTimeout(() => el.classList.remove("bump"), 450); }
  }

  function setFeedback(correct, pts) {
    const el = document.getElementById("answer-feedback");
    if (!el) return;
    const n = pts != null ? pts : CONFIG.points.correct;
    el.textContent = correct ? MA.util.fmt(TXT.answerCorrect, { n: n }) : TXT.answerWrong;
    el.className = "answer-feedback " + (correct ? "good" : "bad");
  }

  function setBanner(key, obj, cls) {
    const el = document.getElementById("phase-banner");
    if (!el) return;
    el.textContent = MA.util.fmt(TXT[key] || key, obj || {});
    el.className = "phase-banner flash" + (cls ? " " + cls : "");
    void el.offsetWidth; // restart the flash animation
  }

  const ATTACK_PHASES = ["attack-await-flip", "defense-await-flip", "resolving"];

  function renderScoreboard() {
    const s = S();
    const el = document.getElementById("scoreboard");
    if (!el) return;
    const highlight = s.answeringTeamIndex != null ? s.answeringTeamIndex : s.currentTeamIndex;
    const attackerVisible = s.attackerIndex != null && ATTACK_PHASES.indexOf(s.phase) !== -1;
    el.innerHTML = s.teams
      .map((t, i) => {
        const cls = "team-score" +
          (i === highlight ? " is-turn" : "") +
          (attackerVisible && i === s.attackerIndex ? " is-attacker" : "");
        return `<div class="${cls}" data-team="${i}" style="--c:${t.color}">` +
          `<div class="ts-name"><span>${escapeHtml(t.name)}</span></div>` +
          `<div class="ts-score">${t.score}</div>` +
        "</div>";
      })
      .join("");
  }

  function updateProgress() {
    const s = S();
    const el = document.getElementById("progress");
    if (!el) return;
    const n = s.questions.length;
    const i = Math.min(s.questionIndex + 1, n);
    el.textContent = MA.util.fmt(TXT.progressLabel, { i, n });
  }

  /* --------------------- role circles (question box) ------------------- */
  /* Two colored circles inside the question panel: which team must pick a
     card right now, and which team answers. Captions change with the phase. */
  function buildRoles(s) {
    const C = s.currentTeamIndex;
    const A = s.attackerIndex;
    const answering = s.answeringTeamIndex != null ? s.answeringTeamIndex : C;
    const atkRole = A != null ? { team: A, icon: "⚔️", label: TXT.roleAttacking } : null;

    switch (s.phase) {
      case "attack-await-flip":
        return [
          { team: C, icon: "✍️", label: TXT.roleWillAnswer },
          A != null ? { team: A, icon: "⚔️", label: TXT.rolePickAttack, active: true } : null
        ];

      case "defense-await-flip":
        return [
          { team: C, icon: "🛡️", label: TXT.rolePickDefend, active: true },
          atkRole
        ];

      case "resolving":
        // mid-animation: same pair as the phase we came from
        return s.activeAttackCard
          ? [{ team: C, icon: "🛡️", label: TXT.rolePickDefend }, atkRole]
          : [{ team: C, icon: "✍️", label: TXT.roleWillAnswer }, atkRole];

      case "question-ready":
      case "question-live":
      case "answered":
        return [
          { team: answering, icon: "✍️",
            label: s.phase === "question-ready" ? TXT.roleWillAnswer : TXT.roleAnswering, active: true },
          A === answering
            ? { team: C, icon: "💥", label: TXT.roleLostQuestion } // "steal": the question moved
            : atkRole
        ];

      default:
        return [];
    }
  }

  function renderRoles() {
    const s = S();
    const el = document.getElementById("turn-roles");
    if (!el) return;
    const roles = buildRoles(s).filter((r) => r && r.team != null);
    if (!roles.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = roles
      .map((r) => {
        const t = s.teams[r.team];
        return `<div class="role${r.active ? " is-active" : ""}" style="--c:${t.color}">` +
          `<span class="role-dot">${r.icon}</span>` +
          `<span class="role-team">${escapeHtml(t.name)}</span>` +
          `<span class="role-label">${escapeHtml(r.label)}</span>` +
        "</div>";
      })
      .join('<span class="role-vs" aria-hidden="true">VS</span>');
  }

  // Center-screen toast explaining WHY the team is being punished. Closed
  // by the player (× button or clicking outside the card), not a timer —
  // reading it is never rushed. onClose runs once, when it's dismissed.
  function shockwave(effectDesc, onClose) {
    const d = document.createElement("div");
    d.className = "shockwave";
    d.innerHTML =
      '<div class="shockwave-card">' +
        '<button class="sw-close" aria-label="' + escapeHtml(TXT.closeLabel) + '">✕</button>' +
        '<div class="sw-icon">💥</div>' +
        '<div class="sw-title">' + escapeHtml(TXT.punishTitle) + "</div>" +
        '<div class="sw-body">' + escapeHtml(TXT.punishBody) + "</div>" +
        '<div class="sw-effect">' + escapeHtml(effectDesc) + "</div>" +
      "</div>";
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      d.remove();
      if (onClose) onClose();
    };
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest(".sw-close")) close(); });
    document.body.appendChild(d);
  }

  // Reveal the full defend verse (with reference) when an attack resolves.
  function showVerse(atk) {
    const el = document.getElementById("verse-reveal");
    if (!el || !atk || !atk.matchVerse) return;
    el.innerHTML =
      '<div class="vr-ref">' + MA.util.refHtml(atk.matchRef || "") + "</div>" +
      '<div class="vr-verse">' + escapeHtml(atk.matchVerse) + "</div>";
    el.hidden = false;
    el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  }

  function hideVerse() {
    const el = document.getElementById("verse-reveal");
    if (el) { el.hidden = true; el.classList.remove("show"); el.innerHTML = ""; }
  }

  function showControls(o) {
    setVisible("btn-skip-attack", o.skip);
    setVisible("btn-start-question", o.start);
    setVisible("btn-next", o.next);
  }
  function setVisible(id, show) { const el = document.getElementById(id); if (el) el.hidden = !show; }

  function endGame() {
    const s = S();
    MA.quiz.stopTimer();
    setPhase("results");
    MA.ui.showScreen("results");

    const ranked = s.teams.map((t, i) => ({ name: t.name, color: t.color, score: t.score, i })).sort((a, b) => b.score - a.score);

    // Equal scores share a place (1, 1, 3, 4) — the game has no second
    // metric that would fairly separate them, so we don't invent one.
    let place = 0, prevScore = null;
    ranked.forEach((t, i) => {
      if (prevScore === null || t.score !== prevScore) { place = i + 1; prevScore = t.score; }
      t.place = place;
    });

    const winners = ranked.filter((t) => t.place === 1);
    document.getElementById("winner-line").textContent = winners.length > 1
      ? MA.util.fmt(TXT.winnerTieLabel, { teams: winners.map((w) => w.name).join(TXT.tieJoiner) })
      : MA.util.fmt(TXT.winnerLabel, { team: winners[0].name });

    const podium = document.getElementById("podium");
    podium.innerHTML = "";
    ranked.forEach((t, i) => {
      const li = document.createElement("li");
      li.dataset.place = String(t.place);
      li.style.setProperty("--c", t.color);
      li.style.animationDelay = i * 0.12 + "s";
      li.innerHTML =
        `<div class="p-rank">${t.place}</div>` +
        `<div class="p-name">${escapeHtml(t.name)}</div>` +
        `<div class="p-score">${t.score}</div>`;
      podium.appendChild(li);
    });

    MA.audio.play("win");
    if (MA.ui.confetti) MA.ui.confetti();
  }

  return { startGame, beginQuestion, nextTurn, skipAttack, endGame };
})();
