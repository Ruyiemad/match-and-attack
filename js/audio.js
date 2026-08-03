/* =======================================================================
   Match & Attack — Audio + shared utilities
   Sounds are synthesized with the Web Audio API (no audio files needed).
   ======================================================================= */

window.MA = window.MA || {};

MA.util = {
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },
  // Replace {key} placeholders in a string with values from obj
  fmt(str, obj) {
    return String(str).replace(/\{(\w+)\}/g, (_, k) => (obj && k in obj ? obj[k] : "{" + k + "}"));
  },
  // Escape + force numeric clusters (e.g. Bible refs like ٦:٤-٥) to render
  // left-to-right, so bidi-neutral ":" and "-" don't reorder them inside RTL
  // text. Returns HTML (number runs wrapped in <span class="ltr-num">).
  refHtml(s) {
    const esc = String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
    return esc.replace(/[\d٠-٩][\d٠-٩:–\-]*/g, (m) => '<span class="ltr-num">' + m + "</span>");
  }
};

MA.audio = (function () {
  let enabled = !(window.CONFIG && CONFIG.sound === false);
  let ctx = null;

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { ctx = null; }
    }
    return ctx;
  }

  function tone(freq, dur, type, vol, offset) {
    const c = ac(); if (!c) return;
    const t0 = c.currentTime + (offset || 0);
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  const sounds = {
    click() { tone(440, 0.08, "triangle", 0.15); },
    flip() { tone(600, 0.09, "sine", 0.15); tone(920, 0.07, "sine", 0.1, 0.05); },
    correct() { tone(660, 0.12, "sine", 0.2); tone(880, 0.14, "sine", 0.2, 0.12); tone(1180, 0.18, "sine", 0.2, 0.24); },
    wrong() { tone(200, 0.25, "sawtooth", 0.18); tone(150, 0.3, "sawtooth", 0.15, 0.08); },
    attack() { tone(320, 0.12, "square", 0.2); tone(240, 0.18, "square", 0.2, 0.1); tone(150, 0.26, "square", 0.18, 0.2); },
    block() { tone(520, 0.1, "sine", 0.18); tone(780, 0.14, "sine", 0.18, 0.09); },
    spin() { tone(300, 0.05, "square", 0.08); },
    tick() { tone(880, 0.04, "sine", 0.07); },
    win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.26, "triangle", 0.2, i * 0.14)); }
  };

  return {
    play(name) {
      if (!enabled) return;
      try {
        const c = ac();
        if (c && c.state === "suspended") c.resume();
        (sounds[name] || function () {})();
      } catch (e) { /* ignore */ }
    },
    setEnabled(v) { enabled = !!v; },
    isEnabled() { return enabled; },
    toggle() { enabled = !enabled; return enabled; }
  };
})();
