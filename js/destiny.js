// Career, partner, lucky timing (planetary hours, days, months, Jupiter years) and numerology.

const Destiny = (() => {
  const DAY = Astro.DAY;
  const ORD = Reading.ORD;
  const RAD = Math.PI / 180;
  const sind = (x) => Math.sin(x * RAD);
  const cosd = (x) => Math.cos(x * RAD);
  const noon = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const house = (sign, chart) => Reading.solarHouse(sign, chart.houseSign);
  const signDist = (a, b) => { const d = (((a - b) % 12) + 12) % 12; return Math.min(d, 12 - d); };

  // Traditional sign rulers.
  const RULER = ["mars", "venus", "mercury", "moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"];

  // ---------- content ----------
  const CAREER_FIELDS = [
    ["Entrepreneur or founder", "Sales and business development", "Emergency services, military or law enforcement", "Athletics, coaching or fitness", "Surgery or physical therapy", "Project launches and turnarounds"],
    ["Finance, banking or wealth management", "Real estate and property", "Food, hospitality or culinary arts", "Design, fashion or luxury goods", "Music and the arts", "Agriculture, landscaping or interiors"],
    ["Writing, journalism or publishing", "Marketing, PR and social media", "Teaching and training", "Technology and software", "Sales and brokerage", "Translation, travel or event hosting"],
    ["Healthcare, nursing or caregiving", "Hospitality and food", "Real estate and home services", "Education and childcare", "Counseling or social work", "Family business or heritage work"],
    ["Leadership and management", "Entertainment, acting or performance", "Brand building and personal media", "Creative direction or design", "Teaching or youth work", "Luxury, events and hospitality"],
    ["Healthcare, nutrition or medicine", "Data analysis, research or accounting", "Editing, quality control or operations", "Engineering and technical crafts", "Administration and organization", "Service-based small business"],
    ["Law, mediation or diplomacy", "Design, beauty, fashion or art", "Human resources and client relations", "Partnerships, agency or consulting", "Event planning and hospitality", "Marketing and brand image"],
    ["Investing, finance or insurance", "Psychology, therapy or healing", "Research, investigation or detective work", "Medicine or surgery", "Crisis management and turnaround", "Tax, estates or shared resources"],
    ["Higher education or teaching", "Travel, tourism or import/export", "Publishing, broadcasting or media", "Law, philosophy or spiritual leadership", "International business", "Coaching and motivational work"],
    ["Executive leadership and management", "Finance, banking or government", "Engineering, construction or architecture", "Law and regulation", "Building a long-term company", "Real estate development"],
    ["Technology, software or science", "Innovation, startups or product work", "Nonprofits and social causes", "Aviation, astronomy or engineering", "Community organizing and networks", "Consulting on future trends"],
    ["Arts, music, film or photography", "Healing, nursing or therapy", "Spiritual or charitable work", "Ocean, travel or hospitality", "Psychology and counseling", "Creative writing and storytelling"],
  ];

  const ELEMENT_WORK = {
    Fire: "You work best with momentum, visible goals and room to lead. Long stretches of routine drain you, so choose roles where you can start things and see results quickly.",
    Earth: "You work best where effort builds real, measurable value over time. Stability, clear expectations and tangible results bring out your best.",
    Air: "You work best around people and ideas: meetings, writing, problem-solving and networking. You need variety and mental stimulation to stay engaged.",
    Water: "You work best where empathy and intuition matter. Caring, creative or behind-the-scenes roles let you read people and situations better than anyone.",
  };

  const LP_WORK = {
    1: "Life Path 1 favors being your own boss or leading a team.",
    2: "Life Path 2 favors partnership roles: mediation, support and collaboration.",
    3: "Life Path 3 favors creative, expressive and public-facing work.",
    4: "Life Path 4 favors systems, structure and building things that last.",
    5: "Life Path 5 favors freedom, travel, sales and variety.",
    6: "Life Path 6 favors service, care, teaching and beautifying spaces.",
    7: "Life Path 7 favors research, analysis, expertise and specialist knowledge.",
    8: "Life Path 8 favors business, money management and authority.",
    9: "Life Path 9 favors humanitarian, artistic and teaching paths.",
    11: "Life Path 11 favors inspiring others: teaching, healing and creative vision.",
    22: "Life Path 22 favors large-scale building: organizations, institutions and big projects.",
    33: "Life Path 33 favors teaching, healing and guiding others.",
  };

  const PARTNER = [
    "brave, direct and full of energy: someone who takes initiative and keeps life exciting",
    "steady, loyal and affectionate: someone who shows love through presence, comfort and consistency",
    "witty, curious and talkative: someone who keeps you laughing and always has something new to discuss",
    "warm, nurturing and family-minded: someone who makes you feel safe and truly at home",
    "generous, confident and playful: someone proud to be with you and big-hearted in love",
    "thoughtful, reliable and helpful: someone who notices the small things and keeps life running smoothly",
    "charming, fair and romantic: someone who values partnership, harmony and beauty",
    "deep, loyal and intensely devoted: someone who wants real emotional and physical closeness",
    "adventurous, honest and optimistic: someone who brings travel, growth and big ideas into your life",
    "ambitious, mature and dependable: someone with goals, integrity and a long-term plan",
    "independent, open-minded and original: someone who is also your best friend and respects your freedom",
    "gentle, intuitive and compassionate: someone dreamy and kind who understands you without words",
  ];

  const HOME_NUMBERS = {
    1: ["Independence and new beginnings", "Great for starting a business, a career change or living solo. Ambition gets a boost here."],
    2: ["Partnership and peace", "Good for couples and harmony. A gentle, cooperative energy that supports relationships."],
    3: ["Joy, creativity and social life", "Good for entertaining, creative work and an optimistic home full of visitors."],
    4: ["Stability and hard work", "Good for building savings, raising a family and long-term security. Rewards discipline."],
    5: ["Change, freedom and adventure", "Good for travelers, sales people and anyone who loves variety. Expect a busy, lively home."],
    6: ["Love, family and comfort", "Seen as one of the best family homes: nurturing, beautiful and welcoming."],
    7: ["Reflection and wisdom", "Good for study, spiritual growth and a quiet life. Less focused on money."],
    8: ["Wealth, power and success", "Traditionally the wealth number. Good for business owners and building prosperity."],
    9: ["Generosity and completion", "Good for compassionate, creative and service-minded people. A warm, open-door home."],
  };

  // ---------- numerology ----------
  const digitSum = (n) => String(n).split("").reduce((s, c) => s + Number(c), 0);
  // Reduce to one digit and record the steps ("1472 → 1+4+7+2 = 14 → 1+4 = 5").
  function reduce(n, keepMaster = false) {
    const steps = [];
    let cur = n;
    while (cur > 9 && !(keepMaster && [11, 22, 33].includes(cur))) {
      const next = digitSum(cur);
      steps.push(`${String(cur).split("").join("+")} = ${next}`);
      cur = next;
    }
    return { value: cur, steps };
  }
  const letterValue = (ch) => ((ch.toUpperCase().charCodeAt(0) - 65) % 9) + 1; // A=1 … I=9, J=1 …
  const GROUPS = [[1, 5, 7], [2, 4, 8], [3, 6, 9]];
  const groupOf = (n) => GROUPS.find((g) => g.includes(n));
  const single = (n) => (n > 9 ? reduce(n).value : n);

  // Address → single digit. Uses the house number; optionally the apartment/unit and letters too.
  function addressNumber(text, { includeLetters = false } = {}) {
    const raw = String(text || "").trim();
    if (!raw) return null;
    const tokens = raw.match(/\d+[A-Za-z]?|\b[A-Za-z]\b/g) || [];
    let digits = "", letters = [];
    if (includeLetters) {
      for (const ch of raw) {
        if (/\d/.test(ch)) digits += ch;
        else if (/[A-Za-z]/.test(ch)) letters.push(ch);
      }
    } else {
      // House number = first number; a unit like "Apt 3B" / "#12" also counts.
      const unit = raw.match(/(?:apt|apartment|unit|suite|ste|#|flat)\.?\s*([0-9]+[A-Za-z]?|[A-Za-z])\b/i);
      const first = tokens.find((t) => /\d/.test(t));
      if (!first) return { error: "Include a house or building number, e.g. 1472 Maple St." };
      const parts = [first];
      if (unit && unit[1] !== first) parts.push(unit[1]);
      for (const p of parts) for (const ch of p) /\d/.test(ch) ? (digits += ch) : letters.push(ch);
    }
    const values = [...digits].map(Number).concat(letters.map(letterValue));
    if (!values.length) return { error: "Include a house or building number, e.g. 1472 Maple St." };
    const sum = values.reduce((a, b) => a + b, 0);
    const r = reduce(sum);
    const labels = [...digits].concat(letters.map((l) => `${l.toUpperCase()}(${letterValue(l)})`));
    return {
      value: r.value,
      work: [`${labels.join("+")} = ${sum}`, ...r.steps.slice(sum > 9 ? 0 : 1)].filter((s, i, a) => a.indexOf(s) === i),
      title: HOME_NUMBERS[r.value][0],
      text: HOME_NUMBERS[r.value][1],
    };
  }

  function matchHome(homeNum, chart, thing = "this home") {
    const lp = single(chart.lifePath.number);
    if (homeNum === lp) return { level: "great", label: "Perfect match", text: `It's the same as your Life Path number (${lp}), so ${thing} amplifies your natural strengths.` };
    if (groupOf(homeNum) === groupOf(lp)) return { level: "good", label: "Harmonious", text: `${homeNum} belongs to the same family as your Life Path ${lp} (${groupOf(lp).join(" · ")}), so it supports how you naturally live and work.` };
    if (homeNum === 8) return { level: "good", label: "Wealth booster", text: "Not in your number family, but 8 is the traditional number of money and business." };
    return { level: "ok", label: "Neutral", text: `Not in your number family (${groupOf(lp).join(" · ")}). It brings a different energy: workable, just not a natural amplifier.` };
  }

  function bestHomeNumbers(chart) {
    const lp = single(chart.lifePath.number);
    const list = [lp, ...groupOf(lp).filter((n) => n !== lp)];
    if (!list.includes(8)) list.push(8);
    return list.map((n) => ({ n, title: HOME_NUMBERS[n][0], examples: [n, n + 9, n + 18, n + 99].map(String) }));
  }

  function personalNumbers(chart, birth, today = new Date()) {
    const [, m, d] = birth.date.split("-").map(Number);
    const y = today.getFullYear();
    const py = reduce(digitSum(m) + digitSum(d) + digitSum(y)).value;
    const pm = reduce(py + today.getMonth() + 1).value;
    const pd = reduce(pm + today.getDate()).value;
    const name = (birth.name || "").replace(/[^A-Za-z]/g, "");
    const expression = name ? reduce([...name].reduce((s, ch) => s + letterValue(ch), 0), true).value : null;
    const sunLucky = SIGNS[chart.signs.sun].lucky.number;
    const set = [...new Set([chart.lifePath.number, d, sunLucky, py, expression].filter(Boolean))];
    return { lifePath: chart.lifePath.number, birthday: d, personalYear: py, personalMonth: pm, personalDay: pd, expression, sunLucky, set };
  }

  // ---------- career ----------
  function career(chart) {
    const mcSign = chart.angles ? Astro.signOf(chart.angles.mc) : null;
    const sun = chart.signs.sun;
    const tenthSign = chart.rising !== null ? (chart.rising + 9) % 12 : null;
    const in10 = chart.rising !== null ? Reading.PLANET_KEYS.filter((k) => chart.houses[k] === 10) : [];
    const in2 = chart.rising !== null ? Reading.PLANET_KEYS.filter((k) => chart.houses[k] === 2) : [];
    const primary = mcSign !== null ? mcSign : sun;
    const fields = [...new Set([
      ...CAREER_FIELDS[primary].slice(0, 3),
      ...CAREER_FIELDS[sun].slice(0, 3),
      ...CAREER_FIELDS[chart.signs.jupiter].slice(0, 2),
      ...CAREER_FIELDS[chart.signs.saturn].slice(0, 1),
    ])].slice(0, 8);

    const points = [];
    if (mcSign !== null) points.push({ title: `Midheaven in ${SIGNS[mcSign].name}`, text: `Your Midheaven is the top of your chart: the path you're known for. ${SIGNS[mcSign].name} here points you toward ${SIGNS[mcSign].domain}. ${SIGNS[mcSign].career}` });
    points.push({ title: `Sun in ${SIGNS[sun].name}`, text: SIGNS[sun].career });
    if (tenthSign !== null) {
      const ruler = RULER[tenthSign];
      points.push({ title: `${PLANETS[ruler].name} rules your career house`, text: `${SIGNS[tenthSign].name} sits on your 10th house, so ${PLANETS[ruler].name} (${PLANETS[ruler].role}) steers your career. It's in ${SIGNS[chart.signs[ruler]].name}, in your ${ORD[chart.houses[ruler]]} house: success comes through ${HOUSES[chart.houses[ruler]].short}.` });
    }
    if (in10.length) points.push({ title: `${in10.map((k) => PLANETS[k].name).join(" and ")} in your 10th house`, text: `Planets at the top of your chart make career a central theme of your life. ${in10.map((k) => `${PLANETS[k].name} brings ${PLANETS[k].role}`).join("; ")} into your public work.` });
    points.push({ title: `Mercury in ${SIGNS[chart.signs.mercury].name}`, text: `You think and work ${SIGNS[chart.signs.mercury].style}. Choose roles that use this.` });
    points.push({ title: `Mars in ${SIGNS[chart.signs.mars].name}`, text: `Your drive is strongest around ${SIGNS[chart.signs.mars].domain}: the kind of goals that keep you motivated.` });
    if (!(tenthSign !== null && RULER[tenthSign] === "saturn") && !in10.includes("saturn")) points.push({ title: `Saturn in ${SIGNS[chart.signs.saturn].name}`, text: `Your long-game mastery: ${SIGNS[chart.signs.saturn].domain}. Skills here take years to build but become your most valuable asset.` });

    const secondSign = chart.rising !== null ? (chart.rising + 1) % 12 : (sun + 1) % 12;
    const moneyRuler = RULER[secondSign];
    const money = {
      title: "How you earn best",
      text: `Your money house is ${SIGNS[secondSign].name}, ruled by ${PLANETS[moneyRuler].name}. You attract income through ${SIGNS[secondSign].domain}, and Jupiter in ${SIGNS[chart.signs.jupiter].name} brings luck through ${SIGNS[chart.signs.jupiter].domain}.${in2.length ? ` ${in2.map((k) => PLANETS[k].name).join(" and ")} in your 2nd house make earning a major life focus.` : ""}`,
    };

    return {
      fields, points, money,
      style: ELEMENT_WORK[chart.dominant],
      lp: LP_WORK[chart.lifePath.number],
      approx: mcSign === null,
    };
  }

  // ---------- partner ----------
  // Sign-to-sign harmony for relationships (opposites count as complementary).
  const LOVE_FIT = [1, -0.25, 1, -0.75, 1.5, -0.5, 1];
  function partner(chart) {
    const desc = chart.rising !== null ? (chart.rising + 6) % 12 : null;
    const n = chart.signs;
    const scored = SIGNS.map((s, i) => ({
      sign: i,
      score: 2 * LOVE_FIT[signDist(i, n.sun)] + 1.5 * LOVE_FIT[signDist(i, n.venus)] + 1.5 * LOVE_FIT[signDist(i, n.moon)]
        + LOVE_FIT[signDist(i, n.mars)] + (desc === i ? 2 : 0) + (SIGNS[n.sun].compatible.includes(s.name) ? 1 : 0),
    })).sort((a, b) => b.score - a.score);
    const best = scored.slice(0, 3).map((x) => x.sign);
    const challenge = scored.slice(-2).map((x) => x.sign);
    const lp = single(chart.lifePath.number);

    const points = [];
    if (desc !== null) points.push({ title: `Descendant in ${SIGNS[desc].name}`, text: `Your 7th house of partnership starts in ${SIGNS[desc].name}. You're drawn to, and grow most with, a partner who is ${PARTNER[desc]}.` });
    points.push({ title: `Venus in ${SIGNS[n.venus].name}`, text: `What attracts you: ${SIGNS[n.venus].style}. You fall for people who reflect ${SIGNS[n.venus].domain}.` });
    points.push({ title: `Mars in ${SIGNS[n.mars].name}`, text: `What sparks desire: energy that is ${PARTNER[n.mars].split(":")[0]}.` });
    points.push({ title: `Moon in ${SIGNS[n.moon].name}`, text: `What you need to feel safe: a partner who respects that ${SIGNS[n.moon].moon.charAt(0).toLowerCase() + SIGNS[n.moon].moon.slice(1)}` });

    const ideal = desc !== null ? PARTNER[desc] : PARTNER[n.venus];
    return {
      headline: `Someone ${ideal.split(":")[0]}`,
      ideal: `Your ideal partner is ${ideal}.`,
      points, best, challenge,
      lpMatch: { lp, numbers: groupOf(lp) },
      loveText: SIGNS[n.sun].love,
      approx: desc === null,
    };
  }

  // ---------- sunrise / sunset ----------
  function sunTimes(date, lat, lon) {
    const local = noon(date);
    const jd = local.getTime() / DAY + 2440587.5;
    const n = Math.round(jd - 2451545.0009 + lon / 360);
    const Js = n + 0.0009 - lon / 360;
    const M = (357.5291 + 0.98560028 * Js) % 360;
    const C = 1.9148 * sind(M) + 0.02 * sind(2 * M) + 0.0003 * sind(3 * M);
    const L = (M + C + 180 + 102.9372) % 360;
    const Jt = 2451545 + Js + 0.0053 * sind(M) - 0.0069 * sind(2 * L);
    const dec = Math.asin(sind(L) * sind(23.4397)) / RAD;
    const cosW = (sind(-0.833) - sind(lat) * sind(dec)) / (cosd(lat) * cosd(dec));
    const toDate = (j) => new Date((j - 2440587.5) * DAY);
    if (cosW < -1 || cosW > 1) {
      const r = new Date(local); r.setHours(6, 0, 0, 0);
      const s = new Date(local); s.setHours(18, 0, 0, 0);
      return { rise: r, set: s, approx: true };
    }
    const w = Math.acos(cosW) / RAD;
    return { rise: toDate(Jt - w / 360), set: toDate(Jt + w / 360), approx: false };
  }

  // ---------- planetary hours ----------
  const DAY_RULER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
  const CHALDEAN = ["saturn", "jupiter", "mars", "sun", "venus", "mercury", "moon"];
  const HOUR_MEANING = {
    jupiter: "Luck, growth and money. Best for launches, investments, asking for a raise and buying tickets.",
    venus: "Attraction, sales and harmony. Good for deals, beauty, love and spending on pleasure.",
    sun: "Success and recognition. Good for meeting important people, interviews and going public.",
    mercury: "Commerce and communication. Good for contracts, emails, trading and negotiating.",
    moon: "Mood and the public. Good for marketing, family matters and following your intuition.",
    mars: "Force and competition. Good for workouts and tough tasks, but traditionally avoided for launches.",
    saturn: "Delays and structure. Good for discipline and paperwork, but traditionally avoided for new beginnings.",
  };
  const BASE = { jupiter: 3, venus: 2.5, sun: 2, mercury: 1, moon: 0.5, mars: -1, saturn: -1.5 };

  function luckyPlanets(chart) {
    const chartRuler = RULER[chart.rising !== null ? chart.rising : chart.signs.sun];
    const moneyRuler = RULER[((chart.rising !== null ? chart.rising : chart.signs.sun) + 1) % 12];
    const careerRuler = RULER[((chart.rising !== null ? chart.rising : chart.signs.sun) + 9) % 12];
    return { chartRuler, moneyRuler, careerRuler };
  }

  function hourScore(planet, lp) {
    return BASE[planet] + (planet === lp.chartRuler ? 1.5 : 0) + (planet === lp.moneyRuler ? 1 : 0) + (planet === lp.careerRuler ? 0.75 : 0);
  }

  function planetaryHours(chart, date, place) {
    const lat = place ? place.lat : 0, lon = place ? place.lon : 0;
    const today = sunTimes(date, lat, lon);
    const tomorrow = sunTimes(addDays(date, 1), lat, lon);
    const dayLen = (today.set - today.rise) / 12;
    const nightLen = (tomorrow.rise - today.set) / 12;
    const dayRuler = DAY_RULER[noon(date).getDay()];
    const start = CHALDEAN.indexOf(dayRuler);
    const lp = luckyPlanets(chart);
    const hours = Array.from({ length: 24 }, (_, i) => {
      const planet = CHALDEAN[(start + i) % 7];
      const from = new Date(i < 12 ? today.rise.getTime() + i * dayLen : today.set.getTime() + (i - 12) * nightLen);
      const to = new Date(i < 12 ? today.rise.getTime() + (i + 1) * dayLen : today.set.getTime() + (i - 11) * nightLen);
      return { i, planet, from, to, night: i >= 12, score: hourScore(planet, lp) };
    });
    // Best = top-scoring hours that start at a usable time (6am – 11pm local).
    const usable = hours.filter((h) => h.from.getHours() >= 6 && h.from.getHours() < 23);
    const ranked = [...usable].sort((a, b) => b.score - a.score || a.from - b.from);
    const best = ranked.slice(0, 3).sort((a, b) => a.from - b.from);
    best.forEach((h) => (h.best = true));
    return { hours, best, dayRuler, sunrise: today.rise, sunset: today.set, approx: today.approx || !place, lucky: lp, meaning: HOUR_MEANING };
  }

  // ---------- lucky days ----------
  function dayLuck(chart, date) {
    const d = noon(date);
    const L = Astro.longitudes(d);
    const moon = Astro.signOf(L.moon);
    const ph = Astro.phase(d);
    const mh = house(moon, chart);
    const ruler = DAY_RULER[d.getDay()];
    const lp = luckyPlanets(chart);
    const reasons = [];
    let s = 0;
    if (ruler === "jupiter") { s += 1.5; reasons.push("Jupiter's day (Thursday)"); }
    else if (ruler === "venus") { s += 1; reasons.push("Venus's day (Friday)"); }
    else if (ruler === "sun") { s += 0.75; reasons.push("the Sun's day (Sunday)"); }
    if (ruler === lp.chartRuler) { s += 0.75; reasons.push(`ruled by your chart ruler, ${PLANETS[ruler].name}`); }
    if (ph.index >= 1 && ph.index <= 3) { s += 1; reasons.push("waxing Moon (growth)"); }
    else if (ph.index === 4) { s += 0.5; reasons.push("Full Moon"); }
    else if (ph.index >= 6) s -= 0.5;
    if ([2, 5, 8, 11].includes(mh)) { s += 1; reasons.push(`Moon in your ${ORD[mh]} house of ${HOUSES[mh].name.toLowerCase()}`); }
    const jd = signDist(moon, chart.signs.jupiter);
    if (jd === 0 || jd === 4) { s += 1; reasons.push("Moon in harmony with your natal Jupiter"); }
    const vd = signDist(moon, chart.signs.venus);
    if (vd === 0 || vd === 4) { s += 0.5; reasons.push("Moon in harmony with your natal Venus"); }
    if (signDist(moon, chart.signs.saturn) === 3) s -= 0.5;
    return { date: d, score: s, reasons, moonSign: moon, phase: PHASES[ph.index] };
  }

  function luckyDays(chart, place, from = new Date(), count = 60) {
    const days = Array.from({ length: count }, (_, i) => dayLuck(chart, addDays(from, i)));
    const top = [...days].sort((a, b) => b.score - a.score || a.date - b.date).slice(0, 8).sort((a, b) => a.date - b.date);
    top.forEach((d) => {
      const ph = planetaryHours(chart, d.date, place);
      d.hour = ph.best[0];
    });
    return { days, top };
  }

  // ---------- lucky months ----------
  function luckyMonths(chart, from = new Date()) {
    return Array.from({ length: 12 }, (_, i) => {
      const d = noon(new Date(from.getFullYear(), from.getMonth() + i, 15));
      const L = Astro.longitudes(d);
      const sun = Astro.signOf(L.sun), venus = Astro.signOf(L.venus), jup = Astro.signOf(L.jupiter);
      const sh = house(sun, chart), vh = house(venus, chart);
      let s = 0;
      const reasons = [];
      if ([2, 5, 8, 11].includes(sh)) { s += 2; reasons.push(`Sun in your ${ORD[sh]} house of ${HOUSES[sh].name.toLowerCase()}`); }
      if (sh === 10) { s += 1.5; reasons.push("Sun in your career house"); }
      if (sh === 1) { s += 1; reasons.push("your birthday season"); }
      const sj = signDist(sun, chart.signs.jupiter);
      if (sj === 0 || sj === 4) { s += 1; reasons.push("Sun in harmony with your natal Jupiter"); }
      if ([2, 5, 8, 11].includes(vh)) { s += 1; reasons.push(`Venus in your ${ORD[vh]} house`); }
      if (signDist(sun, jup) === 0 || signDist(sun, jup) === 4) { s += 0.5; reasons.push("Sun and Jupiter in harmony"); }
      if (sh === 12) s -= 1;
      return { date: d, score: s, reasons, sunSign: sun, sunHouse: sh };
    }).map((m, _, all) => ({ ...m, best: [...all].sort((a, b) => b.score - a.score).slice(0, 3).includes(m) }));
  }

  // ---------- Jupiter years ----------
  const JUP_HOUSE = {
    1: "A personal fresh start. Confidence, opportunities and visibility grow.",
    2: "One of the best money periods. Income, savings and self-worth expand.",
    3: "Luck through learning, writing, short trips and local connections.",
    4: "Blessings at home: moving, property and family growth.",
    5: "Luck in games, creativity, romance and children. Traditionally the speculation house.",
    6: "Growth through work, health habits and steady service.",
    7: "Luck through partners: marriage, contracts and collaborations.",
    8: "Windfalls, inheritances, shared money and investments.",
    9: "Travel, higher education, publishing and big-picture growth.",
    10: "A career peak: promotions, recognition and public success.",
    11: "Gains through friends, networks and wishes coming true.",
    12: "A quieter, inward year. Rest, spirituality and finishing old chapters.",
  };
  const JUP_STAR = { 2: 3, 5: 3, 8: 2, 10: 3, 11: 3, 1: 2, 7: 1, 9: 1 };

  let jupCache = null;
  function jupiterYears(chart, from = new Date()) {
    const key = `${chart.seed}|${chart.houseSign}|${from.getFullYear()}-${from.getMonth()}`;
    if (jupCache && jupCache.key === key) return jupCache.value;
    const start = addDays(from, -420), end = addDays(from, 365 * 12);
    const ingress = Astro.planetEvents("jupiter", start, end).filter((e) => e.type === "ingress");
    // A period starts at Jupiter's first forward entry into a sign; retrograde dips back are ignored.
    const periods = [];
    let cur = Astro.signOf(Astro.longitudes(noon(start)).jupiter), since = null;
    for (const e of ingress) {
      if (e.sign !== (cur + 1) % 12) continue;
      periods.push({ sign: cur, from: since, to: e.date });
      cur = e.sign; since = e.date;
    }
    periods.push({ sign: cur, from: since, to: null });
    const value = periods
      .filter((p) => !p.to || p.to > from)
      .map((p) => {
        const h = house(p.sign, chart);
        return { ...p, house: h, stars: JUP_STAR[h] || 0, text: JUP_HOUSE[h], returnYear: p.sign === chart.signs.jupiter, current: (!p.from || p.from <= from) && (!p.to || p.to > from) };
      });
    jupCache = { key, value };
    return value;
  }

  return {
    career, partner, planetaryHours, luckyDays, luckyMonths, jupiterYears, sunTimes,
    addressNumber, matchHome, bestHomeNumbers, personalNumbers, reduce, HOME_NUMBERS, single,
  };
})();
