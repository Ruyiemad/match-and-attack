/* =======================================================================
   Match & Attack — CARDS (the Flip & Match board)
   -----------------------------------------------------------------------
   There are 5 PAIRS below = 10 cards on the board.
   Each pair has:
     - attackTitle  : the distraction, shown big in English on the RED card
     - attackDesc   : a short Arabic description under the title
     - defendCue    : a SHORT Arabic phrase printed on the GREEN card
                      (the full verse is long, so only this cue is on the card)
     - defendRef    : the Bible reference (e.g. "متى ٦:٣٤")
     - defendVerse  : the FULL verse — revealed on screen when the attack
                      resolves (blocked or landed), not printed on the card
     - defendTagline: optional English tag on the green card ("" if none)
     - effect       : what happens if the attacked team FAILS to defend.
                      Choose ONE of:
                        "skipNext"   -> the team misses its NEXT turn
                        "steal"      -> the attacking team answers instead
                        "lose"       -> the team loses points (see effectValue)
                        "halfPoints" -> a correct answer earns only half points
                        "cut"        -> the team answers, but with half the time
     - effectValue  : optional. Used by "lose" (points to deduct). Leave null
                      to use the default from config.js.

   Keep it to 5 pairs so the board stays 2 x 5. Edit the Arabic text freely.
   ======================================================================= */

window.CARDS = [
  {
    id: 1,
    attackTitle: "PANICK / OVERTHINKING",
    attackDesc: "قلق على المستقبل وتفكير زائد",
    defendCue: "لا تهتمّوا للغد",
    defendRef: "متى ٦:٣٤",
    defendVerse: "لا تهتمّوا للغد، لأنّ الغد يهتمّ بما لنفسه. يكفي اليوم شرّه.",
    defendTagline: "",
    effect: "skipNext",
    effectValue: null
  },
  {
    id: 2,
    attackTitle: "TOXIC",
    attackDesc: "معاشرات رديئة",
    defendCue: "الصدّيق يهدي صاحبه",
    defendRef: "أمثال ١٢:٢٦",
    defendVerse: "الصدّيق يهدي صاحبه، أمّا طريق الأشرار فيضلّهم.",
    defendTagline: "",
    effect: "steal",
    effectValue: null
  },
  {
    id: 3,
    attackTitle: "LOST",
    attackDesc: "نقص إرشاد",
    defendCue: "بكثرة المشيرين تقوم",
    defendRef: "أمثال ١٥:٢٢",
    defendVerse: "مقاصد بلا مشورة تبطل، وبكثرة المشيرين تقوم.",
    defendTagline: "",
    effect: "lose",
    effectValue: 5
  },
  {
    id: 4,
    attackTitle: "DISTRACTIONS",
    attackDesc: "هموم وغرور وشهوات",
    defendCue: "لا تنظر إلى الوراء",
    defendRef: "لوقا ٩:٦٢",
    defendVerse: "ليس أحد يضع يده على المحراث وينظر إلى الوراء يصلح لملكوت الله.",
    defendTagline: "",
    effect: "halfPoints",
    effectValue: null
  },
  {
    id: 5,
    attackTitle: "REELS",
    attackDesc: "سوشيال ميديا ومقارنات",
    defendCue: "امتحن عملك أنت",
    defendRef: "غلاطية ٦:٤-٥",
    defendVerse: "ليمتحن كلّ واحد عمله، فحينئذٍ يكون له الافتخار من جهة نفسه فقط لا من جهة غيره؛ لأنّ كلّ واحد سيحمل حمل نفسه.",
    defendTagline: "DIGITAL DETOX",
    effect: "cut",
    effectValue: null
  }
];
