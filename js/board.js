/* =======================================================================
   Match & Attack — The Flip & Match card board
   Owns the 10 cards (5 attack + 5 defend). The engine sets a click handler
   depending on the current phase (attacker flipping vs defender flipping).
   ======================================================================= */

window.MA = window.MA || {};

MA.board = (function () {
  let cards = [];          // { idx, pairId, type, text, effect, effectValue, faceUp, locked }
  let clickHandler = null;

  const boardEl = () => document.getElementById("card-board");
  const cardEl = (idx) => boardEl().querySelector(`.card[data-idx="${idx}"]`);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  }

  function deal() {
    const list = [];
    (window.CARDS || []).forEach((pair) => {
      list.push({
        pairId: pair.id, type: "attack",
        title: pair.attackTitle, desc: pair.attackDesc,
        effect: pair.effect, effectValue: pair.effectValue,
        // defend info copied onto the attack card so the engine can reveal the
        // verse straight from the active attack card when it resolves
        matchRef: pair.defendRef, matchVerse: pair.defendVerse
      });
      list.push({
        pairId: pair.id, type: "defend",
        cue: pair.defendCue, ref: pair.defendRef,
        verse: pair.defendVerse, tagline: pair.defendTagline
      });
    });
    cards = MA.util.shuffle(list).map((c, i) => ({ ...c, idx: i, faceUp: false, locked: false }));
    render();
  }

  function render() {
    const el = boardEl();
    if (!el) return;
    el.innerHTML = "";
    el.classList.remove("locked-all");
    cards.forEach((c) => {
      const card = document.createElement("div");
      card.className = "card" + (c.locked ? " locked" : "") + (c.faceUp ? " flipped" : "");
      card.dataset.idx = c.idx;
      const icon = c.type === "attack" ? "⚠️" : "🛡️";
      let front;
      if (c.type === "attack") {
        front =
          '<div class="cf-icon">' + icon + "</div>" +
          '<div class="cf-title">' + escapeHtml(c.title) + "</div>" +
          '<div class="cf-desc">' + escapeHtml(c.desc) + "</div>";
      } else {
        front =
          (c.tagline ? '<div class="cf-tagline">' + escapeHtml(c.tagline) + "</div>" : "") +
          '<div class="cf-icon">' + icon + "</div>" +
          '<div class="cf-cue">' + escapeHtml(c.cue) + "</div>" +
          '<div class="cf-ref">' + MA.util.refHtml(c.ref) + "</div>";
      }
      card.innerHTML =
        '<div class="card-inner">' +
          '<div class="card-face card-back">' +
            '<div class="cb-icon">✈️</div>' +
            '<div class="cb-label">MATCH &amp; ATTACK</div>' +
          "</div>" +
          '<div class="card-face card-front ' + c.type + '">' + front + "</div>" +
        "</div>";
      card.addEventListener("click", () => onCardClick(c.idx));
      el.appendChild(card);
    });
  }

  function onCardClick(idx) {
    const c = cards[idx];
    if (!c || c.locked || c.faceUp) return;
    if (typeof clickHandler === "function") clickHandler(idx, c);
  }

  function flip(idx) {
    const c = cards[idx]; if (!c) return;
    c.faceUp = true;
    const el = cardEl(idx);
    if (el) { el.classList.add("flipped"); if (c.type === "attack") el.classList.add("is-attack-reveal"); }
    MA.audio.play("flip");
  }

  function flipBack(idx) {
    const c = cards[idx]; if (!c) return;
    c.faceUp = false;
    const el = cardEl(idx);
    if (el) el.classList.remove("flipped", "is-attack-reveal");
  }

  function lock(pairId) {
    cards.forEach((c) => {
      if (c.pairId === pairId) {
        c.locked = true; c.faceUp = true;
        const el = cardEl(c.idx);
        if (el) el.classList.add("flipped", "locked", "matched-pop");
      }
    });
  }

  return {
    deal,
    render,
    flip,
    flipBack,
    lock,
    reset: deal,
    setClickHandler(fn) { clickHandler = fn; },
    setEnabled(on) { const el = boardEl(); if (el) el.classList.toggle("locked-all", !on); },
    hasFlippable() { return cards.some((c) => !c.locked); },
    allLocked() { return cards.length > 0 && cards.every((c) => c.locked); },
    get(idx) { return cards[idx]; }
  };
})();
