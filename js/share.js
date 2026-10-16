// Daily and monthly horoscopes for all 12 signs as shareable 1080×1350 cards, a cover, a PDF guide and a ZIP bundle.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const DEFAULT_SITE = "https://laminedo.github.io/celestial-reading/";
  const SLUGS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  const EL_ACCENT = { Fire: "#ff8a65", Earth: "#9ccc65", Air: "#8fd3ff", Water: "#9b8cff" };
  const W = 1080, H = 1350;

  const settings = Object.assign({ brand: "Celestial Reading", fb: "", site: DEFAULT_SITE }, store.get("celestial.share") || {});
  let monthOffset = new Date().getDate() >= 20 ? 1 : 0; // late in the month, prepare next month's posts
  let dayOffset = new Date().getHours() >= 18 ? 1 : 0; // in the evening, prepare tomorrow's post
  let mode = store.get("celestial.shareMode") === "monthly" ? "monthly" : "daily";

  // ---------- static text & language ----------
  document.querySelectorAll("[data-fr]").forEach((el) => { if (FR) el.innerHTML = el.dataset.fr; });
  document.querySelectorAll("[data-fr-placeholder]").forEach((el) => { if (FR) el.placeholder = el.dataset.frPlaceholder; });
  document.querySelectorAll("[data-fr-aria-label]").forEach((el) => { if (FR) el.setAttribute("aria-label", el.dataset.frAriaLabel); });
  const langBtn = $("#lang-btn");
  langBtn.textContent = FR ? "EN" : "FR";
  langBtn.title = FR ? "Switch to English" : "Passer en français";
  langBtn.addEventListener("click", () => setLang(FR ? "en" : "fr"));
  if (FR) document.title = "Horoscopes à partager · Celestial Reading";

  // ---------- helpers ----------
  const monthDate = () => { const d = new Date(); d.setDate(15); d.setHours(12, 0, 0, 0); d.setMonth(d.getMonth() + monthOffset); return d; };
  const monthName = (d) => d.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
  const dayDate = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + dayOffset); return d; };
  const periodDate = () => (mode === "daily" ? dayDate() : monthDate());
  const dayName = (d) => d.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayShort = (d) => d.toLocaleDateString(LOCALE, { weekday: "short", day: "numeric", month: "short" });
  const hourLabel = (hhmm, date) => { const [h, m] = hhmm.split(":").map(Number); const d = new Date(date); d.setHours(h, m || 0, 0, 0); return d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" }); };
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const deMonth = (m) => (/^[aeiouéâ]/i.test(m) ? "d'" : "de ") + m; // "d'octobre", "de mars"
  const dayFmt = (d) => d.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
  const prettyLink = (u) => String(u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const firstSentences = (text, n, max) => {
    const parts = String(text).split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/);
    let out = parts.slice(0, n).join(" ");
    if (out.length > max) out = parts[0];
    return out.length > max ? out.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : out;
  };
  const dots = (v) => {
    let html = "";
    for (let i = 1; i <= 5; i++) html += `<i class="${v >= i ? "on" : v >= i - 0.5 ? "half" : ""}"></i>`;
    return `<span class="hc-dots">${html}</span>`;
  };
  function qrImg(url, size) {
    try {
      const qr = qrcode(0, "M");
      qr.addData(url);
      qr.make();
      return `<img class="hc-qr" src="${qr.createDataURL(8, 2)}" width="${size}" height="${size}" alt="">`;
    } catch { return ""; }
  }

  // ---------- content ----------
  // Sign-wide chart (also defined in reading.js; kept here so an older cached reading.js can't break this page).
  const signChart = (sign) => Reading.signChart ? Reading.signChart(sign) : {
    name: "", seed: `sign|${sign}`, houseSign: sign, rising: null, when: new Date(2000, 0, 1), generic: true,
    signs: Object.fromEntries(Reading.PLANET_KEYS.map((k) => [k, sign])),
  };

  function signData(i, date) {
    const R = Reading.monthly(signChart(i), date);
    const lunar = R.keyDates.filter((e) => e.title.startsWith(PHASES[0].icon) || e.title.startsWith(PHASES[4].icon));
    return {
      sign: SIGNS[i],
      headline: R.headline,
      summary: firstSentences(R.overview, 2, 380),
      areas: R.areas,
      power: R.power,
      tough: R.tough,
      lunar,
      focus: R.todo.filter((x) => !x.includes(" · ")).slice(0, 3),
      avoid: R.avoid[0],
      retro: R.notes.map((n) => `${n.title} (${n.range})`).slice(0, 1),
    };
  }

  function footer() {
    const site = settings.site || DEFAULT_SITE;
    return `
      <div class="hc-footer">
        ${qrImg(site, 150)}
        <div class="hc-cta">
          <strong>${t("Get your free personal reading", "Votre lecture personnelle gratuite")}</strong>
          <span>${esc(prettyLink(site))}</span>
          ${settings.fb ? `<span class="hc-fb">f&nbsp; ${esc(prettyLink(settings.fb))}</span>` : ""}
        </div>
        <div class="hc-brand">✧ ${esc(settings.brand || "Celestial Reading")}</div>
      </div>`;
  }

  function stars(seed) {
    let html = "", a = seed * 9301 + 49297;
    const rnd = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
    for (let k = 0; k < 70; k++) html += `<b style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;opacity:${(0.25 + rnd() * 0.6).toFixed(2)};width:${rnd() < 0.85 ? 2 : 3}px;height:${rnd() < 0.85 ? 2 : 3}px"></b>`;
    return `<div class="hc-stars">${html}</div>`;
  }

  function monthCardHTML(i, date) {
    const D = signData(i, date);
    const s = D.sign, accent = EL_ACCENT[s.element];
    return `
      <div class="hcard" style="--accent:${accent}">
        ${stars(i + 3)}
        <div class="hc-top"><span>✧ ${esc(settings.brand || "Celestial Reading")}</span><span>${t("Horoscope", "Horoscope")} · ${esc(cap(monthName(date)))}</span></div>
        <div class="hc-sign">
          <div class="hc-glyph">${s.glyph}</div>
          <div><h2>${esc(s.name)}</h2><p>${esc(s.dates)} · ${esc(elName(s.element))}</p></div>
        </div>
        <h3 class="hc-headline">${esc(D.headline)}</h3>
        <p class="hc-summary">${esc(D.summary)}</p>
        <div class="hc-areas">${D.areas.map((a) => `<div><span>${esc(a.label)}</span>${dots(a.rating)}</div>`).join("")}</div>
        <div class="hc-cols">
          <div>
            <h4>${t("Power days", "Jours forts")}</h4><p class="hc-days">${D.power.map(dayFmt).join(" · ")}</p>
            <h4>${t("Go easy", "Doucement")}</h4><p class="hc-days soft">${D.tough.map(dayFmt).join(" · ")}</p>
            ${D.lunar.length ? `<h4>${t("Moon dates", "Dates lunaires")}</h4>${D.lunar.map((e) => `<p class="hc-moon">${dayFmt(e.date)} · ${esc(e.title)}</p>`).join("")}` : ""}
          </div>
          <div>
            <h4>${t("Focus this month", "À privilégier ce mois-ci")}</h4>
            <ul>${D.focus.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
            <h4>${t("Avoid", "À éviter")}</h4><p class="hc-avoid">${esc(D.avoid)}</p>
            ${D.retro.length ? `<p class="hc-retro">℞ ${esc(D.retro[0])}</p>` : ""}
          </div>
        </div>
        <div class="hc-lucky">
          <div><small>${t("Lucky number", "Nombre")}</small><b>${s.lucky.number}</b></div>
          <div><small>${t("Color", "Couleur")}</small><b>${esc(s.lucky.color)}</b></div>
          <div><small>${t("Day", "Jour")}</small><b>${esc(s.lucky.day)}</b></div>
          <div><small>${t("Stone", "Pierre")}</small><b>${esc(s.lucky.stone)}</b></div>
        </div>
        ${footer()}
      </div>`;
  }

  function monthCoverHTML(date) {
    return `
      <div class="hcard hc-cover" style="--accent:#e9c47a">
        ${stars(1)}
        <div class="hc-top"><span>✧ ${esc(settings.brand || "Celestial Reading")}</span><span>${t("Monthly horoscope", "Horoscope du mois")}</span></div>
        <p class="hc-eyebrow">${t("Your horoscope for", "Votre horoscope du mois")}</p>
        <h1>${esc(cap(monthName(date)))}</h1>
        <p class="hc-sub">${t("All 12 signs · love, career, money and the best days of the month", "Les 12 signes · amour, carrière, argent et les meilleurs jours du mois")}</p>
        <div class="hc-wheel">${SIGNS.map((s) => `<div style="--c:${EL_ACCENT[s.element]}"><span>${s.glyph}</span><b>${esc(s.name)}</b><small>${esc(s.dates)}</small></div>`).join("")}</div>
        <p class="hc-swipe">${t("Find your sign in the next pictures ➜", "Trouvez votre signe dans les images suivantes ➜")}</p>
        ${footer()}
      </div>`;
  }

  // ---------- daily ----------
  function dailyData(i, date) {
    const R = Reading.daily(signChart(i), date);
    return {
      sign: SIGNS[i], R,
      energy: R.areas.reduce((sum, a) => sum + a.rating, 0) / R.areas.length,
      todo: R.todo.slice(0, 3),
      avoid: R.avoid.slice(0, 2),
      retro: R.notes.map((n) => `${n.title} (${n.range})`).slice(0, 1),
    };
  }

  function dayCardHTML(i, date) {
    const D = dailyData(i, date), R = D.R;
    const s = D.sign, accent = EL_ACCENT[s.element];
    return `
      <div class="hcard hc-daily" style="--accent:${accent}">
        ${stars(i + 21)}
        <div class="hc-top"><span>✧ ${esc(settings.brand || "Celestial Reading")}</span><span>${esc(cap(dayShort(date)))}</span></div>
        <div class="hc-sign">
          <div class="hc-glyph">${s.glyph}</div>
          <div><h2>${esc(s.name)}</h2><p>${t("Daily horoscope", "Horoscope du jour")} · ${esc(s.dates)}</p></div>
        </div>
        <h3 class="hc-headline">${esc(R.headline)}</h3>
        <p class="hc-summary">${esc(R.overview)}</p>
        <div class="hc-moonrow">
          <span>${R.moon.phase.icon} ${esc(R.moon.phase.name)} · ${R.moon.illumination}%</span>
          <span>☽︎ ${t("Moon in", "Lune en")} ${esc(R.moon.sign.name)} ${R.moon.sign.glyph}</span>
          <span class="gold">${t("Lucky number", "Nombre")} ${R.lucky.number}</span>
          <span class="gold">${esc(R.lucky.color)}</span>
          <span class="gold">${t("Best hour", "Meilleure heure")} ${esc(hourLabel(R.lucky.time, date))}</span>
        </div>
        <div class="hc-fit">
          <div class="hc-areas2">${R.areas.map((a) => `<div><div class="hc-arow"><span>${esc(a.label)}</span>${dots(a.rating)}</div><p>${esc(a.text)}</p></div>`).join("")}</div>
          <div class="hc-cols">
            <div><h4>${t("Do today", "À faire aujourd'hui")}</h4><ul>${D.todo.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
            <div><h4>${t("Avoid", "À éviter")}</h4><ul class="hc-x">${D.avoid.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
              ${D.retro.length ? `<p class="hc-retro">℞ ${esc(D.retro[0])}</p>` : ""}</div>
          </div>
        </div>
        ${footer()}
      </div>`;
  }

  function dayCoverHTML(date) {
    const ph = Astro.phase(date);
    const moonSign = SIGNS[Astro.signOf(Astro.longitudes(date).moon)];
    const scores = SIGNS.map((x, i) => dailyData(i, date).energy);
    const top = scores.indexOf(Math.max(...scores));
    const stars5 = (v) => "★".repeat(Math.round(v)) + "☆".repeat(5 - Math.round(v));
    return `
      <div class="hcard hc-cover hc-daycover" style="--accent:#e9c47a">
        ${stars(2)}
        <div class="hc-top"><span>✧ ${esc(settings.brand || "Celestial Reading")}</span><span>${t("Daily horoscope", "Horoscope du jour")}</span></div>
        <p class="hc-eyebrow">${t("Your horoscope for", "Votre horoscope du")}</p>
        <h1>${esc(cap(date.toLocaleDateString(LOCALE, { weekday: "long" })))}</h1>
        <p class="hc-sub hc-date">${esc(date.toLocaleDateString(LOCALE, { day: "numeric", month: "long", year: "numeric" }))}</p>
        <p class="hc-sky">${PHASES[ph.index].icon} ${esc(PHASES[ph.index].name)} · ☽︎ ${t("Moon in", "Lune en")} ${esc(moonSign.name)} ${moonSign.glyph}</p>
        <div class="hc-wheel">${SIGNS.map((x, i) => `<div class="${i === top ? "top" : ""}" style="--c:${EL_ACCENT[x.element]}"><span>${x.glyph}</span><b>${esc(x.name)}</b><small class="hc-stars5">${stars5(scores[i])}</small></div>`).join("")}</div>
        <p class="hc-swipe">${t(`★ Luckiest today: ${SIGNS[top].name} ${SIGNS[top].glyph}`, `★ Le plus chanceux du jour : ${SIGNS[top].name} ${SIGNS[top].glyph}`)}<br><span class="hc-swipe2">${t("Find your sign in the next pictures ➜", "Trouvez votre signe dans les images suivantes ➜")}</span></p>
        ${footer()}
      </div>`;
  }

  const cardHTML = (i, date) => (mode === "daily" ? dayCardHTML(i, date) : monthCardHTML(i, date));
  const coverHTML = (date) => (mode === "daily" ? dayCoverHTML(date) : monthCoverHTML(date));

  // Shrink text until everything fits the card; drop the retrograde note (and on daily cards the last tips) only as a last resort.
  function fitCard(card) {
    const box = card.querySelector(".hc-fit") || card.querySelector(".hc-cols");
    if (!box) return;
    const over = () => box.scrollHeight > box.clientHeight + 1;
    const steps = [["--cols-fs", 22], ["--sum-fs", 25], ["--area-fs", 20], ["--cols-fs", 21], ["--sum-fs", 24], ["--area-fs", 19], ["--cols-fs", 20],
      ["--sum-fs", 23], ["--area-fs", 18], ["--cols-fs", 19], ["--sum-fs", 22], ["--cols-fs", 18], ["--area-fs", 17]];
    for (const [v, px] of steps) { if (!over()) return; card.style.setProperty(v, `${px}px`); }
    if (over()) { const r = card.querySelector(".hc-retro"); if (r) r.remove(); }
    for (const ul of card.querySelectorAll(".hc-fit .hc-cols ul")) { while (over() && ul.children.length > 2) ul.lastElementChild.remove(); }
  }
  const fitAll = (root) => root.querySelectorAll(".hcard").forEach(fitCard);

  // ---------- page ----------
  function caption(date) {
    if (mode === "daily") {
      const scores = SIGNS.map((x, i) => dailyData(i, date).energy);
      const top = SIGNS[scores.indexOf(Math.max(...scores))];
      const glyphs = SIGNS.map((x) => x.glyph).join("");
      const site = settings.site || DEFAULT_SITE;
      return FR
        ? `🌙 Votre horoscope du ${dayName(date)} ✨\n${glyphs}\n\nTrouvez votre signe dans les images : amour, carrière, bien-être, argent, ce qu'il faut faire et éviter aujourd'hui.\n\n⭐ Le signe le plus chanceux du jour : ${top.name} ${top.glyph}\n\n🔮 Votre lecture personnelle gratuite : ${site}\n\nPartagez avec quelqu'un de votre signe 💫\n#horoscope #horoscopedujour #astrologie`
        : `🌙 Your daily horoscope for ${dayName(date)} ✨\n${glyphs}\n\nFind your sign in the pictures: love, career, wellness, money, and what to do and avoid today.\n\n⭐ Luckiest sign today: ${top.name} ${top.glyph}\n\n🔮 Get your free personal reading: ${site}\n\nShare with someone of your sign 💫\n#horoscope #dailyhoroscope #astrology`;
    }
    const m = cap(monthName(date));
    const glyphs = SIGNS.map((s) => s.glyph).join("");
    const site = settings.site || DEFAULT_SITE;
    return FR
      ? `✨ Votre horoscope ${deMonth(monthName(date))} est arrivé ! ✨\n${glyphs}\n\nTrouvez votre signe dans les images et découvrez ce que les étoiles vous réservent ce mois-ci en amour, au travail et côté argent.\n\n🔮 Envie d'une lecture rien que pour vous ? Obtenez votre thème natal personnel gratuit : ${site}\n\nPartagez avec quelqu'un de votre signe 💫\n#horoscope #astrologie #zodiaque`
      : `✨ Your ${m} horoscope is here! ✨\n${glyphs}\n\nFind your sign in the pictures and see what the stars have in store for love, work and money this month.\n\n🔮 Want a reading made just for you? Get your free personal birth chart: ${site}\n\nShare with someone of your sign 💫\n#horoscope #astrology #zodiac`;
  }

  function render() {
    const date = periodDate();
    document.querySelectorAll("[data-mode]").forEach((b) => { b.classList.toggle("active", b.dataset.mode === mode); b.setAttribute("aria-selected", b.dataset.mode === mode); });
    if (mode === "daily") {
      $("#month-label").textContent = cap(dayName(date));
      $("#month-hint").textContent = dayOffset === 0 ? t("Today", "Aujourd'hui") : dayOffset === 1 ? t("Tomorrow", "Demain") : dayOffset === -1 ? t("Yesterday", "Hier") : "";
      $("#share-title").textContent = t("Daily horoscopes for all 12 signs", "Horoscopes du jour pour les 12 signes");
      $("#share-lede").textContent = t("A full daily reading for every sign, calculated from the day's real Moon and planet positions, plus a cover with the luckiest sign of the day. Download the bundle and post it each morning.",
        "Une lecture du jour complète pour chaque signe, calculée à partir des vraies positions de la Lune et des planètes, plus une couverture avec le signe le plus chanceux du jour. Téléchargez le pack et publiez-le chaque matin.");
    } else {
      $("#month-label").textContent = cap(monthName(date));
      $("#month-hint").textContent = monthOffset === 0 ? t("This month", "Ce mois-ci") : monthOffset === 1 ? t("Next month", "Le mois prochain") : "";
      $("#share-title").textContent = t(`${cap(monthName(date))} horoscopes for all 12 signs`, `Horoscopes ${deMonth(monthName(date))} pour les 12 signes`);
      $("#share-lede").textContent = t("One card per sign, calculated from the month's real planet positions, plus a cover and a PDF guide. Download the bundle and post it on Facebook on the 1st of the month.",
        "Une carte par signe, calculée à partir des vraies positions des planètes du mois, plus une couverture et un guide PDF. Téléchargez le pack et publiez-le sur Facebook le 1er du mois.");
    }
    $("#caption").value = caption(date);
    const cards = [{ key: "cover", html: coverHTML(date), label: t("Cover", "Couverture") }]
      .concat(SIGNS.map((s, i) => ({ key: i, html: cardHTML(i, date), label: s.name })));
    $("#share-grid").innerHTML = cards.map((c) => `
      <button class="thumb" data-card="${c.key}" title="${esc(t(`Download ${c.label}`, `Télécharger ${c.label}`))}">
        <div class="thumb-inner">${c.html}</div>
        <span class="thumb-label">${esc(c.label)} ⬇</span>
      </button>`).join("");
    $("#share-grid").querySelectorAll(".thumb").forEach((b) => b.addEventListener("click", () => downloadOne(b.dataset.card)));
    document.fonts.ready.then(() => fitAll($("#share-grid")));
  }

  // ---------- export ----------
  const msg = (text) => ($("#export-msg").textContent = text);
  const fileBase = (date) => `horoscope-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}${mode === "daily" ? `-${String(date.getDate()).padStart(2, "0")}` : ""}-${LANG}${mode === "daily" ? "-daily" : ""}`;
  function download(name, blob) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function toCanvas(html) {
    const stage = $("#stage");
    stage.innerHTML = html;
    await document.fonts.ready;
    fitAll(stage);
    await Promise.all([...stage.querySelectorAll("img")].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
    const canvas = await html2canvas(stage.firstElementChild, { width: W, height: H, scale: 1, backgroundColor: "#090a1a", logging: false });
    stage.innerHTML = "";
    return canvas;
  }
  const toBlob = (canvas, type = "image/png", q) => new Promise((r) => canvas.toBlob(r, type, q));

  async function allCanvases(date, onStep) {
    const list = [{ name: "00-cover", html: coverHTML(date) }].concat(SIGNS.map((s, i) => ({ name: `${String(i + 1).padStart(2, "0")}-${SLUGS[i]}`, html: cardHTML(i, date) })));
    const out = [];
    for (let k = 0; k < list.length; k++) {
      onStep(k + 1, list.length);
      out.push({ name: list[k].name, canvas: await toCanvas(list[k].html) });
    }
    return out;
  }

  function buildPdf(canvases) {
    const pdf = new window.jspdf.jsPDF({ orientation: "portrait", unit: "px", format: [W, H], hotfixes: ["px_scaling"], compress: true });
    canvases.forEach((c, k) => {
      if (k) pdf.addPage([W, H], "portrait");
      pdf.addImage(c.canvas.toDataURL("image/jpeg", 0.88), "JPEG", 0, 0, W, H);
    });
    const d = periodDate();
    pdf.setProperties({ title: `Horoscopes ${mode === "daily" ? dayName(d) : monthName(d)}`, creator: settings.brand || "Celestial Reading" });
    return pdf.output("blob");
  }

  let busy = false;
  async function run(task) {
    if (busy) return;
    if (!window.html2canvas || !window.jspdf || !window.JSZip || !window.qrcode) { msg(t("The export tools couldn't load. Check your connection and reload the page.", "Les outils d'export n'ont pas pu se charger. Vérifiez votre connexion et rechargez la page.")); return; }
    busy = true;
    document.querySelectorAll(".share-actions button, .thumb").forEach((b) => (b.disabled = true));
    try { await task(); } catch (e) { msg(t("Something went wrong while creating the files. Please try again.", "Un problème est survenu pendant la création des fichiers. Réessayez.") + ` (${e.message})`); }
    finally { busy = false; document.querySelectorAll(".share-actions button, .thumb").forEach((b) => (b.disabled = false)); }
  }

  async function downloadOne(key) {
    await run(async () => {
      const date = periodDate();
      msg(t("Creating image…", "Création de l'image…"));
      const isCover = key === "cover";
      const canvas = await toCanvas(isCover ? coverHTML(date) : cardHTML(Number(key), date));
      download(`${fileBase(date)}-${isCover ? "00-cover" : `${String(Number(key) + 1).padStart(2, "0")}-${SLUGS[key]}`}.png`, await toBlob(canvas));
      msg(t("Image downloaded ✓", "Image téléchargée ✓"));
    });
  }

  $("#pdf-btn").addEventListener("click", () => run(async () => {
    const date = periodDate();
    const canvases = await allCanvases(date, (k, n) => msg(t(`Creating page ${k} of ${n}…`, `Création de la page ${k} sur ${n}…`)));
    download(`${fileBase(date)}-guide.pdf`, buildPdf(canvases));
    msg(t("PDF guide downloaded ✓", "Guide PDF téléchargé ✓"));
  }));

  $("#bundle-btn").addEventListener("click", () => run(async () => {
    const date = periodDate();
    const canvases = await allCanvases(date, (k, n) => msg(t(`Creating card ${k} of ${n}…`, `Création de la carte ${k} sur ${n}…`)));
    msg(t("Packing the bundle…", "Préparation du pack…"));
    const zip = new JSZip();
    for (const c of canvases) zip.file(`${fileBase(date)}-${c.name}.png`, await toBlob(c.canvas));
    zip.file(`${fileBase(date)}-guide.pdf`, buildPdf(canvases));
    zip.file(`${fileBase(date)}-caption.txt`, caption(date));
    download(`${fileBase(date)}-bundle.zip`, await zip.generateAsync({ type: "blob" }));
    msg(t("Bundle downloaded ✓ Unzip it, then post the cover first and the 12 cards after it.", "Pack téléchargé ✓ Décompressez-le, puis publiez la couverture en premier et les 12 cartes ensuite."));
  }));

  $("#copy-btn").addEventListener("click", async () => {
    const box = $("#caption");
    try { await navigator.clipboard.writeText(box.value); } catch { box.select(); document.execCommand("copy"); }
    msg(t("Caption copied ✓", "Texte copié ✓"));
  });

  // ---------- settings ----------
  const fields = { brand: $("#set-brand"), fb: $("#set-fb"), site: $("#set-site") };
  Object.entries(fields).forEach(([k, el]) => {
    el.value = settings[k] || "";
    el.addEventListener("input", () => {
      settings[k] = el.value.trim();
      store.set("celestial.share", settings);
      clearTimeout(el._t);
      el._t = setTimeout(render, 250);
    });
  });
  $("#month-prev").addEventListener("click", () => { if (mode === "daily") dayOffset--; else monthOffset--; render(); });
  $("#month-next").addEventListener("click", () => { if (mode === "daily") dayOffset++; else monthOffset++; render(); });
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    store.set("celestial.shareMode", mode);
    render();
  }));

  render();
})();
