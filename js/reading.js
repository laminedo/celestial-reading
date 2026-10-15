// Builds natal profiles and daily / weekly / monthly readings from planet positions.

const Reading = (() => {
  const DAY = Astro.DAY;
  const ORD = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];
  const PLANET_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];

  // ---------- helpers ----------
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = hash(seed);
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  function pickN(r, arr, n) {
    const copy = [...arr], out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(r() * copy.length), 1)[0]);
    return out;
  }
  const signDistance = (a, b) => { const d = (((a - b) % 12) + 12) % 12; return Math.min(d, 12 - d); };
  const aspectScore = (a, b) => ASPECTS[signDistance(a, b)].score;
  const solarHouse = (transitSign, sunSign) => ((((transitSign - sunSign) % 12) + 12) % 12) + 1;
  const noon = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmt = (d, opts = { month: "short", day: "numeric" }) => d.toLocaleDateString(undefined, opts);
  const weekday = (d) => d.toLocaleDateString(undefined, { weekday: "short" });
  const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const signsAt = (date) => {
    const L = Astro.longitudes(date);
    return Object.fromEntries(PLANET_KEYS.map((k) => [k, Astro.signOf(L[k])]));
  };
  const houseLine = (planet, house) => `your ${ORD[house]} house of ${HOUSES[house].name.toLowerCase()}`;

  // Wall-clock time in an IANA time zone → the matching UTC instant (handles historic DST).
  function tzOffsetMs(timeZone, utcMs) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
    }).formatToParts(new Date(utcMs)).map((p) => [p.type, Number(p.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - utcMs;
  }
  function zonedToUtc(y, mo, d, hh, mm, timeZone) {
    const guess = Date.UTC(y, mo - 1, d, hh, mm);
    try {
      const first = guess - tzOffsetMs(timeZone, guess);
      return new Date(guess - tzOffsetMs(timeZone, first));
    } catch {
      return new Date(y, mo - 1, d, hh, mm); // unknown zone: fall back to device time
    }
  }

  // ---------- natal chart ----------
  function natal(birth) {
    const [y, mo, d] = birth.date.split("-").map(Number);
    const [hh, mm] = (birth.time || "12:00").split(":").map(Number);
    const place = birth.place || null;
    let when;
    if (birth.tz !== "auto") when = new Date(Date.UTC(y, mo - 1, d, hh, mm) - Number(birth.tz) * 3600000);
    else if (place && place.timezone) when = zonedToUtc(y, mo, d, hh, mm, place.timezone);
    else when = new Date(y, mo - 1, d, hh, mm);
    const lon = Astro.longitudes(when);
    const signs = Object.fromEntries(PLANET_KEYS.map((k) => [k, Astro.signOf(lon[k])]));

    // Rising sign and whole-sign houses need both a birth time and a birthplace.
    const angles = place && birth.time ? Astro.angles(when, place.lat, place.lon) : null;
    const rising = angles ? Astro.signOf(angles.asc) : null;
    const houseSign = angles ? rising : signs.sun;
    const houses = Object.fromEntries(PLANET_KEYS.map((k) => [k, solarHouse(signs[k], houseSign)]));
    const retro = Object.fromEntries(["mercury", "venus", "mars", "jupiter", "saturn"].map((k) => [k, Astro.isRetrograde(k, when)]));

    // Cusp warnings when birth time is unknown.
    const notes = [];
    if (place && !place.timezone && birth.tz === "auto") notes.push("Using this device's time zone for your birth time. Choose your birth time zone for an exact chart.");
    if (!place) notes.push("Add your birth city and time to reveal your rising sign and make your house readings precise.");
    else if (!birth.time) notes.push("Add your birth time to reveal your rising sign — it changes about every two hours.");
    if (!birth.time) {
      const moonDeg = Astro.degreeInSign(lon.moon);
      if (moonDeg < 6.6 || moonDeg > 23.4) {
        const other = moonDeg < 15 ? (signs.moon + 11) % 12 : (signs.moon + 1) % 12;
        notes.push(`Without a birth time your Moon could also be in ${SIGNS[other].name}. Add your birth time for a precise Moon sign.`);
      }
      const sunDeg = Astro.degreeInSign(lon.sun);
      if (sunDeg < 0.6 || sunDeg > 29.4) notes.push("You were born on a cusp — your Sun sign depends on your exact birth time.");
    }

    // Element balance across the seven classical planets.
    const elements = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
    PLANET_KEYS.forEach((k) => { elements[SIGNS[signs[k]].element] += k === "sun" || k === "moon" ? 2 : 1; });
    const dominant = Object.entries(elements).sort((a, b) => b[1] - a[1])[0][0];

    // Life path number.
    let n = birth.date.replace(/-/g, "").split("").reduce((s, c) => s + Number(c), 0);
    while (n > 9 && ![11, 22, 33].includes(n)) n = String(n).split("").reduce((s, c) => s + Number(c), 0);

    // Chinese zodiac (solar-term boundary around Feb 4).
    const cy = mo < 2 || (mo === 2 && d < 4) ? y - 1 : y;
    const animal = CHINESE[(((cy - 4) % 12) + 12) % 12];
    const cElement = CHINESE_ELEMENTS[((cy % 10) + 10) % 10];

    // Major aspects between natal planets (for the chart wheel).
    const aspects = [];
    const ASP = [[0, "conj"], [60, "soft"], [90, "hard"], [120, "soft"], [180, "hard"]];
    for (let i = 0; i < PLANET_KEYS.length; i++) {
      for (let j = i + 1; j < PLANET_KEYS.length; j++) {
        const sep = Math.abs(Astro.norm(lon[PLANET_KEYS[i]] - lon[PLANET_KEYS[j]] + 180) - 180);
        for (const [angle, kind] of ASP) {
          if (Math.abs(sep - angle) <= 6 && kind !== "conj") aspects.push({ a: PLANET_KEYS[i], b: PLANET_KEYS[j], kind });
        }
      }
    }

    return {
      name: birth.name, when, lon, signs, retro, notes, elements, dominant, aspects,
      place, angles, rising, houseSign, houses,
      lifePath: { number: n, title: LIFE_PATH[n][0], text: LIFE_PATH[n][1] },
      chinese: { animal: animal[0], traits: animal[1], element: cElement, year: cy },
      seed: `${birth.date}|${birth.time || ""}`,
    };
  }

  function placementText(key, chart) {
    const base = signText(key, chart);
    if (chart.rising === null) return base;
    return `${base} Placed in your ${ORD[chart.houses[key]]} house, it plays out through ${HOUSES[chart.houses[key]].short}.`;
  }

  function signText(key, chart) {
    const s = SIGNS[chart.signs[key]];
    const rx = chart.retro[key] ? " It was retrograde when you were born, so this energy turns inward first — you think before you show it." : "";
    switch (key) {
      case "sun": return s.summary;
      case "moon": return s.moon;
      case "mercury": return `You think and communicate ${s.style}. Conversations and learning work best for you when they engage ${s.domain}.${rx}`;
      case "venus": return `In love you give and receive ${s.style}. You're attracted to people and experiences that reflect ${s.domain}.${rx}`;
      case "mars": return `You chase goals ${s.style}. Your drive is fueled by ${s.domain} — channel it there and you're unstoppable.${rx}`;
      case "jupiter": return `Luck and growth find you through ${s.domain}. Saying yes in this area tends to open doors.${rx}`;
      case "saturn": return `Your long-term lessons revolve around ${s.domain}. It may feel hard early on, but this becomes an area of real mastery with time.${rx}`;
    }
  }

  // ---------- day scoring ----------
  function dayScores(chart, date) {
    const t = signsAt(noon(date));
    const n = chart.signs;
    const r = rng(`${chart.seed}|score|${dateKey(date)}`);
    const j = () => (r() - 0.5) * 0.8;
    const clamp = (x) => Math.max(1, Math.min(5, x));
    return {
      transit: t,
      love: clamp(3 + aspectScore(t.moon, n.venus) + 0.6 * aspectScore(t.venus, n.sun) + j()),
      career: clamp(3 + 0.8 * aspectScore(t.moon, n.sun) + 0.6 * aspectScore(t.mars, n.sun) + 0.4 * aspectScore(t.saturn, n.sun) + j()),
      wellness: clamp(3 + aspectScore(t.moon, n.mars) + 0.6 * aspectScore(t.mars, n.sun) + j()),
      money: clamp(3 + 0.6 * aspectScore(t.moon, n.venus) + 0.6 * aspectScore(t.jupiter, n.sun) + 0.4 * aspectScore(t.moon, n.jupiter) + j()),
    };
  }
  const total = (s) => s.love + s.career + s.wellness + s.money;

  function areaText(r, key, value) {
    const band = value >= 3.75 ? "high" : value >= 2.5 ? "mid" : "low";
    return pick(r, AREAS[key][band]);
  }
  function areas(r, scores, extra = {}) {
    return Object.keys(AREAS).map((k) => ({
      key: k, label: AREAS[k].label, icon: AREAS[k].icon,
      rating: Math.round(scores[k] * 2) / 2,
      text: areaText(r, k, scores[k]) + (extra[k] ? " " + extra[k] : ""),
    }));
  }
  function average(list) {
    const out = { love: 0, career: 0, wellness: 0, money: 0 };
    list.forEach((s) => Object.keys(out).forEach((k) => (out[k] += s[k] / list.length)));
    return out;
  }

  // Retrograde periods overlapping a window.
  function retrogrades(start, end) {
    const out = [];
    for (const p of ["mercury", "venus", "mars"]) {
      const scanStart = addDays(start, -90), scanEnd = addDays(end, 90);
      const ev = Astro.planetEvents(p, scanStart, scanEnd).filter((e) => e.type.startsWith("station"));
      let from = Astro.isRetrograde(p, noon(scanStart)) ? scanStart : null;
      for (const e of ev) {
        if (e.type === "station-retro") from = e.date;
        else if (from) { out.push({ planet: p, from, to: e.date }); from = null; }
      }
      if (from) out.push({ planet: p, from, to: null });
    }
    return out.filter((x) => x.from < end && (!x.to || x.to >= start));
  }
  const retroAdvice = {
    mercury: "double-check plans, back up files and reread messages before sending. Great for revisiting, revising and reconnecting — less so for signing contracts or buying tech.",
    venus: "old flames and past values resurface. Reflect on what you truly want in love and money before making big changes.",
    mars: "energy turns inward. Rework existing plans rather than starting fights or launching big new ventures.",
  };
  function retroNotes(start, end, chart) {
    return retrogrades(start, end).map((x) => {
      const sign = SIGNS[Astro.signOf(Astro.longitudes(noon(x.from > start ? x.from : start))[x.planet])];
      const house = solarHouse(SIGNS.indexOf(sign), chart.houseSign);
      const range = `${fmt(x.from)} – ${x.to ? fmt(x.to) : "later"}`;
      return {
        planet: x.planet,
        title: `${PLANETS[x.planet].name} retrograde in ${sign.name}`,
        range,
        text: `Through ${houseLine(x.planet, house)}: ${retroAdvice[x.planet]}`,
      };
    });
  }

  // ---------- daily ----------
  function daily(chart, date) {
    const d = noon(date);
    const r = rng(`${chart.seed}|daily|${dateKey(d)}`);
    const scores = dayScores(chart, d);
    const t = scores.transit;
    const moonHouse = solarHouse(t.moon, chart.houseSign);
    const H = HOUSES[moonHouse];
    const ph = Astro.phase(d);
    const phaseInfo = PHASES[ph.index];
    const endSign = Astro.signOf(Astro.longitudes(new Date(d.getTime() + 11 * 3600000)).moon);
    const startSign = Astro.signOf(Astro.longitudes(new Date(d.getTime() - 12 * 3600000)).moon);
    const asp = ASPECTS[signDistance(t.moon, chart.signs.sun)];
    const marsHouse = solarHouse(t.mars, chart.houseSign);

    let moonLine = `The Moon is in ${SIGNS[t.moon].name}, moving through your ${ORD[moonHouse]} house of ${H.name.toLowerCase()} — today's focus is ${H.short}.`;
    if (endSign !== t.moon) moonLine += ` Later today it slips into ${SIGNS[endSign].name}, shifting the mood toward ${HOUSES[solarHouse(endSign, chart.houseSign)].short}.`;
    else if (startSign !== t.moon) moonLine = moonLine.replace("The Moon is in", "The Moon entered " + SIGNS[t.moon].name + " overnight. It's now in");

    const overview = [moonLine, asp.moon, `It's a ${phaseInfo.name} (${ph.illumination}% illuminated): ${phaseInfo.action.charAt(0).toLowerCase() + phaseInfo.action.slice(1)}`].join(" ");

    const todo = [...pickN(r, H.do, 3), phaseInfo.action];
    if (marsHouse !== moonHouse) todo.push(`Channel extra energy into ${HOUSES[marsHouse].short} — Mars is fueling that part of your life.`);
    const avoid = pickN(r, H.avoid, 2);
    if (asp.score < 0) avoid.push("Overreacting to small frustrations — they'll pass with the Moon.");

    const element = SIGNS[t.moon].element;
    return {
      kind: "daily",
      label: fmt(d, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      headline: H.headline,
      overview,
      moon: { sign: SIGNS[t.moon], phase: phaseInfo, illumination: ph.illumination, house: moonHouse },
      areas: areas(r, scores),
      todo, avoid,
      lucky: {
        number: 1 + Math.floor(r() * 99),
        color: pick(r, ELEMENT_INFO[element].colors),
        time: `${pick(r, [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20])}:00`,
      },
      notes: retroNotes(d, addDays(d, 1), chart),
    };
  }

  // ---------- weekly ----------
  function weekStart(date) {
    const d = noon(date);
    return addDays(d, -((d.getDay() + 6) % 7));
  }

  function weekly(chart, date) {
    const start = weekStart(date);
    const end = addDays(start, 7);
    const r = rng(`${chart.seed}|weekly|${dateKey(start)}`);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const s = dayScores(chart, d);
      return { date: d, scores: s, moonSign: s.transit.moon, house: solarHouse(s.transit.moon, chart.houseSign) };
    });
    const t = signsAt(addDays(start, 3));
    const hs = Object.fromEntries(["sun", "mercury", "venus", "mars"].map((k) => [k, solarHouse(t[k], chart.houseSign)]));
    const ranked = [...days].sort((a, b) => total(b.scores) - total(a.scores));
    const best = ranked.slice(0, 2).sort((a, b) => a.date - b.date);
    const tough = ranked[ranked.length - 1];

    const events = Astro.phaseEvents(start, end).map((e) => {
      const sign = Astro.signOf(e.moonLon);
      const house = solarHouse(sign, chart.houseSign);
      return { date: e.date, phase: PHASES[e.phaseIndex], sign: SIGNS[sign], house,
        text: `${PHASES[e.phaseIndex].action} Focus it on ${HOUSES[house].short}.` };
    });
    const ingresses = ["sun", "mercury", "venus", "mars"].flatMap((p) => Astro.planetEvents(p, start, addDays(end, -1)))
      .filter((e) => e.type === "ingress")
      .map((e) => ({ date: e.date, text: `${PLANETS[e.planet].name} enters ${SIGNS[e.sign].name} — your ${ORD[solarHouse(e.sign, chart.houseSign)]} house of ${HOUSES[solarHouse(e.sign, chart.houseSign)].name.toLowerCase()}.` }));

    const H = HOUSES[hs.sun];
    const overview = [
      `This week the Sun spotlights ${houseLine("sun", hs.sun)}, so ${H.short} take priority.`,
      hs.mercury === hs.venus
        ? `Mercury and Venus both gather around ${HOUSES[hs.venus].short}, and Mars fires up ${HOUSES[hs.mars].short}.`
        : `Mercury focuses your thinking on ${HOUSES[hs.mercury].short}, Venus sweetens ${HOUSES[hs.venus].short}, and Mars fires up ${HOUSES[hs.mars].short}.`,
      `Your strongest days are ${best.map((b) => weekday(b.date)).join(" and ")}; take it easier on ${weekday(tough.date)}.`,
    ].join(" ");

    const todo = [
      pick(r, H.do),
      pick(r, HOUSES[hs.mars].do),
      pick(r, HOUSES[hs.venus].do),
      pick(r, HOUSES[hs.mercury].do),
      ...events.filter((e) => e.phase.name === "New Moon" || e.phase.name === "Full Moon")
        .map((e) => `${weekday(e.date)}: ${e.phase.name} in ${e.sign.name} — ${e.phase.action.charAt(0).toLowerCase() + e.phase.action.slice(1)}`),
    ];
    const avoid = [pick(r, H.avoid), pick(r, HOUSES[days.find((d) => d.date === tough.date).house].avoid)];

    return {
      kind: "weekly",
      label: `${fmt(start, { month: "long", day: "numeric" })} – ${fmt(addDays(end, -1), { month: "long", day: "numeric", year: "numeric" })}`,
      headline: H.headline,
      overview,
      days: days.map((d) => ({ ...d, total: total(d.scores), best: best.includes(d), tough: d === tough })),
      areas: areas(r, average(days.map((d) => d.scores)), {
        love: `Venus in your ${ORD[hs.venus]} house points love toward ${HOUSES[hs.venus].short}.`,
        career: `Mars in your ${ORD[hs.mars]} house drives action around ${HOUSES[hs.mars].short}.`,
      }),
      todo: [...new Set(todo)], avoid: [...new Set(avoid)],
      events: [...events.map((e) => ({ date: e.date, title: `${e.phase.icon} ${e.phase.name} in ${e.sign.name}`, text: e.text })),
               ...ingresses.map((e) => ({ date: e.date, title: "Planet shift", text: e.text }))].sort((a, b) => a.date - b.date),
      notes: retroNotes(start, end, chart),
    };
  }

  // ---------- monthly ----------
  function monthly(chart, date) {
    const start = noon(new Date(date.getFullYear(), date.getMonth(), 1));
    const end = noon(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    const r = rng(`${chart.seed}|monthly|${dateKey(start)}`);
    const nDays = Math.round((end - start) / DAY);
    const days = Array.from({ length: nDays }, (_, i) => {
      const d = addDays(start, i);
      return { date: d, scores: dayScores(chart, d) };
    });
    const sunStart = signsAt(start).sun;
    const t = signsAt(addDays(start, 14));
    const sunH1 = solarHouse(sunStart, chart.houseSign);
    const sunEvents = Astro.planetEvents("sun", start, addDays(end, -1)).filter((e) => e.type === "ingress");
    const sunH2 = sunEvents.length ? solarHouse(sunEvents[0].sign, chart.houseSign) : null;
    const jH = solarHouse(t.jupiter, chart.houseSign);
    const sH = solarHouse(t.saturn, chart.houseSign);
    const vH = solarHouse(t.venus, chart.houseSign);
    const mH = solarHouse(t.mars, chart.houseSign);

    const lunar = Astro.phaseEvents(start, end).filter((e) => e.quarter === 0 || e.quarter === 2).map((e) => {
      const sign = Astro.signOf(e.moonLon);
      const house = solarHouse(sign, chart.houseSign);
      return { date: e.date, phase: PHASES[e.phaseIndex], sign: SIGNS[sign], house };
    });

    const birthday = (() => {
      const bd = new Date(chart.when);
      return bd.getMonth() === start.getMonth() ? noon(new Date(start.getFullYear(), bd.getMonth(), bd.getDate())) : null;
    })();

    const overview = [];
    overview.push(sunH2
      ? `The Sun lights up ${houseLine("sun", sunH1)} until ${fmt(sunEvents[0].date)}, then moves into ${houseLine("sun", sunH2)}. The month shifts from ${HOUSES[sunH1].short} to ${HOUSES[sunH2].short}.`
      : `All month the Sun lights up ${houseLine("sun", sunH1)} — ${HOUSES[sunH1].short} are your main stage.`);
    if (birthday) overview.push(`Happy solar return! Your birthday on ${fmt(birthday)} opens a brand-new personal year — set intentions you'll actually keep.`);
    overview.push(`Jupiter, the planet of luck, is expanding ${HOUSES[jH].short}, while Saturn asks for patience and maturity around ${HOUSES[sH].short}.`);

    const ranked = [...days].sort((a, b) => total(b.scores) - total(a.scores));
    const power = ranked.slice(0, 3).sort((a, b) => a.date - b.date);
    const tough = ranked.slice(-2).sort((a, b) => a.date - b.date);

    const todo = [...pickN(r, HOUSES[sunH1].do, 2)];
    if (sunH2) todo.push(pick(r, HOUSES[sunH2].do));
    lunar.forEach((l) => todo.push(`${fmt(l.date)} · ${l.phase.name} in ${l.sign.name}: ${l.phase.name === "New Moon" ? "start something new around" : "complete or release what's ready around"} ${HOUSES[l.house].short}.`));
    todo.push(pick(r, HOUSES[vH].do), pick(r, HOUSES[mH].do), `Lean into growth: ${pick(r, HOUSES[jH].do).toLowerCase()}.`);
    const avoid = [pick(r, HOUSES[sunH1].avoid), pick(r, HOUSES[sH].avoid)];

    const planetShifts = ["mercury", "venus", "mars"].flatMap((p) => Astro.planetEvents(p, start, addDays(end, -1)))
      .map((e) => {
        const h = solarHouse(e.sign, chart.houseSign);
        const P = PLANETS[e.planet].name;
        if (e.type === "ingress") return { date: e.date, title: `${P} enters ${SIGNS[e.sign].name}`, text: `Activates your ${ORD[h]} house: ${HOUSES[h].short}.` };
        if (e.type === "station-retro") return { date: e.date, title: `${P} turns retrograde`, text: "Slow down, review and revise." };
        return { date: e.date, title: `${P} turns direct`, text: "Stalled plans start moving again." };
      });

    const keyDates = [
      ...lunar.map((l) => ({ date: l.date, title: `${l.phase.icon} ${l.phase.name} in ${l.sign.name}`, text: `Your ${ORD[l.house]} house of ${HOUSES[l.house].name.toLowerCase()}.` })),
      ...sunEvents.map((e) => ({ date: e.date, title: `☉ Sun enters ${SIGNS[e.sign].name}`, text: `${SIGNS[e.sign].name} season begins.` })),
      ...planetShifts,
      ...power.map((p) => ({ date: p.date, title: "★ Power day", text: "Your best odds this month — schedule what matters." })),
      ...(birthday ? [{ date: birthday, title: "🎂 Your birthday", text: "Solar return — a fresh start." }] : []),
    ].sort((a, b) => a.date - b.date);

    return {
      kind: "monthly",
      label: fmt(start, { month: "long", year: "numeric" }),
      headline: HOUSES[sunH2 && nDays - new Date(sunEvents[0].date).getDate() > 15 ? sunH2 : sunH1].headline,
      overview: overview.join(" "),
      areas: areas(r, average(days.map((d) => d.scores)), {
        love: `Venus in your ${ORD[vH]} house draws affection through ${HOUSES[vH].short}.`,
        money: `Jupiter blesses ${HOUSES[jH].short}.`,
      }),
      todo: [...new Set(todo)], avoid: [...new Set(avoid)],
      keyDates,
      calendar: days.map((d) => ({ date: d.date, total: total(d.scores) })),
      power: power.map((p) => p.date), tough: tough.map((p) => p.date),
      notes: retroNotes(start, end, chart),
    };
  }

  return { natal, placementText, daily, weekly, monthly, ORD, PLANET_KEYS, solarHouse };
})();
