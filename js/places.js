// Relocation (best countries and US states for your chart), car guidance and build-year numerology.

const Places = (() => {
  // [name, latitude, longitude] — a major city or the geographic center, enough for a relocated chart.
  const COUNTRIES = [
    ["United States (East)", 40.7, -74.0], ["United States (West)", 34.05, -118.2], ["Canada", 43.65, -79.4], ["Mexico", 19.4, -99.1],
    ["Brazil", -23.55, -46.6], ["Argentina", -34.6, -58.4], ["Colombia", 4.7, -74.1], ["Chile", -33.45, -70.65], ["Peru", -12.05, -77.05],
    ["Jamaica", 18.0, -76.8], ["Dominican Republic", 18.5, -69.9], ["United Kingdom", 51.5, -0.13], ["Ireland", 53.35, -6.26],
    ["France", 48.86, 2.35], ["Spain", 40.42, -3.7], ["Portugal", 38.72, -9.14], ["Italy", 41.9, 12.5], ["Germany", 52.52, 13.4],
    ["Netherlands", 52.37, 4.9], ["Belgium", 50.85, 4.35], ["Switzerland", 47.37, 8.54], ["Sweden", 59.33, 18.07], ["Norway", 59.9, 10.75],
    ["Poland", 52.23, 21.0], ["Greece", 37.98, 23.73], ["Turkey", 41.0, 28.98], ["Morocco", 33.57, -7.6], ["Senegal", 14.69, -17.44],
    ["Guinea", 9.64, -13.58], ["Mali", 12.64, -8.0], ["Côte d'Ivoire", 5.36, -4.0], ["Ghana", 5.6, -0.19], ["Nigeria", 6.52, 3.38],
    ["Cameroon", 3.85, 11.5], ["Egypt", 30.04, 31.24], ["Ethiopia", 9.03, 38.74], ["Kenya", -1.29, 36.82], ["South Africa", -26.2, 28.05],
    ["Saudi Arabia", 24.71, 46.68], ["United Arab Emirates", 25.2, 55.27], ["Qatar", 25.29, 51.53], ["India", 19.08, 72.88],
    ["Pakistan", 24.86, 67.0], ["China", 31.23, 121.47], ["Hong Kong", 22.32, 114.17], ["Japan", 35.68, 139.69], ["South Korea", 37.57, 126.98],
    ["Singapore", 1.35, 103.82], ["Thailand", 13.76, 100.5], ["Malaysia", 3.14, 101.69], ["Indonesia", -6.2, 106.85], ["Philippines", 14.6, 120.98],
    ["Vietnam", 10.82, 106.63], ["Australia", -33.87, 151.21], ["New Zealand", -36.85, 174.76],
  ];

  const STATES = [
    ["Alabama", 32.8, -86.8], ["Alaska", 61.2, -149.9], ["Arizona", 33.45, -112.07], ["Arkansas", 34.75, -92.29], ["California", 36.78, -119.42],
    ["Colorado", 39.74, -104.99], ["Connecticut", 41.6, -72.7], ["Delaware", 39.0, -75.5], ["Florida", 27.99, -81.76], ["Georgia", 33.75, -84.39],
    ["Hawaii", 21.31, -157.86], ["Idaho", 43.62, -116.2], ["Illinois", 41.88, -87.63], ["Indiana", 39.77, -86.16], ["Iowa", 41.59, -93.62],
    ["Kansas", 38.5, -98.0], ["Kentucky", 38.2, -84.87], ["Louisiana", 29.95, -90.07], ["Maine", 44.31, -69.78], ["Maryland", 39.29, -76.61],
    ["Massachusetts", 42.36, -71.06], ["Michigan", 42.33, -83.05], ["Minnesota", 44.98, -93.27], ["Mississippi", 32.3, -90.18], ["Missouri", 38.63, -90.2],
    ["Montana", 46.6, -112.03], ["Nebraska", 41.26, -95.93], ["Nevada", 36.17, -115.14], ["New Hampshire", 43.21, -71.54], ["New Jersey", 40.06, -74.41],
    ["New Mexico", 35.08, -106.65], ["New York", 40.71, -74.0], ["North Carolina", 35.23, -80.84], ["North Dakota", 46.81, -100.78], ["Ohio", 39.96, -83.0],
    ["Oklahoma", 35.47, -97.52], ["Oregon", 45.52, -122.68], ["Pennsylvania", 39.95, -75.17], ["Rhode Island", 41.82, -71.41], ["South Carolina", 34.0, -81.03],
    ["South Dakota", 44.37, -100.35], ["Tennessee", 36.16, -86.78], ["Texas", 29.76, -95.37], ["Utah", 40.76, -111.89], ["Vermont", 44.26, -72.58],
    ["Virginia", 37.54, -77.44], ["Washington", 47.61, -122.33], ["West Virginia", 38.35, -81.63], ["Wisconsin", 43.07, -89.4], ["Wyoming", 41.14, -104.82],
  ];

  const WEIGHT = { jupiter: 3, venus: 2.5, sun: 2, moon: 1, mercury: 1, mars: -1.5, saturn: -2 };
  const ANGLE_THEME = FR ? FR_CONTENT.angleTheme : {
    MC: { name: "career line", text: "career, reputation and public success" },
    ASC: { name: "rising line", text: "confidence, health and personal magnetism" },
    DSC: { name: "partner line", text: "love, marriage and business partners" },
    IC: { name: "home line", text: "home, family and putting down roots" },
  };
  const PLANET_GIFT = FR ? FR_CONTENT.planetGift : {
    jupiter: "luck, money and growth", venus: "love, beauty and easy income", sun: "recognition and vitality",
    moon: "belonging and public appeal", mercury: "networking, trade and ideas", mars: "drive, but also conflict and stress",
    saturn: "hard work, delays and heavy responsibility",
  };
  const ORB = 10;
  const sep = (a, b) => Math.abs(Astro.norm(a - b + 180) - 180);

  function scorePlace(chart, [name, lat, lon]) {
    const a = Astro.angles(chart.when, lat, lon);
    const angles = { ASC: a.asc, MC: a.mc, DSC: Astro.norm(a.asc + 180), IC: Astro.norm(a.mc + 180) };
    let score = 0;
    const hits = [];
    for (const k of Reading.PLANET_KEYS) {
      for (const [ang, lonA] of Object.entries(angles)) {
        const d = sep(chart.lon[k], lonA);
        if (d <= ORB) {
          const strength = 1 - d / ORB;
          const bonus = (k === "jupiter" || k === "venus") && (ang === "MC" || ang === "ASC") ? 1.25 : 1;
          score += WEIGHT[k] * strength * bonus;
          hits.push({ planet: k, angle: ang, strength });
        }
      }
    }
    hits.sort((x, y) => Math.abs(WEIGHT[y.planet]) * y.strength - Math.abs(WEIGHT[x.planet]) * x.strength);
    const good = hits.filter((h) => WEIGHT[h.planet] > 0);
    const hard = hits.filter((h) => WEIGHT[h.planet] < 0);
    const describe = (h) => t(`${PLANETS[h.planet].name} on your ${ANGLE_THEME[h.angle].name}: ${PLANET_GIFT[h.planet]} through ${ANGLE_THEME[h.angle].text}`,
      `${PLANETS[h.planet].name} sur votre ${ANGLE_THEME[h.angle].name} : ${PLANET_GIFT[h.planet]} par ${ANGLE_THEME[h.angle].text}`);
    const label = FR ? FR_CONTENT.countries[name] || FR_CONTENT.states[name] || name : name;
    return {
      name: label, score, hits,
      text: good.length ? describe(good[0]) + (good[1] ? t(`. Also, ${describe(good[1])}`, `. Aussi : ${describe(good[1])}`) : "") + "."
        : hard.length ? describe(hard[0]) + "." : t("No planets on your angles here: a neutral, quiet place for you.", "Aucune planète sur vos angles ici : un lieu neutre et calme pour vous."),
      caution: good.length && hard.length ? t(`${PLANETS[hard[0].planet].name} is also active here, so expect some ${PLANET_GIFT[hard[0].planet].replace(/^drive, but also /, "")}.`,
        `${PLANETS[hard[0].planet].name} est aussi actif ici : attendez-vous à un peu de ${PLANET_GIFT[hard[0].planet].replace(/^énergie, mais aussi /, "")}.`) : "",
    };
  }

  function relocation(chart) {
    if (!chart.place || chart.rising === null) return null;
    const rank = (list) => list.map((p) => scorePlace(chart, p)).sort((a, b) => b.score - a.score);
    const countries = rank(COUNTRIES), states = rank(STATES);
    return {
      countries: countries.filter((p) => p.score > 0).slice(0, 6),
      countriesHard: countries.filter((p) => p.score < 0).slice(-3).reverse(),
      states: states.filter((p) => p.score > 0).slice(0, 6),
      statesHard: states.filter((p) => p.score < 0).slice(-3).reverse(),
    };
  }

  // ---------- cars ----------
  const CAR = FR ? FR_CONTENT.car : {
    Fire: { type: "Sporty and powerful", why: "Fire wants speed, presence and fun behind the wheel.",
      examples: ["Ford Mustang", "Chevrolet Camaro", "Dodge Challenger", "BMW M3", "Porsche 911", "Kia Stinger"] },
    Earth: { type: "Reliable, solid and built to last", why: "Earth values durability, resale value and a car that never lets you down.",
      examples: ["Toyota 4Runner", "Toyota Camry", "Lexus ES", "Ford F-150", "Honda CR-V", "Volvo XC60"] },
    Air: { type: "Smart, tech-forward and nimble", why: "Air loves the newest tech, easy handling and a car that feels light and modern.",
      examples: ["Tesla Model 3", "Hyundai Ioniq 5", "Mini Cooper", "Honda Civic", "Mazda MX-5 convertible", "Audi A4"] },
    Water: { type: "Comfortable, safe and protective", why: "Water wants a calm, quiet cabin that feels like a safe space for you and your people.",
      examples: ["Toyota Highlander Hybrid", "Lexus RX", "Volvo XC90", "Honda Odyssey", "Subaru Outback", "Toyota Sienna"] },
  };
  const DRIVE = FR ? FR_CONTENT.drive : {
    Fire: "you drive fast and decisively. Pick strong safety features and respect the speed limit.",
    Earth: "you drive steadily and carefully. Comfort and fuel economy matter to you.",
    Air: "you multitask on the road. Good driver-assist and a great sound system suit you.",
    Water: "you drive by feel and mood. A quiet, smooth ride keeps you calm.",
  };

  // Chinese zodiac by index (0 = Rat … 11 = Pig): allies come in trines, clashes sit 6 apart.
  const animalIndex = (y) => (((y - 4) % 12) + 12) % 12;

  // Build year of a car or house → single digit + Chinese year animal, compared with your chart.
  function buildYear(chart, year) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1800 || y > 2100) return { error: t("Enter a 4-digit year, e.g. 2019.", "Saisissez une année à 4 chiffres, par ex. 2019.") };
    const r = Destiny.reduce(y);
    const value = r.value;
    const match = Destiny.matchHome(value, chart, t("this year", "cette année"));
    const ai = animalIndex(y), mi = chart.chinese.index;
    const animal = CHINESE[ai][0], mine = CHINESE[mi][0];
    const du = (x) => (x === "Chèvre" ? "de la " : "du ") + x;
    const zodiac = ai === mi ? { level: "great", text: t(`${y} is a ${animal} year, the same as your own sign.`, `${y} est une année ${du(animal)}, comme votre propre signe.`) }
      : (ai - mi + 12) % 4 === 0 ? { level: "good", text: t(`${y} is a ${animal} year, a natural ally of your ${mine} sign.`, `${y} est une année ${du(animal)}, un allié naturel de votre signe ${du(mine)}.`) }
      : (ai - mi + 12) % 12 === 6 ? { level: "bad", text: t(`${y} is a ${animal} year, which traditionally clashes with your ${mine} sign.`, `${y} est une année ${du(animal)}, traditionnellement en conflit avec votre signe ${du(mine)}.`) }
      : { level: "ok", text: t(`${y} is a ${animal} year: neutral for your ${mine} sign.`, `${y} est une année ${du(animal)} : neutre pour votre signe ${du(mine)}.`) };
    return { year: y, value, work: r.steps, title: Destiny.HOME_NUMBERS[value][0], match, zodiac };
  }

  function goodYears(chart, from, to) {
    const out = [];
    for (let y = to; y >= from; y--) {
      const b = buildYear(chart, y);
      const pts = { great: 2, good: 1, ok: 0, bad: -2 };
      const s = pts[b.match.level] + pts[b.zodiac.level];
      if (s >= 2) out.push({ ...b, score: s });
    }
    return out;
  }

  function car(chart) {
    const main = chart.dominant;
    const venusEl = SIGNS[chart.signs.venus].element;
    const marsEl = SIGNS[chart.signs.mars].element;
    const colors = [...new Set([...ELEMENT_INFO[venusEl].colors.slice(0, 2), SIGNS[chart.signs.sun].lucky.color, ELEMENT_INFO[main].colors[0]])];
    const now = new Date().getFullYear();
    return {
      main: { element: main, ...CAR[main] },
      alt: venusEl !== main ? { element: venusEl, ...CAR[venusEl] } : null,
      drive: t(`With Mars in ${SIGNS[chart.signs.mars].name}, ${DRIVE[marsEl]}`, `Avec Mars en ${SIGNS[chart.signs.mars].name}, ${DRIVE[marsEl]}`),
      colors,
      years: goodYears(chart, now - 12, now + 1).slice(0, 6),
    };
  }

  return { relocation, car, buildYear, goodYears, COUNTRIES, STATES };
})();
