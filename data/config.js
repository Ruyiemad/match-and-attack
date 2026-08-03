/* =======================================================================
   Match & Attack — CONFIG
   -----------------------------------------------------------------------
   This is the main settings file. Change numbers, colors, and text here.
   No coding needed — just edit the values between the quotes / after the ":".
   ======================================================================= */

window.CONFIG = {
  /* Brand name (shown in English) */
  title: "Match & Attack",

  /* Question timer, in seconds */
  timerSeconds: 60,

  /* Points */
  points: {
    correct: 10,   // points for a correct answer
    wrong: 0       // points for a wrong answer / timeout (can be negative, e.g. -5)
  },

  /* Numeric values for the two effects that need a number.
     (The "skip" and "steal" effects need no number.) */
  effects: {
    lose: { points: 10 },    // "lose" effect: how many points are deducted
    cut:  { fraction: 0.5 }, // "cut" effect: timer is multiplied by this (0.5 = half)
    half: { fraction: 0.5 }  // "halfPoints" effect: a correct answer is multiplied by this
  },

  /* The four teams' preset colors (names are typed by mentors at setup) */
  teamColors: [
    { name: "Red",    hex: "#ef4444" },
    { name: "Blue",   hex: "#3b82f6" },
    { name: "Yellow", hex: "#f4b400" },
    { name: "Green",  hex: "#22c55e" }
  ],

  /* When all 5 pairs on the board are matched, reshuffle the cards to keep
     playing. Set to false to instead stop offering attacks once the board
     is fully matched. */
  reshuffleOnEmpty: true,

  /* Sound effects on/off (can also be toggled with the speaker button) */
  sound: true,

  /* ---- Button labels (kept in English on purpose) ---- */
  labels: {
    startGame: "Start Game",
    continue: "Continue",
    startPlaying: "Start Playing",
    start: "Start",
    next: "Next",
    playAgain: "Play Again",
    skipAttack: "Skip Attack",
    endGame: "End Game"
  }
};

/* -----------------------------------------------------------------------
   Arabic on-screen text (everything except the buttons above).
   Words in {curly braces} are replaced automatically by the game
   (e.g. {team} becomes the team name). Keep them as they are.
   ----------------------------------------------------------------------- */
window.TXT = {
  welcomeTagline: "طابِق المشتّت بالحل المناسب.. واربح!",
  welcomeSub: "لعبة جماعية لأربعة فرق لتحدّي المشتتات",

  setupHeading: "لدينا ٤ فرق — أدخل اسم كل فريق",
  setupPlaceholder: "اسم الفريق",
  setupError: "الرجاء إدخال اسم لكل فريق (بدون تكرار).",

  randomizerHeading: "من يبدأ أولاً؟",
  randomizerSpinning: "جارٍ تحديد ترتيب اللعب…",
  randomizerDone: "ترتيب اللعب",
  orderLabels: ["الأول", "الثاني", "الثالث", "الرابع"],

  turnBanner: "دور فريق {team} للإجابة",
  turnSkipped: "فريق {team} يفوّت هذا الدور بسبب المشتّت",
  attackBanner: "فريق {attacker} يهاجم! اختر بطاقة لقلبها",
  attackFizzle: "بطاقة دفاع — لا تأثير! تعود البطاقة كما كانت",
  defenseBanner: "هجوم على فريق {team}! جِد بطاقة الحل المطابقة للدفاع",
  defenseBlocked: "أحسنت! تم صدّ الهجوم 🛡️",
  defenseFailed: "الهجوم نجح! {effect}",
  skipAttackBanner: "لا هجوم هذه الجولة — اضغط Start لعرض السؤال",

  effectSkip: "لا يمكن للفريق الإجابة على هذا السؤال.",
  effectSkipNext: "يفوّت الفريق دوره القادم!",
  effectLose: "يخسر الفريق {n} نقاط.",
  effectSteal: "ينتقل السؤال إلى الفريق المهاجم!",
  effectCut: "وقت السؤال يُخفّض إلى النصف.",
  effectHalf: "نقاط السؤال تُخفّض إلى النصف.",

  questionHidden: "اضغط Start لعرض السؤال وبدء الوقت",
  questionSkipped: "تم تخطّي السؤال بسبب المشتّت — الإجابة الصحيحة موضّحة بالأسفل.",
  answerCorrect: "إجابة صحيحة! ‎+{n}",
  answerWrong: "إجابة خاطئة",
  timeUp: "انتهى الوقت!",
  answeringNow: "يُجيب الآن: فريق {team}",

  progressLabel: "السؤال {i} من {n}",
  resultsHeading: "النتائج النهائية",
  winnerLabel: "🏆 الفائز: فريق {team}",
  reduceMotionNote: ""
};
