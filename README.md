# Match & Attack ✈️

A big-screen, facilitator-run team game for a youth event, built around the
theme of **beating distractions** ("airplane mode"). Four teams answer quiz
questions while a **Flip & Match** card board lets opponents launch a
**distraction attack** — which the answering team must **defend** by finding
the matching solution card.

- **No database, no build step.** Plain HTML/CSS/JavaScript.
- **Interface:** Arabic (right-to-left). Buttons and the game name are in English.
- **Teams:** 4, named by the mentors at setup. Colors are preset.

---

## Run it locally

Just open **`index.html`** in a browser (double-click it).

For the best experience (so sounds and fonts load cleanly), you can serve it:

```bash
npx serve .
```

Then open the address it prints (e.g. `http://localhost:3000`).

> Tip: put the browser in fullscreen (F11) on the projector. The scoreboard and
> timer stay visible at the top for the whole audience.

---

## How to play (facilitator)

1. **Start Game** → enter each of the 4 team names → **Continue**.
2. The wheel spins and reveals the play order (1st → 4th) → **Start Playing**.
3. Each turn:
   - The game fairly picks **one opposing team to attack** and asks them to flip a card.
     - Flips a **green solution (defend) card** → no effect.
     - Flips a **red distraction (attack) card** → the current team must flip a card
       to find its **matching solution**.
       - Correct match → *attack blocked*, the pair is locked.
       - Wrong → the attack lands and its effect applies (skip / lose points / steal / cut time).
     - (Use **Skip Attack** to pass on attacking this round.)
   - Click **Start** to reveal the question and start the 1-minute timer.
   - The team clicks their answer. Correct = +10.
   - Click **Next** for the next team/question.
4. When the questions run out (or you click **End Game**), the podium shows the winner.

---

## Edit the content (no coding needed)

All content lives in the **`data/`** folder — open these in any text editor:

| File | What it controls |
|------|------------------|
| `data/questions.js` | The quiz questions and answers. |
| `data/cards.js` | The 5 distraction↔solution pairs and each attack's penalty effect. |
| `data/config.js` | Timer length, points, team colors, and all on-screen text. |

**Attack card effects** (set per card in `data/cards.js`):

- `"skip"` — the attacked team can't answer this question (0 points).
- `"lose"` — the team loses points (amount in `config.js`).
- `"steal"` — the attacking team answers the question instead.
- `"cut"` — the team answers, but with half the time.

---

## Deploy to GitHub Pages

1. Create a GitHub repository and upload this whole folder.
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**,
   **Branch = `main`**, folder **`/ (root)`**, then **Save**.
4. Wait a minute; your game is live at
   `https://<your-username>.github.io/<repo-name>/`.

---

## Files

```
index.html            Page structure (all screens)
css/styles.css        Airplane/sky theme + layout + animations
data/config.js        Settings + Arabic text
data/questions.js     Quiz questions
data/cards.js         Attack/defend card pairs
js/audio.js           Sound effects (synthesized) + utilities
js/wheel.js           Turn-order randomizer
js/board.js           Flip & Match card board
js/quiz.js            Question panel + timer
js/engine.js          Turn loop, rules, scoring
js/main.js            App bootstrap + wiring
```

> Fonts load from Google Fonts when online; if offline, the game falls back to
> your system's Arabic font automatically.
