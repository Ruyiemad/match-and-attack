/* =======================================================================
   Match & Attack — Turn-order randomizer (spinning wheel)
   The wheel actually lands on the first team in the turn order: main.js
   picks the shuffled order first, then tells us which slice to land the
   pointer on, so what the room sees matches the list revealed afterward.
   ======================================================================= */

window.MA = window.MA || {};

MA.wheel = (function () {
  function render(teams) {
    const wheel = document.getElementById("wheel");
    if (!wheel) return;
    const n = teams.length;
    const seg = 360 / n;
    const stops = teams
      .map((t, i) => `${t.color} ${i * seg}deg ${(i + 1) * seg}deg`)
      .join(", ");
    wheel.style.background = `conic-gradient(${stops})`;
    wheel.style.transform = "rotate(0deg)";
  }

  // The pointer sits at the wheel's top (0deg of the conic-gradient, which
  // CSS starts at 12 o'clock going clockwise). Team `targetIndex` occupies
  // [targetIndex*seg, (targetIndex+1)*seg) in that same clockwise frame, so
  // rotating the wheel clockwise by (360 - segment-center) brings that
  // segment's center under the pointer.
  function spin(teamCount, targetIndex) {
    return new Promise((resolve) => {
      const wheel = document.getElementById("wheel");
      if (!wheel) { resolve(); return; }

      const seg = 360 / teamCount;
      const segCenter = (targetIndex + 0.5) * seg;
      // small jitter so it doesn't always stop dead-center in the slice,
      // while staying safely clear of the slice's own edges
      const jitterMax = Math.max(0, seg / 2 - 10);
      const jitter = (Math.random() * 2 - 1) * jitterMax;
      const landingOffset = ((360 - segCenter - jitter) % 360 + 360) % 360;

      const turns = 5 + Math.floor(Math.random() * 3);
      const finalDeg = turns * 360 + landingOffset;

      // ticking sound during the spin
      let ticks = 16;
      const iv = setInterval(() => {
        MA.audio.play("spin");
        if (--ticks <= 0) clearInterval(iv);
      }, 220);

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearInterval(iv);
        wheel.removeEventListener("transitionend", finish);
        resolve();
      };

      // trigger the CSS transition
      requestAnimationFrame(() => { wheel.style.transform = `rotate(${finalDeg}deg)`; });
      wheel.addEventListener("transitionend", finish);
      setTimeout(finish, 4300); // fallback in case transitionend doesn't fire
    });
  }

  return { render, spin };
})();
