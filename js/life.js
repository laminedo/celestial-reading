// Life cycles, year ahead (solar return), retrogrades & eclipses, career timing, money style and compatibility.

const Life = (() => {
  const DAY = Astro.DAY;
  const ORD = Reading.ORD;
  const norm = Astro.norm;
  const noon = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const diff = (a, b) => norm(a - b + 180) - 180; // signed, −180…180
  const signDist = (a, b) => { const d = (((a - b) % 12) + 12) % 12; return Math.min(d, 12 - d); };
  const house = (sign, chart) => Reading.solarHouse(sign, chart.houseSign);
  const yearsBetween = (a, b) => (b - a) / (365.2422 * DAY);

  // ---------- life cycles ----------
  const SATURN_STEPS = FR ? FR_CONTENT.saturnSteps : {
    0: { title: "Saturn return", what: "Saturn comes back to where it was when you were born. It's the classic coming-of-age checkpoint: what isn't built on solid ground gets tested, and what's real gets stronger.",
      prep: ["Decide what you truly want for the next 30 years, not what others expect", "Commit to one path: career, relationship or home", "Pay down debt and build an emergency fund", "Drop habits and commitments that no longer fit"] },
    90: { title: "Saturn square (waxing)", what: "A test of the foundations you built since your last Saturn checkpoint. Obstacles show where you need more structure.",
      prep: ["Strengthen your skills and qualifications", "Fix what's shaky instead of starting over", "Be patient: effort now pays off at the next stage"] },
    180: { title: "Saturn opposition", what: "Halfway through the 29-year cycle. You see clearly what's working and what isn't, often through other people and responsibilities.",
      prep: ["Take stock of results honestly", "Rebalance work and relationships", "Adjust goals rather than abandoning them"] },
    270: { title: "Saturn square (waning)", what: "A clearing phase before the next return. Old structures you've outgrown start to fall away.",
      prep: ["Let go of what's finished", "Simplify commitments", "Start quietly preparing your next chapter"] },
  };
  const JUPITER_RETURN = FR ? FR_CONTENT.jupiterReturn : {
    title: "Jupiter return",
    what: "Jupiter returns to its birth position every 12 years and opens a new cycle of growth, luck and opportunity.",
    prep: ["Say yes to opportunities that expand you", "Start a new learning, travel or business chapter", "Set big 12-year goals"],
  };
  const OUTER = [
    { age: 21, title: "Uranus square", what: "A push for independence and finding your own identity, away from family expectations.", prep: ["Experiment and explore", "Build your own skills and income", "Choose your own values"] },
    { age: 38, title: "Neptune square", what: "Dreams and reality get re-examined. Purpose and meaning matter more than before.", prep: ["Reconnect with what inspires you", "Watch for escapism and burnout", "Make room for creativity or spirituality"] },
    { age: 41, title: "Uranus opposition (midlife)", what: "The famous midlife awakening. A strong urge to live more authentically and change what feels stuck.", prep: ["Make changes deliberately, not impulsively", "Try something new you always wanted to do", "Review career, health and relationships"] },
    { age: 50, title: "Chiron return", what: "A healing milestone. Old wounds come up so they can be resolved, and you become a mentor to others.", prep: ["Address old hurts with support", "Share what you've learned", "Prioritize health checkups"] },
    { age: 63, title: "Uranus square (waning)", what: "A second wave of freedom: retirement planning, new interests and a lighter life.", prep: ["Plan finances for the next chapter", "Pick up new hobbies", "Stay socially active"] },
    { age: 84, title: "Uranus return", what: "Uranus completes a full orbit: a life review and a time to pass on wisdom.", prep: ["Record your story for family", "Celebrate a full life", "Stay curious"] },
  ];
  if (FR) OUTER.forEach((o, i) => Object.assign(o, FR_CONTENT.outer[i]));

  // Moments when a planet's transit hits natal longitude + target angle; retrograde passes grouped together.
  function aspectPasses(planet, natalLon, target, from, to) {
    const out = [];
    const step = 5 * DAY;
    let t = from.getTime(), prev = diff(Astro.longitudes(new Date(t))[planet], natalLon + target);
    for (t += step; t < to.getTime(); t += step) {
      const cur = diff(Astro.longitudes(new Date(t))[planet], natalLon + target);
      if (Math.sign(cur) !== Math.sign(prev) && Math.abs(cur - prev) < 30) {
        const when = new Date(t - step / 2);
        const last = out[out.length - 1];
        if (last && when - last.last < 400 * DAY) last.last = when;
        else out.push({ first: when, last: when });
      }
      prev = cur;
    }
    return out;
  }

  let cycleCache = null;
  function lifeCycles(chart, now = new Date()) {
    if (cycleCache && cycleCache.key === chart.seed) return cycleCache.value;
    const born = chart.when, end = new Date(born.getTime() + 90 * 365.25 * DAY);
    const events = [];
    for (const target of [0, 90, 180, 270]) {
      for (const p of aspectPasses("saturn", chart.lon.saturn, target, addDays(born, target === 0 ? 3650 : 365), end)) {
        events.push({ kind: "saturn", ...SATURN_STEPS[target], from: p.first, to: p.last, major: target === 0 });
      }
    }
    for (const p of aspectPasses("jupiter", chart.lon.jupiter, 0, addDays(born, 1500), end)) {
      events.push({ kind: "jupiter", ...JUPITER_RETURN, from: p.first, to: p.last });
    }
    OUTER.forEach((o) => {
      const at = new Date(born.getTime() + o.age * 365.25 * DAY);
      events.push({ kind: "outer", ...o, from: at, to: at, approx: true });
    });
    const value = events.sort((a, b) => a.from - b.from).map((e) => {
      const age = Math.floor(yearsBetween(born, e.from));
      const status = e.to < addDays(now, -180) ? "past" : e.from > addDays(now, 365) ? "future" : "now";
      return { ...e, age, status };
    });
    cycleCache = { key: chart.seed, value };
    return value;
  }

  // ---------- solar return (year ahead) ----------
  function solarReturnMoment(chart, year) {
    const [, mo, d] = chart.when.toISOString().slice(0, 10).split("-").map(Number);
    let t = Date.UTC(year, mo - 1, d, chart.when.getUTCHours(), chart.when.getUTCMinutes());
    for (let i = 0; i < 8; i++) {
      const delta = diff(Astro.longitudes(new Date(t)).sun, chart.lon.sun);
      t -= (delta / 0.98565) * DAY;
      if (Math.abs(delta) < 1e-5) break;
    }
    return new Date(t);
  }

  function currentSolarYear(chart, now = new Date()) {
    const y = now.getFullYear();
    return solarReturnMoment(chart, y) <= now ? y : y - 1;
  }

  const SR_HOUSE_THEME = FR ? FR_CONTENT.srHouseTheme : {
    1: "a personal reinvention year: your image, health and independence take center stage",
    2: "a money year: earning, saving and building self-worth",
    3: "a year of learning, writing, networking and short trips",
    4: "a home and family year: moving, renovating or strengthening roots",
    5: "a year of romance, creativity, children and joy",
    6: "a work and health year: routines, habits and getting organized",
    7: "a relationship year: partnerships, marriage and key agreements",
    8: "a transformation year: shared finances, investments and deep change",
    9: "a year of travel, study and expanding your worldview",
    10: "a career year: promotions, visibility and big professional moves",
    11: "a year of friends, networks, teamwork and long-term dreams",
    12: "a quiet, reflective year: rest, healing and finishing old chapters before a fresh start",
  };

  function yearAhead(chart, year) {
    const when = solarReturnMoment(chart, year);
    const lon = Astro.longitudes(when);
    const sign = (k) => Astro.signOf(lon[k]);
    const angles = chart.place ? Astro.angles(when, chart.place.lat, chart.place.lon) : null;
    const rising = angles ? Astro.signOf(angles.asc) : null;
    const base = rising !== null ? rising : chart.houseSign;
    const h = (s) => Reading.solarHouse(s, base);
    const sunH = h(sign("sun"));
    const hs = (k) => HOUSES[h(sign(k))].short;
    const themes = FR ? [
      { title: `Thème principal : Soleil dans votre ${ORD[sunH]} maison`, text: `C'est ${SR_HOUSE_THEME[sunH]}.` },
      { title: `Côté cœur : Lune en ${SIGNS[sign("moon")].name}, ${ORD[h(sign("moon"))]} maison`, text: `Votre cœur se tourne vers ${hs("moon")}. ${SIGNS[sign("moon")].moon}` },
      { title: `Croissance : Jupiter dans votre ${ORD[h(sign("jupiter"))]} maison`, text: `La chance et l'expansion passent par ${hs("jupiter")}. Dites oui ici.` },
      { title: `Effort : Saturne dans votre ${ORD[h(sign("saturn"))]} maison`, text: `Travail et patience sont nécessaires autour ${de(hs("saturn"))}. C'est là que se construisent des résultats durables.` },
      { title: `Amour : Vénus en ${SIGNS[sign("venus")].name}, ${ORD[h(sign("venus"))]} maison`, text: `La romance et le plaisir passent par ${hs("venus")}.` },
      { title: `Énergie : Mars dans votre ${ORD[h(sign("mars"))]} maison`, text: `Mettez votre énergie dans ${hs("mars")}.` },
    ] : [
      { title: `Main theme: Sun in your ${ORD[sunH]} house`, text: `This is ${SR_HOUSE_THEME[sunH]}.` },
      { title: `Emotional focus: Moon in ${SIGNS[sign("moon")].name}, ${ORD[h(sign("moon"))]} house`, text: `Your heart is drawn to ${hs("moon")}. ${SIGNS[sign("moon")].moon}` },
      { title: `Growth: Jupiter in your ${ORD[h(sign("jupiter"))]} house`, text: `Luck and expansion come through ${hs("jupiter")}. Say yes here.` },
      { title: `Effort: Saturn in your ${ORD[h(sign("saturn"))]} house`, text: `Hard work and patience are needed around ${hs("saturn")}. This is where lasting results get built.` },
      { title: `Love: Venus in ${SIGNS[sign("venus")].name}, ${ORD[h(sign("venus"))]} house`, text: `Romance and pleasure flow through ${hs("venus")}.` },
      { title: `Drive: Mars in your ${ORD[h(sign("mars"))]} house`, text: `Put your energy into ${hs("mars")}.` },
    ];
    if (rising !== null) themes.unshift({ title: t(`Year rising: ${SIGNS[rising].name}`, `Ascendant de l'année : ${SIGNS[rising].name}`), text: t(`The year's overall tone. ${RISING[rising]}`, `La tonalité générale de l'année. ${RISING[rising]}`) });
    const months = Destiny.luckyMonths(chart, when);
    const retros = Reading.retrogrades(when, new Date(when.getTime() + 365 * DAY));
    const [, bm, bd] = chart.when.toISOString().slice(0, 10).split("-").map(Number);
    const py = Destiny.reduce(Destiny.reduce(bm).value + Destiny.reduce(bd).value + Destiny.reduce(year).value).value;
    return { year, when, rising, themes, months, retros, personalYear: py, approx: rising === null, sunH };
  }

  // ---------- retrogrades and eclipses ----------
  const meanNode = (date) => norm(125.0445 - 0.0529538083 * (date.getTime() / DAY + 2440587.5 - 2451545));
  function eclipses(from, to) {
    return Astro.phaseEvents(from, to).filter((e) => e.quarter === 0 || e.quarter === 2).flatMap((e) => {
      const sun = Astro.longitudes(e.date).sun;
      const node = meanNode(e.date);
      const dist = Math.min(Math.abs(diff(sun, node)), Math.abs(diff(sun, node + 180)));
      const solar = e.quarter === 0;
      if (dist > (solar ? 16 : 17)) return [];
      const sign = Astro.signOf(e.moonLon);
      return [{ date: e.date, type: solar ? "solar" : "lunar", sign, minor: !solar && dist > 11.5 }];
    });
  }

  const RETRO_CHECK = FR ? FR_CONTENT.retroCheck : {
    mercury: ["Back up phones and computers", "Reread messages and contracts before sending or signing", "Allow extra travel time and confirm bookings", "Good time to revise, edit and reconnect with old contacts"],
    venus: ["Delay big beauty changes or luxury purchases", "Reflect on what you want in love and money", "Old flames may return: decide calmly"],
    mars: ["Avoid starting fights or risky new ventures", "Rework existing plans instead of launching", "Be careful with sharp tools, driving and exercise"],
  };
  const ECLIPSE_CHECK = FR ? FR_CONTENT.eclipseCheck : {
    solar: ["Write intentions for a fresh start in this life area", "Expect sudden beginnings: stay flexible", "Wait a few days before major launches while the energy settles"],
    lunar: ["Let go of what's finished in this life area", "Expect endings or revelations", "Avoid big emotional decisions on the day itself"],
  };

  function planner(chart, from = new Date(), days = 365) {
    const to = addDays(from, days);
    const retro = Reading.retrogrades(from, to).map((r) => ({
      kind: "retro", planet: r.planet, from: r.from, to: r.to,
      sign: Astro.signOf(Astro.longitudes(noon(r.from < from ? from : r.from))[r.planet]),
      check: RETRO_CHECK[r.planet],
    }));
    retro.forEach((r) => (r.house = house(r.sign, chart)));
    const ecl = eclipses(from, to).map((e) => ({ kind: "eclipse", ...e, house: house(e.sign, chart), check: ECLIPSE_CHECK[e.type] }));
    return [...retro, ...ecl].sort((a, b) => (a.from || a.date) - (b.from || b.date));
  }

  // iCalendar file for retrogrades, eclipses and life milestones.
  function ics(events) {
    const d = (x) => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
    const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const clean = (s) => String(s).replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Celestial Reading//EN", "CALSCALE:GREGORIAN"];
    events.forEach((e, i) => {
      const start = e.start, end = addDays(e.end || e.start, 1);
      lines.push("BEGIN:VEVENT", `UID:celestial-${d(start)}-${i}@celestial-reading`, `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${d(start)}`, `DTEND;VALUE=DATE:${d(end)}`, `SUMMARY:${clean(e.title)}`, `DESCRIPTION:${clean(e.text)}`,
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${clean(e.title)}`, "END:VALARM", "END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  // ---------- career timing ----------
  const ACTIVITIES = {
    interview: { label: t("Job interviews & meetings", FR_CONTENT.activities.interview), icon: "◎", hours: ["sun", "mercury", "jupiter"] },
    raise: { label: t("Asking for a raise or negotiating pay", FR_CONTENT.activities.raise), icon: "◆", hours: ["jupiter", "venus", "sun"] },
    launch: { label: t("Launching a business or project", FR_CONTENT.activities.launch), icon: "▲", hours: ["jupiter", "sun", "mars"] },
    contract: { label: t("Signing contracts", FR_CONTENT.activities.contract), icon: "✎", hours: ["mercury", "jupiter", "venus"] },
  };

  function careerTiming(chart, place, from = new Date(), days = 60) {
    const DAY_RULER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
    const info = Array.from({ length: days }, (_, i) => {
      const d = noon(addDays(from, i));
      const L = Astro.longitudes(d);
      const moon = Astro.signOf(L.moon);
      return {
        date: d, mh: house(moon, chart), ph: Astro.phase(d).index, ruler: DAY_RULER[d.getDay()],
        mercRx: Astro.isRetrograde("mercury", d), marsRx: Astro.isRetrograde("mars", d),
        scores: Reading.dayScores(chart, d), weekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
    const waxing = (x) => x.ph >= 1 && x.ph <= 3;
    const score = {
      interview: (x) => ([10, 1, 6].includes(x.mh) ? 1.5 : 0) + (["sun", "mercury"].includes(x.ruler) ? 0.5 : 0) + (x.mercRx ? -1 : 0.5) + (waxing(x) ? 0.5 : 0) + x.scores.career / 2,
      raise: (x) => ([2, 10].includes(x.mh) ? 1.5 : 0) + (["jupiter", "venus"].includes(x.ruler) ? 1 : 0) + (waxing(x) ? 0.5 : 0) + x.scores.money / 2,
      launch: (x) => (waxing(x) ? 1.5 : x.ph === 0 ? 1 : 0) + ([1, 10, 11].includes(x.mh) ? 1 : 0) + (x.mercRx ? -2 : 0) + (x.marsRx ? -1 : 0) + (["jupiter", "sun"].includes(x.ruler) ? 0.5 : 0) + x.scores.career / 2,
      contract: (x) => (x.mercRx ? -3 : 0.5) + ([3, 7, 10].includes(x.mh) ? 1 : 0) + (["mercury", "jupiter"].includes(x.ruler) ? 0.5 : 0) + x.scores.career / 3,
    };
    return Object.entries(ACTIVITIES).map(([key, a]) => {
      const picks = info.filter((x) => !x.weekend || key === "launch")
        .map((x) => ({ ...x, s: score[key](x) }))
        .sort((p, q) => q.s - p.s).slice(0, 3).sort((p, q) => p.date - q.date)
        .map((x) => {
          const ph = Destiny.planetaryHours(chart, x.date, place);
          const hrs = ph.hours.filter((h) => h.from.getHours() >= 8 && h.from.getHours() < 18 && a.hours.includes(h.planet));
          const hour = hrs.sort((p, q) => q.score - p.score)[0] || ph.best[0];
          const why = [];
          if (key === "contract" || key === "interview") why.push(x.mercRx ? t("Mercury retrograde", "Mercure rétrograde") : t("Mercury direct", "Mercure direct"));
          why.push(t(`Moon in your ${ORD[x.mh]} house`, `Lune dans votre ${ORD[x.mh]} maison`));
          if (waxing(x)) why.push(t("waxing Moon", "Lune croissante"));
          return { date: x.date, hour, why: why.join(" · ") };
        });
      const mercWarn = key === "contract" && info.some((x) => x.mercRx);
      return { key, ...a, picks, note: mercWarn ? t("Mercury is retrograde for part of this window, so those days are skipped for contracts.", "Mercure est rétrograde pendant une partie de cette période : ces jours sont exclus pour les contrats.") : "" };
    });
  }

  // ---------- money style ----------
  const MONEY_STYLE = FR ? FR_CONTENT.moneyStyle : {
    Fire: { name: "The Bold Earner", text: "You make money through initiative, courage and going after opportunities. You can earn fast, and spend fast too.",
      blind: "Impulse purchases and risky bets when you're bored or excited.",
      tips: ["Use a 48-hour rule before any non-essential purchase", "Automate savings on payday so it happens before you can spend it", "Put a fixed share of income into long-term investing so your risk appetite works for you"] },
    Earth: { name: "The Steady Builder", text: "You save naturally, value quality and build wealth slowly and surely. Security matters more to you than flash.",
      blind: "Being so cautious that your money doesn't grow, or holding on to things out of fear.",
      tips: ["Move savings beyond a basic account into long-term growth", "Budget a guilt-free amount for enjoyment", "Review your net worth once a year to see your progress"] },
    Air: { name: "The Smart Trader", text: "You earn through ideas, contacts and communication, often from more than one income stream.",
      blind: "Scattered finances: forgotten subscriptions, too many small projects, no single plan.",
      tips: ["Track everything in one simple spreadsheet or app", "Cancel subscriptions you haven't used in 30 days", "Focus on your two best income streams"] },
    Water: { name: "The Security Seeker", text: "Your money is tied to your emotions. You're generous with loved ones and feel safest with a cushion behind you.",
      blind: "Spending to soothe your mood, or lending money you can't afford to lose.",
      tips: ["Build an emergency fund covering 3–6 months of expenses", "Set a clear limit for lending to family and friends", "Notice your mood before you shop"] },
  };

  function moneyStyle(chart) {
    const second = (chart.houseSign + 1) % 12, eighth = (chart.houseSign + 7) % 12;
    const el = SIGNS[second].element;
    return {
      ...MONEY_STYLE[el], element: el, second, eighth,
      venus: t(`With Venus in ${SIGNS[chart.signs.venus].name}, you love spending on things connected to ${SIGNS[chart.signs.venus].domain}.`,
        `Avec Vénus en ${SIGNS[chart.signs.venus].name}, vous aimez dépenser pour ce qui touche ${au(SIGNS[chart.signs.venus].domain)}.`),
      jupiter: t(`Jupiter in ${SIGNS[chart.signs.jupiter].name} shows where money grows most easily: ${SIGNS[chart.signs.jupiter].domain}.`,
        `Jupiter en ${SIGNS[chart.signs.jupiter].name} montre où l'argent fructifie le plus facilement : ${SIGNS[chart.signs.jupiter].domain}.`),
      saturn: t(`Saturn in ${SIGNS[chart.signs.saturn].name} is your money lesson: discipline around ${SIGNS[chart.signs.saturn].domain} pays off over time.`,
        `Saturne en ${SIGNS[chart.signs.saturn].name} est votre leçon d'argent : la discipline autour ${de(SIGNS[chart.signs.saturn].domain)} paie avec le temps.`),
      shared: t(`Your 8th house of shared money is ${SIGNS[eighth].name}: you handle loans, investments and joint finances ${SIGNS[eighth].style}.`,
        `Votre 8e maison, celle de l'argent partagé, est en ${SIGNS[eighth].name} : vous gérez prêts, placements et finances communes ${SIGNS[eighth].style}.`),
      approx: chart.rising === null,
    };
  }

  // ---------- compatibility (synastry) ----------
  const FIT = [1, -0.25, 1, -0.75, 1.5, -0.5, 0.75];
  const ELEMENT_PAIR = FR ? FR_CONTENT.elementPair : {
    "Fire-Fire": "Two fires make a passionate, energetic match. Keep competition playful.",
    "Fire-Air": "Air feeds fire: lots of fun, ideas and adventure together.",
    "Fire-Earth": "Fire brings excitement and earth brings stability. You need patience with each other's pace.",
    "Fire-Water": "Steam: deep passion, but fire's directness can hurt water's feelings. Speak gently.",
    "Earth-Earth": "Solid and loyal. You build a secure life together; add some spontaneity.",
    "Earth-Air": "Earth grounds air's ideas and air lightens earth. Respect your different needs.",
    "Earth-Water": "A naturally nurturing match: water softens earth and earth protects water.",
    "Air-Air": "Best friends who never run out of things to talk about. Make sure feelings get airtime too.",
    "Air-Water": "Head meets heart. Air learns to feel and water learns to talk. It takes effort but grows you both.",
    "Water-Water": "Deep emotional understanding, almost telepathic. Watch out for shared moodiness.",
  };
  const TIPS = FR ? FR_CONTENT.tips : {
    attraction: "Keep romance alive with regular dates and physical affection. Chemistry needs tending here.",
    communication: "Slow down conversations, repeat back what you heard, and don't assume. You process information differently.",
    emotional: "Ask what the other needs when they're upset. You comfort yourselves in different ways.",
    longterm: "Agree on shared goals early (money, home, family) and check in on them every few months.",
  };

  function synastry(a, b) {
    const f = (x, y) => FIT[signDist(a.signs[x], b.signs[y])];
    const g = (x, y) => FIT[signDist(b.signs[x], a.signs[y])];
    const pct = (v) => Math.max(15, Math.min(98, Math.round(55 + 30 * v)));
    const cats = {
      attraction: { label: t("Attraction & chemistry", "Attirance et alchimie"), v: (f("venus", "mars") + g("venus", "mars") + 0.5 * f("venus", "venus")) / 2.5 },
      communication: { label: t("Communication", "Communication"), v: (f("mercury", "mercury") + 0.5 * f("mercury", "sun") + 0.5 * g("mercury", "sun")) / 2 },
      emotional: { label: t("Emotional bond", "Lien émotionnel"), v: (f("moon", "moon") + f("sun", "moon") + g("sun", "moon")) / 3 },
      longterm: { label: t("Long-term stability", "Stabilité à long terme"), v: (f("sun", "sun") + 0.5 * f("saturn", "sun") + 0.5 * g("saturn", "sun") + 0.5 * f("jupiter", "sun") + 0.5 * g("jupiter", "sun")) / 3 },
    };
    Object.values(cats).forEach((c) => (c.pct = pct(c.v)));
    const overall = Math.round(Object.values(cats).reduce((s, c) => s + c.pct, 0) / 4);
    const ea = SIGNS[a.signs.sun].element, eb = SIGNS[b.signs.sun].element;
    const order = ["Fire", "Earth", "Air", "Water"];
    const pairKey = [ea, eb].sort((x, y) => order.indexOf(x) - order.indexOf(y)).join("-");
    const la = Destiny.single(a.lifePath.number), lb = Destiny.single(b.lifePath.number);
    const groups = [[1, 5, 7], [2, 4, 8], [3, 6, 9]];
    const sameGroup = groups.some((gp) => gp.includes(la) && gp.includes(lb));
    const ranked = Object.entries(cats).sort((x, y) => y[1].pct - x[1].pct);
    return {
      overall, cats, elements: ELEMENT_PAIR[pairKey],
      strengths: ranked.filter(([, c]) => c.pct >= 65).map(([, c]) => c.label),
      friction: ranked.filter(([, c]) => c.pct < 50).map(([, c]) => c.label),
      tips: ranked.slice(-2).map(([k]) => TIPS[k]),
      lifePath: la === lb ? t(`You share Life Path ${la}: you understand each other's purpose instinctively.`, `Vous partagez le chemin de vie ${la} : vous comprenez instinctivement la mission de l'autre.`)
        : sameGroup ? t(`Life Paths ${la} and ${lb} are in the same number family: an easy, natural rhythm.`, `Les chemins de vie ${la} et ${lb} sont de la même famille de nombres : un rythme naturel et facile.`)
        : t(`Life Paths ${la} and ${lb} come from different number families: you complement each other but see life differently.`, `Les chemins de vie ${la} et ${lb} viennent de familles de nombres différentes : vous vous complétez mais voyez la vie autrement.`),
      verdict: overall >= 75 ? t("A naturally strong match", "Une entente naturellement forte") : overall >= 60 ? t("A good match with real potential", "Une belle entente au vrai potentiel") : overall >= 48 ? t("A workable match that takes effort", "Une entente possible qui demande des efforts") : t("A challenging match that will need lots of understanding", "Une entente difficile qui demandera beaucoup de compréhension"),
    };
  }

  return { lifeCycles, yearAhead, currentSolarYear, planner, ics, careerTiming, moneyStyle, synastry };
})();
