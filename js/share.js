// Monthly horoscopes for all 12 signs as shareable 1080×1350 cards, a cover, a PDF guide and a ZIP bundle.

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

  // ---------- static text & language ----------
  document.querySelectorAll("[data-fr]").forEach((el) => { if (FR) el.innerHTML = el.dataset.fr; });
  document.querySelectorAll("[data-fr-placeholder]").forEach((el) => { if (FR) el.placeholder = el.dataset.frPlaceholder; });
  document.querySelectorAll("[data-fr-aria-label]").forEach((el) => { if (FR) el.setAttribute("aria-label", el.dataset.frAriaLabel); });
  const langBtn = $("#lang-btn");
  langBtn.textContent = FR ? "EN" : "FR";
  langBtn.title = FR ? "Switch to English" : "Passer en français";
  langBtn.addEventListener("click", () => setLang(FR ? "en" : "fr"));
  if (FR) document.title = "Horoscopes du mois · Celestial Reading";

  // ---------- helpers ----------
  const monthDate = () => { const d = new Date(); d.setDate(15); d.setHours(12, 0, 0, 0); d.setMonth(d.getMonth() + monthOffset); return d; };
  const monthName = (d) => d.toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
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

  function cardHTML(i, date) {
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

  function coverHTML(date) {
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

  // Shrink the lower text until it fits the card; drop the retrograde note only as a last resort.
  function fitCard(card) {
    const cols = card.querySelector(".hc-cols");
    if (!cols) return;
    const over = () => cols.scrollHeight > cols.clientHeight + 1;
    const steps = [["--cols-fs", 22], ["--sum-fs", 25], ["--cols-fs", 21], ["--sum-fs", 24], ["--cols-fs", 20], ["--sum-fs", 23], ["--cols-fs", 19], ["--sum-fs", 22], ["--cols-fs", 18]];
    for (const [v, px] of steps) { if (!over()) return; card.style.setProperty(v, `${px}px`); }
    if (over()) { const r = card.querySelector(".hc-retro"); if (r) r.remove(); }
  }
  const fitAll = (root) => root.querySelectorAll(".hcard").forEach(fitCard);

  // ---------- page ----------
  function caption(date) {
    const m = cap(monthName(date));
    const glyphs = SIGNS.map((s) => s.glyph).join("");
    const site = settings.site || DEFAULT_SITE;
    return FR
      ? `✨ Votre horoscope ${deMonth(monthName(date))} est arrivé ! ✨\n${glyphs}\n\nTrouvez votre signe dans les images et découvrez ce que les étoiles vous réservent ce mois-ci en amour, au travail et côté argent.\n\n🔮 Envie d'une lecture rien que pour vous ? Obtenez votre thème natal personnel gratuit : ${site}\n\nPartagez avec quelqu'un de votre signe 💫\n#horoscope #astrologie #zodiaque`
      : `✨ Your ${m} horoscope is here! ✨\n${glyphs}\n\nFind your sign in the pictures and see what the stars have in store for love, work and money this month.\n\n🔮 Want a reading made just for you? Get your free personal birth chart: ${site}\n\nShare with someone of your sign 💫\n#horoscope #astrology #zodiac`;
  }

  function render() {
    const date = monthDate();
    $("#month-label").textContent = cap(monthName(date));
    $("#month-hint").textContent = monthOffset === 0 ? t("This month", "Ce mois-ci") : monthOffset === 1 ? t("Next month", "Le mois prochain") : "";
    $("#share-title").textContent = t(`${cap(monthName(date))} horoscopes for all 12 signs`, `Horoscopes ${deMonth(monthName(date))} pour les 12 signes`);
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
  const fileBase = (date) => `horoscope-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${LANG}`;
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
    pdf.setProperties({ title: t(`Horoscopes ${monthName(monthDate())}`, `Horoscopes ${monthName(monthDate())}`), creator: settings.brand || "Celestial Reading" });
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
      const date = monthDate();
      msg(t("Creating image…", "Création de l'image…"));
      const isCover = key === "cover";
      const canvas = await toCanvas(isCover ? coverHTML(date) : cardHTML(Number(key), date));
      download(`${fileBase(date)}-${isCover ? "00-cover" : `${String(Number(key) + 1).padStart(2, "0")}-${SLUGS[key]}`}.png`, await toBlob(canvas));
      msg(t("Image downloaded ✓", "Image téléchargée ✓"));
    });
  }

  $("#pdf-btn").addEventListener("click", () => run(async () => {
    const date = monthDate();
    const canvases = await allCanvases(date, (k, n) => msg(t(`Creating page ${k} of ${n}…`, `Création de la page ${k} sur ${n}…`)));
    download(`${fileBase(date)}-guide.pdf`, buildPdf(canvases));
    msg(t("PDF guide downloaded ✓", "Guide PDF téléchargé ✓"));
  }));

  $("#bundle-btn").addEventListener("click", () => run(async () => {
    const date = monthDate();
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
  $("#month-prev").addEventListener("click", () => { monthOffset--; render(); });
  $("#month-next").addEventListener("click", () => { monthOffset++; render(); });

  render();
})();
