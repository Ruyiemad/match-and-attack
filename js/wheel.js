/* =======================================================================
   Match & Attack — Turn-order randomizer (spinning wheel)
   The wheel is decorative flair; the actual order is a fair random shuffle
   done in main.js after the spin.
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

  function spin() {
    return new Promise((resolve) => {
      const wheel = document.getElementById("wheel");
      if (!wheel) { resolve(); return; }

      const turns = 5 + Math.floor(Math.random() * 3);
      const finalDeg = turns * 360 + Math.floor(Math.random() * 360);

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
