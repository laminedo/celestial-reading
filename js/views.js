// Rendering for Year Ahead, Life Cycles, Career & Money extras, Love & Match, Journal & Goals,
// the morning brief and the printable report. app.js passes in its shared helpers.

const Views = (ctx) => {
  const { $, esc, store, fmtDate, tfmt, state } = ctx;
  const ORD = Reading.ORD;
  const day = (d) => fmtDate(d, { weekday: "short", month: "short", day: "numeric" });
  const mon = (d) => fmtDate(d, { month: "short", year: "numeric" });
  const dkey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const checklist = (items) => `<ul class="checks">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
  const bar = (label, pct) => `<div class="bar-row wide"><span>${esc(label)}</span><div class="bar"><i class="score" style="width:${pct}%"></i></div><b>${pct}%</b></div>`;
  const inHouse = (h) => t(`your ${ORD[h]} house`, `votre ${ORD[h]} maison`);
  const hourOf = (k) => t(`${PLANETS[k].name} hour`, `heure de ${PLANETS[k].name}`);

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ---------- morning brief (Today tab) ----------
  function brief(c, R) {
    const H = Destiny.planetaryHours(c, new Date(), c.place);
    const energy = R.areas.reduce((s, a) => s + a.rating, 0) / R.areas.length;
    const next = H.best.find((h) => h.to > new Date()) || H.best[0];
    return `
      <section class="card brief">
        <div class="brief-head"><p class="eyebrow">${t("Your morning brief", "Votre point du matin")}</p><span class="energy">${t("Energy", "Énergie")} ${"●".repeat(Math.round(energy))}${"○".repeat(5 - Math.round(energy))}</span></div>
        <div class="brief-grid">
          <div><small>${t("Best start time", "Meilleur moment")}</small><strong>${tfmt(next.from)}</strong><span>${hourOf(next.planet)}</span></div>
          <div><small>${t("Do this", "À faire")}</small><strong class="txt">${esc(R.todo[0])}</strong></div>
          <div><small>${t("Avoid", "À éviter")}</small><strong class="txt">${esc(R.avoid[0])}</strong></div>
          <div><small>${t("Wear", "À porter")}</small><strong>${esc(R.lucky.color)}</strong><span>${t("Lucky number", "Nombre chanceux")} ${R.lucky.number}</span></div>
        </div>
      </section>`;
  }

  // ---------- year ahead ----------
  const retroTitle = (e) => t(`${PLANETS[e.planet].name} retrograde in ${SIGNS[e.sign].name}`, `${PLANETS[e.planet].name} rétrograde en ${SIGNS[e.sign].name}`);
  const eclipseTitle = (e) => FR
    ? `${e.type === "solar" ? "Éclipse solaire" : "Éclipse lunaire"}${e.minor ? " (pénombrale)" : ""} en ${SIGNS[e.sign].name}`
    : `${e.type === "solar" ? "Solar eclipse" : "Lunar eclipse"}${e.minor ? " (penumbral)" : ""} in ${SIGNS[e.sign].name}`;

  function yearAhead(c) {
    const year = Life.currentSolarYear(c) + state.offset;
    const Y = Life.yearAhead(c, year);
    const now = new Date();
    const plan = state.offset === 0 ? Life.planner(c, now) : Life.planner(c, Y.when);
    return `
      <div class="period-nav">
        <button class="ghost icon" data-nav="-1" aria-label="${t("Previous year", "Année précédente")}">‹</button>
        <div class="period-label"><span>${t("Birthday year", "Année d'anniversaire")} ${year}–${year + 1}</span>
          ${state.offset !== 0 ? `<button class="link" data-nav="reset">${t("Back to this year", "Revenir à cette année")}</button>` : `<small>${t("Starts", "Commence le")} ${fmtDate(Y.when, { month: "long", day: "numeric", year: "numeric" })}</small>`}</div>
        <button class="ghost icon" data-nav="1" aria-label="${t("Next year", "Année suivante")}">›</button>
      </div>
      <section class="card hero-reading">
        <p class="eyebrow">${t("Solar return · personal year", "Retour solaire · année personnelle")} ${Y.personalYear}</p>
        <h2>${esc(HOUSES[Y.sunH].headline)}</h2>
        <p class="overview">${t(`Each birthday the Sun returns to the exact spot it held when you were born. A chart cast for that moment sets the tone for your next 12 months. ${esc(LIFE_PATH[Y.personalYear][0])} energy colors this year in numerology.`,
          `À chaque anniversaire, le Soleil revient exactement à sa position de naissance. Le thème dressé pour ce moment donne le ton de vos 12 prochains mois. En numérologie, l'énergie « ${esc(LIFE_PATH[Y.personalYear][0])} » colore cette année.`)}</p>
        ${Y.approx ? `<p class="note">ⓘ ${t("Add your birth time and city to get the year's rising sign and exact houses.", "Ajoutez votre heure et votre ville de naissance pour obtenir l'ascendant de l'année et des maisons exactes.")}</p>` : ""}
      </section>
      <section class="card">
        <h3>${t("Your year's themes", "Les thèmes de votre année")}</h3>
        <ul class="placements">${Y.themes.map((x) => `<li><div><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></div></li>`).join("")}</ul>
      </section>
      <section class="card">
        <h3>${t("Month by month", "Mois par mois")}</h3>
        <ul class="months two-col">${Y.months.map((m) => `<li class="${m.best ? "best" : ""}"><strong>${mon(m.date)}</strong><span>${m.best ? "★ " : ""}${esc(m.reasons.slice(0, 2).join(" · ") || t("Steady month: keep routines going", "Mois stable : gardez vos routines"))}</span></li>`).join("")}</ul>
      </section>
      <section class="card">
        <div class="row-head"><h3>${t("Retrograde & eclipse planner", "Rétrogradations et éclipses")}</h3><button class="ghost small" id="ics-btn">${t("Add to calendar", "Ajouter au calendrier")}</button></div>
        <p class="small-p">${state.offset === 0 ? t("The next 12 months", "Les 12 prochains mois") : t("This birthday year", "Cette année d'anniversaire")}. ${t("The calendar file includes a reminder the day before each one.", "Le fichier calendrier inclut un rappel la veille de chaque événement.")}</p>
        <ol class="timeline">${plan.map((e) => e.kind === "retro" ? `
          <li><time>${day(e.from)}${e.to ? ` – ${day(e.to)}` : ""}</time>
            <div><strong>℞ ${retroTitle(e)}</strong><p>${t("Affects", "Touche")} ${inHouse(e.house)} : ${esc(HOUSES[e.house].short)}.</p>${checklist(e.check)}</div></li>` : `
          <li><time>${day(e.date)}</time>
            <div><strong>${e.type === "solar" ? "🌑" : "🌕"} ${eclipseTitle(e)}</strong><p>${e.type === "solar" ? t("A powerful new beginning", "Un puissant nouveau départ") : t("A turning point or ending", "Un tournant ou une fin")} ${t("in", "dans")} ${inHouse(e.house)} : ${esc(HOUSES[e.house].short)}.</p>${checklist(e.check)}</div></li>`).join("")}</ol>
      </section>`.replace(/ : /g, FR ? " : " : ": ");
  }

  function bindYear(c) {
    const btn = $("#ics-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const Y = Life.yearAhead(c, Life.currentSolarYear(c) + state.offset);
      const plan = state.offset === 0 ? Life.planner(c, new Date()) : Life.planner(c, Y.when);
      const events = plan.map((e) => e.kind === "retro"
        ? { start: e.from, end: e.to || e.from, title: retroTitle(e), text: e.check.join(". ") }
        : { start: e.date, title: eclipseTitle(e), text: e.check.join(". ") });
      const life = Life.lifeCycles(c).filter((e) => e.status !== "past").slice(0, 6)
        .map((e) => ({ start: e.from, title: e.title, text: `${e.what} ${t("Prepare:", "Préparation :")} ${e.prep.join(". ")}` }));
      events.push({ start: Y.when, title: t(`Birthday year ${Y.year} begins`, `Début de l'année d'anniversaire ${Y.year}`), text: Y.themes.map((x) => x.title).join(". ") });
      download(t("celestial-calendar.ics", "celestial-calendrier.ics"), Life.ics([...events, ...life]), "text/calendar");
    });
  }

  // ---------- life cycles ----------
  function lifeCycles(c) {
    const L = Life.lifeCycles(c);
    const now = L.filter((e) => e.status === "now");
    const next = L.filter((e) => e.status === "future").slice(0, 3);
    const past = L.filter((e) => e.status === "past");
    const age = (e) => `${t("Age", "Âge")} ${e.approx ? "~" : ""}${e.age}`;
    const item = (e) => `
      <li class="${e.status}"><time>${age(e)} · ${e.approx ? e.from.getFullYear() : mon(e.from)}${!e.approx && e.to - e.from > 30 * Astro.DAY ? ` – ${mon(e.to)}` : ""}</time>
        <div><strong>${esc(e.title)}${e.status === "now" ? t(" · happening now", " · en ce moment") : ""}</strong><p>${esc(e.what)}</p>${e.status !== "past" ? `<h5>${t("How to prepare", "Comment se préparer")}</h5>${checklist(e.prep)}` : ""}</div></li>`;
    const headline = now.length ? t(`Right now: ${esc(now[0].title)}`, `En ce moment : ${esc(now[0].title)}`)
      : next.length ? t(`Next up: ${esc(next[0].title)} at ${next[0].approx ? "about " : ""}age ${next[0].age}`, `Prochaine étape : ${esc(next[0].title)} vers ${next[0].age} ans`)
      : t("Your life cycles", "Vos cycles de vie");
    return `
      <section class="card hero-reading">
        <p class="eyebrow">${t("Your life's turning points", "Les tournants de votre vie")}</p>
        <h2>${headline}</h2>
        <p class="overview">${t("Saturn (about every 7 years) and Jupiter (every 12 years) mark the big chapters of life. Knowing when they arrive helps you prepare instead of being surprised. Saturn and Jupiter dates are calculated for your chart; the others are typical ages.",
          "Saturne (environ tous les 7 ans) et Jupiter (tous les 12 ans) marquent les grands chapitres de la vie. Savoir quand ils arrivent vous aide à vous préparer au lieu d'être surpris. Les dates de Saturne et de Jupiter sont calculées pour votre thème ; les autres sont des âges typiques.")}</p>
      </section>
      ${now.length ? `<section class="card now-card"><h3>${t("Happening now", "En ce moment")}</h3><ol class="timeline life">${now.map(item).join("")}</ol></section>` : ""}
      <section class="card"><h3>${t("Coming up", "À venir")}</h3><ol class="timeline life">${next.map(item).join("")}</ol></section>
      <section class="card">
        <h3>${t("Your full life timeline", "Toute la chronologie de votre vie")}</h3>
        <ol class="timeline life compact">${L.filter((e) => e.status === "future").slice(3).map(item).join("")}</ol>
        <details class="past"><summary>${t(`Show ${past.length} past milestones`, `Afficher ${past.length} étapes passées`)}</summary><ol class="timeline life compact">${past.map(item).join("")}</ol></details>
      </section>`;
  }

  // ---------- career & money extras ----------
  function careerExtras(c) {
    const M = Life.moneyStyle(c);
    const T = Life.careerTiming(c, c.place);
    return `
      <section class="card">
        <p class="eyebrow">${t("Your money style", "Votre style financier")}</p>
        <h2>${esc(M.name)}</h2>
        <p class="overview">${esc(M.text)} ${t(`Your money house is ${SIGNS[M.second].name} (${M.element}).`, `Votre maison de l'argent est en ${SIGNS[M.second].name} (${elName(M.element)}).`)}</p>
        <div class="grid-2 inner">
          <div><h4>${t("Blind spot", "Point faible")}</h4><p class="small-p">${esc(M.blind)}</p><h4 class="mt">${t("Habits that work for you", "Les habitudes qui vous réussissent")}</h4>${checklist(M.tips)}</div>
          <div><ul class="placements tight">
            <li><div><strong>${t("Spending", "Dépenses")}</strong><p>${esc(M.venus)}</p></div></li>
            <li><div><strong>${t("Growth", "Croissance")}</strong><p>${esc(M.jupiter)}</p></div></li>
            <li><div><strong>${t("Lesson", "Leçon")}</strong><p>${esc(M.saturn)}</p></div></li>
            <li><div><strong>${t("Loans & investing", "Prêts et placements")}</strong><p>${esc(M.shared)}</p></div></li></ul></div>
        </div>
        <p class="hint">${t("For reflection, not financial advice. For investment decisions, talk to a licensed financial advisor.", "Pour réfléchir, pas un conseil financier. Pour vos placements, consultez un conseiller financier agréé.")}</p>
      </section>
      <section class="card">
        <h3>${t("Career timing: best dates in the next 60 days", "Calendrier de carrière : meilleures dates des 60 prochains jours")}</h3>
        <div class="timing">${T.map((a) => `
          <div class="timing-col"><h4>${a.icon} ${esc(a.label)}</h4>
            <ol>${a.picks.map((p) => `<li><b>${day(p.date)}</b>${p.hour ? ` · ${tfmt(p.hour.from)} (${hourOf(p.hour.planet)})` : ""}<small>${esc(p.why)}</small></li>`).join("")}</ol>
            ${a.note ? `<p class="hint">${esc(a.note)}</p>` : ""}</div>`).join("")}</div>
      </section>`;
  }

  // ---------- love & match ----------
  function love(c) {
    const P = Destiny.partner(c);
    const others = ctx.profiles().filter((p) => p.id !== ctx.activeId());
    const last = store.get("celestial.match") || {};
    return `
      <section class="card hero-reading">
        <p class="eyebrow">${t("Your ideal partner", "Votre partenaire idéal")}</p>
        <h2>${esc(P.headline)}</h2>
        <p class="overview">${esc(P.ideal)} ${esc(P.loveText)}</p>
        <div class="grid-2 inner">
          <div><h4>${t("Most compatible signs", "Signes les plus compatibles")}</h4><div class="badges">${P.best.map(ctx.signChip).join("")}</div></div>
          <div><h4>${t("Takes more work", "Demandent plus d'efforts")}</h4><div class="badges">${P.challenge.map((i) => `<span class="badge warn">${SIGNS[i].glyph} ${SIGNS[i].name}</span>`).join("")}</div></div>
        </div>
        <p class="small-p mt-s">${t(`Life Path match: partners with Life Path ${P.lpMatch.numbers.join(", ")} share your number family.`, `Affinité de chemin de vie : les partenaires de chemin de vie ${P.lpMatch.numbers.join(", ")} partagent votre famille de nombres.`)}</p>
        ${P.approx ? ctx.precisionNote(t("partner reading with your Descendant", "une lecture amoureuse avec votre Descendant")) : ""}
      </section>
      <section class="card">
        <h3>${t("What you need in love", "Ce dont vous avez besoin en amour")}</h3>
        <ul class="placements">${P.points.map((p) => `<li><div><strong>${esc(p.title)}</strong><p>${esc(p.text)}</p></div></li>`).join("")}</ul>
      </section>
      <section class="card">
        <h3>${t("Compatibility checker", "Test de compatibilité")}</h3>
        <p class="small-p">${t("Compare your chart with a partner, crush, friend or business partner.", "Comparez votre thème avec celui d'un partenaire, d'un coup de cœur, d'un ami ou d'un associé.")}</p>
        <form id="match-form" class="match-form" autocomplete="off">
          ${others.length ? `<label class="field"><span>${t("Saved person", "Personne enregistrée")}</span><select name="pick"><option value="">${t("Enter details below", "Saisir les infos ci-dessous")}</option>${others.map((p) => `<option value="${esc(p.id)}" ${last.pick === p.id ? "selected" : ""}>${esc(p.birth.name || t("Unnamed", "Sans nom"))} · ${esc(p.birth.date)}</option>`).join("")}</select></label>` : ""}
          <div class="row3">
            <label class="field"><span>${t("Their name", "Son prénom")}</span><input name="name" maxlength="40" placeholder="${t("e.g. Sam", "ex. Sam")}" value="${esc(last.name || "")}"></label>
            <label class="field"><span>${t("Birth date", "Date de naissance")}</span><input name="date" inputmode="numeric" placeholder="${t("MM / DD / YYYY", "JJ / MM / AAAA")}" maxlength="14" value="${esc(last.date || "")}"></label>
            <label class="field"><span>${t("Birth time", "Heure de naissance")} <em>${t("(optional)", "(facultatif)")}</em></span><input name="time" type="time" value="${esc(last.time || "")}"></label>
          </div>
          <p class="field-error" id="match-error"></p>
          <button class="primary" type="submit">${t("Check compatibility ♥", "Tester la compatibilité ♥")}</button>
        </form>
        <div id="match-result"></div>
      </section>`;
  }

  function matchResult(c, other) {
    const S = Life.synastry(c, other);
    const nm = esc(other.name || t("them", "l'autre"));
    return `
      <div class="match-card">
        <div class="score-ring" style="--p:${S.overall}"><span>${S.overall}%</span></div>
        <div><p class="eyebrow">${t("You", "Vous")} & ${nm}</p><h3>${esc(S.verdict)}</h3>
          <p class="small-p">${SIGNS[c.signs.sun].glyph} ${SIGNS[c.signs.sun].name} + ${SIGNS[other.signs.sun].glyph} ${SIGNS[other.signs.sun].name}. ${esc(S.elements)}</p></div>
      </div>
      ${Object.values(S.cats).map((x) => bar(x.label, x.pct)).join("")}
      <div class="grid-2 inner">
        <div><h4>${t("Strengths", "Points forts")}</h4><p class="small-p">${S.strengths.length ? esc(S.strengths.join(", ")) : t("A balanced match with no single standout area.", "Une entente équilibrée, sans domaine qui se démarque.")}</p>
          <h4 class="mt">${t("Watch out for", "Points de vigilance")}</h4><p class="small-p">${S.friction.length ? esc(S.friction.join(", ")) : t("No major friction points.", "Pas de friction majeure.")}</p></div>
        <div><h4>${t("Tips for you two", "Conseils pour vous deux")}</h4>${checklist(S.tips)}<p class="small-p">${esc(S.lifePath)}</p></div>
      </div>
      ${other.time ? "" : `<p class="hint">${t("Without their birth time, their Moon sign may be off by one sign.", "Sans son heure de naissance, son signe lunaire peut être décalé d'un signe.")}</p>`}`;
  }

  function bindLove(c) {
    const form = $("#match-form");
    if (!form) return;
    const out = $("#match-result"), err = $("#match-error");
    const dateIn = form.elements.date;
    dateIn.addEventListener("input", (e) => { dateIn.value = ctx.formatTypedDate(dateIn.value, !(e.inputType || "").startsWith("delete")); err.textContent = ""; });
    const run = (silent) => {
      const pick = form.elements.pick ? form.elements.pick.value : "";
      let birth;
      if (pick) birth = ctx.profiles().find((p) => p.id === pick)?.birth;
      else {
        if (!dateIn.value.trim()) { if (!silent) err.textContent = t("Enter their birth date.", "Saisissez sa date de naissance."); return; }
        const parsed = ctx.parseTypedDate(dateIn.value);
        if (parsed.error) { if (!silent) err.textContent = parsed.error; return; }
        birth = { name: form.elements.name.value.trim(), date: parsed.iso, time: form.elements.time.value, tz: "auto" };
      }
      if (!birth) return;
      store.set("celestial.match", { pick, name: form.elements.name.value, date: dateIn.value, time: form.elements.time.value });
      const other = Reading.natal(birth);
      other.name = birth.name; other.time = birth.time;
      out.innerHTML = matchResult(c, other);
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); run(false); });
    if (form.elements.pick) form.elements.pick.addEventListener("change", () => run(true));
    run(true);
  }

  // ---------- journal & moon goals ----------
  const MOODS = ["😞", "😕", "😐", "🙂", "😄"];
  function cycleNow(date = new Date()) {
    const ev = Astro.phaseEvents(new Date(date.getTime() - 32 * Astro.DAY), new Date(date.getTime() + 32 * Astro.DAY));
    const news = ev.filter((e) => e.quarter === 0);
    const start = [...news].reverse().find((e) => e.date <= date);
    const end = news.find((e) => e.date > date);
    const full = ev.find((e) => e.quarter === 2 && start && e.date > start.date);
    return { start: start.date, end: end.date, full: full.date, sign: Astro.signOf(start.moonLon) };
  }

  function journal(c) {
    const cyc = cycleNow();
    const key = dkey(cyc.start);
    const goals = store.get("celestial.goals") || {};
    const g = goals[key] || {};
    const today = dkey(new Date());
    const J = store.get("celestial.journal") || {};
    const entry = J[today] || {};
    const stage = new Date() < cyc.full ? "set" : "check";
    const house = Reading.solarHouse(cyc.sign, c.houseSign);
    const entries = Object.entries(J).sort((a, b) => b[0].localeCompare(a[0]));
    const pastGoals = Object.entries(goals).filter(([k]) => k !== key).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    return `
      <section class="card hero-reading">
        <p class="eyebrow">${t("Moon cycle", "Cycle lunaire")} ${fmtDate(cyc.start)} – ${fmtDate(cyc.end)}</p>
        <h2>${stage === "set" ? t("Set your intention", "Fixez votre intention") : t("Full Moon check-in", "Point de Pleine Lune")}</h2>
        <p class="overview">${t(`This cycle began with a New Moon in ${SIGNS[cyc.sign].name}, in your ${ORD[house]} house: a natural time to set goals around ${esc(HOUSES[house].short)}. Set a goal at the New Moon, check in at the Full Moon (${fmtDate(cyc.full)}), and review before the next New Moon (${fmtDate(cyc.end)}).`,
          `Ce cycle a commencé par une Nouvelle Lune en ${SIGNS[cyc.sign].name}, dans votre ${ORD[house]} maison : le moment idéal pour vous fixer des objectifs autour ${esc(de(HOUSES[house].short))}. Fixez un objectif à la Nouvelle Lune, faites le point à la Pleine Lune (${fmtDate(cyc.full)}) et faites le bilan avant la prochaine Nouvelle Lune (${fmtDate(cyc.end)}).`)}</p>
      </section>
      <div class="grid-2">
        <section class="card">
          <h3>${t("This cycle's goal", "L'objectif de ce cycle")}</h3>
          <form id="goal-form" class="stack">
            <label class="field"><span>${t("My intention", "Mon intention")}</span><textarea name="goal" rows="2" maxlength="300" placeholder="${t("e.g. Save $200 and apply to two new jobs", "ex. Épargner 100 000 FCFA et postuler à deux offres")}">${esc(g.goal || "")}</textarea></label>
            <label class="field"><span>${t("First small step", "Premier petit pas")}</span><input name="step" maxlength="160" value="${esc(g.step || "")}" placeholder="${t("e.g. Update my résumé on Saturday", "ex. Mettre à jour mon CV samedi")}"></label>
            <label class="field"><span>${t("Full Moon check-in: progress so far", "Point de Pleine Lune : progrès réalisés")}</span>
              <div class="range-row"><input type="range" name="progress" min="0" max="100" step="10" value="${g.progress || 0}"><b id="prog-val">${g.progress || 0}%</b></div></label>
            <label class="field"><span>${t("Notes and what I learned", "Notes et leçons apprises")}</span><textarea name="review" rows="2" maxlength="400" placeholder="${t("What worked? What will you change next cycle?", "Qu'est-ce qui a marché ? Que changerez-vous au prochain cycle ?")}">${esc(g.review || "")}</textarea></label>
            <button class="primary" type="submit">${t("Save goal", "Enregistrer l'objectif")}</button>
            <p class="saved-msg" id="goal-saved" aria-live="polite"></p>
          </form>
          ${pastGoals.length ? `<h4 class="mt">${t("Past cycles", "Cycles précédents")}</h4><ul class="past-goals">${pastGoals.map(([k, v]) => `<li><b>${fmtDate(new Date(k + "T12:00"))}</b> ${esc(v.goal || t("No goal written", "Aucun objectif écrit"))} <span class="gold">${v.progress || 0}%</span></li>`).join("")}</ul>` : ""}
        </section>
        <section class="card">
          <h3>${t("Today's journal", "Journal du jour")}</h3>
          <form id="journal-form" class="stack">
            <div class="moods" role="radiogroup" aria-label="${t("Mood", "Humeur")}">${MOODS.map((m, i) => `<label><input type="radio" name="mood" value="${i + 1}" ${entry.mood === i + 1 ? "checked" : ""}><span>${m}</span></label>`).join("")}</div>
            <label class="field"><span>${t("How did today go?", "Comment s'est passée votre journée ?")}</span><textarea name="note" rows="4" maxlength="1000" placeholder="${t("Wins, worries, things you noticed…", "Victoires, soucis, choses remarquées…")}">${esc(entry.note || "")}</textarea></label>
            <button class="primary" type="submit">${t("Save entry", "Enregistrer")}</button>
            <p class="saved-msg" id="journal-saved" aria-live="polite"></p>
          </form>
          <div id="patterns">${patterns(entries)}</div>
        </section>
      </div>
      <section class="card">
        <h3>${t("Recent entries", "Entrées récentes")}</h3>
        ${entries.length ? `<ul class="entries">${entries.slice(0, 14).map(([k, v]) => `<li><span class="mood">${MOODS[(v.mood || 3) - 1]}</span><div><b>${fmtDate(new Date(k + "T12:00"), { weekday: "short", month: "short", day: "numeric" })}</b> <small>${t("Moon in", "Lune en")} ${SIGNS[v.moonSign]?.name || "?"} · ${esc(PHASES[v.phase]?.name || "")}</small><p>${esc(v.note || "")}</p></div></li>`).join("")}</ul>` : `<p class="small-p">${t("No entries yet. Write a line a day and your patterns will appear here.", "Pas encore d'entrées. Écrivez une ligne par jour et vos tendances apparaîtront ici.")}</p>`}
        <p class="hint">${t("Your journal and goals stay private in this browser on this device.", "Votre journal et vos objectifs restent privés dans ce navigateur, sur cet appareil.")}</p>
      </section>`;
  }

  function patterns(entries) {
    const rated = entries.filter(([, v]) => v.mood);
    const left = 5 - rated.length;
    if (rated.length < 5) return `<p class="hint">${t(`Rate your mood for ${left} more day${left === 1 ? "" : "s"} to see how the Moon lines up with your moods.`, `Notez votre humeur encore ${left} jour${left === 1 ? "" : "s"} pour voir le lien entre la Lune et vos humeurs.`)}</p>`;
    const avg = (list) => list.length ? list.reduce((s, [, v]) => s + v.mood, 0) / list.length : null;
    const byEl = ["Fire", "Earth", "Air", "Water"].map((el) => [el, avg(rated.filter(([, v]) => SIGNS[v.moonSign]?.element === el))]).filter(([, a]) => a !== null);
    const groups = [[t("New Moon", "Nouvelle Lune"), [0, 7]], [t("Waxing", "Croissante"), [1, 2, 3]], [t("Full Moon", "Pleine Lune"), [4]], [t("Waning", "Décroissante"), [5, 6]]];
    const byPh = groups.map(([n, idx]) => [n, avg(rated.filter(([, v]) => idx.includes(v.phase)))]).filter(([, a]) => a !== null);
    const best = [...byEl].sort((a, b) => b[1] - a[1])[0];
    const rows = (list) => list.map(([n, a]) => bar(n, Math.round((a / 5) * 100))).join("");
    return `<h4 class="mt">${t("Your patterns", "Vos tendances")}</h4><p class="small-p">${t(`Your best moods come when the Moon is in a ${best[0]} sign.`, `Votre meilleure humeur arrive quand la Lune est dans un signe ${FR ? { Fire: "de Feu", Earth: "de Terre", Air: "d'Air", Water: "d'Eau" }[best[0]] : best[0]}.`)}</p>${rows(byEl.map(([el, a]) => [elName(el), a]))}${rows(byPh)}`;
  }

  function bindJournal() {
    const gf = $("#goal-form"), jf = $("#journal-form");
    if (!gf) return;
    const cyc = cycleNow(), key = dkey(cyc.start);
    gf.elements.progress.addEventListener("input", () => ($("#prog-val").textContent = gf.elements.progress.value + "%"));
    gf.addEventListener("submit", (e) => {
      e.preventDefault();
      const goals = store.get("celestial.goals") || {};
      goals[key] = { goal: gf.elements.goal.value.trim(), step: gf.elements.step.value.trim(), progress: Number(gf.elements.progress.value), review: gf.elements.review.value.trim() };
      store.set("celestial.goals", goals);
      $("#goal-saved").textContent = t("Saved ✓", "Enregistré ✓");
    });
    jf.addEventListener("submit", (e) => {
      e.preventDefault();
      const J = store.get("celestial.journal") || {};
      const now = new Date();
      const mood = jf.querySelector("input[name=mood]:checked");
      J[dkey(now)] = { mood: mood ? Number(mood.value) : null, note: jf.elements.note.value.trim(), moonSign: Astro.signOf(Astro.longitudes(now).moon), phase: Astro.phase(now).index };
      store.set("celestial.journal", J);
      ctx.rerender();
      const msg = $("#journal-saved"); if (msg) msg.textContent = t("Saved ✓", "Enregistré ✓");
    });
  }

  // ---------- printable report ----------
  function report(c) {
    const K = Destiny.career(c), P = Destiny.partner(c), M = Life.moneyStyle(c);
    const Y = Life.yearAhead(c, Life.currentSolarYear(c));
    const L = Life.lifeCycles(c).filter((e) => e.status !== "past").slice(0, 5);
    const J = Destiny.jupiterYears(c).slice(0, 6);
    const N = Destiny.personalNumbers(c, state.birth);
    const sun = SIGNS[c.signs.sun];
    const sec = (title, body) => `<section class="r-sec"><h2>${title}</h2>${body}</section>`;
    const big3 = FR
      ? `Soleil en ${sun.name} · Lune en ${SIGNS[c.signs.moon].name}${c.rising !== null ? ` · Ascendant ${SIGNS[c.rising].name}` : ""}`
      : `${sun.name} Sun · ${SIGNS[c.signs.moon].name} Moon${c.rising !== null ? ` · ${SIGNS[c.rising].name} Rising` : ""}`;
    return `
      <header class="r-head"><p>✧ Celestial Reading</p><h1>${c.name ? t(`${esc(c.name)}'s birth chart report`, `Thème natal de ${esc(c.name)}`) : t("Your birth chart report", "Votre thème natal")}</h1>
        <p>${esc(fmtDate(new Date(state.birth.date + "T12:00"), { dateStyle: "long" }))}${state.birth.time ? ` · ${esc(state.birth.time)}` : ""}${state.birth.placeLabel ? ` · ${esc(state.birth.placeLabel)}` : ""} · ${t("generated", "généré le")} ${fmtDate(new Date(), { dateStyle: "medium" })}</p></header>
      ${sec(t("Your chart", "Votre thème"), `<p><b>${big3}</b> · ${t("Life Path", "Chemin de vie")} ${c.lifePath.number} · ${c.chinese.element} ${c.chinese.animal}</p>
        <p>${esc(sun.summary)}</p>
        <table>${Reading.PLANET_KEYS.map((k) => `<tr><td>${PLANETS[k].name}</td><td>${SIGNS[c.signs[k]].name} ${Astro.degreeInSign(c.lon[k]).toFixed(0)}°${c.rising !== null ? `, ${t(`${ORD[c.houses[k]]} house`, `${ORD[c.houses[k]]} maison`)}` : ""}</td><td>${esc(Reading.placementText(k, c))}</td></tr>`).join("")}</table>`)}
      ${sec(t("Career", "Carrière"), `<p>${esc(K.style)} ${esc(K.lp)}</p><p><b>${t("Best fields:", "Meilleurs domaines :")}</b> ${esc(K.fields.join(", "))}.</p><p>${esc(K.money.text)}</p>`)}
      ${sec(t("Money style: ", "Style financier : ") + esc(M.name), `<p>${esc(M.text)}</p><p><b>${t("Blind spot:", "Point faible :")}</b> ${esc(M.blind)}</p><ul>${M.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`)}
      ${sec(t("Love", "Amour"), `<p>${esc(P.ideal)}</p><p><b>${t("Most compatible:", "Plus compatibles :")}</b> ${P.best.map((i) => SIGNS[i].name).join(", ")}. ${esc(P.loveText)}</p>`)}
      ${sec(`${t("Year ahead", "Année à venir")} (${Y.year}–${Y.year + 1})`, `<ul>${Y.themes.map((x) => `<li><b>${esc(x.title)}.</b> ${esc(x.text)}</li>`).join("")}</ul>`)}
      ${sec(t("Coming life cycles", "Prochains cycles de vie"), `<ul>${L.map((e) => `<li><b>${t("Age", "Âge")} ${e.approx ? "~" : ""}${e.age}, ${e.from.getFullYear()} : ${esc(e.title)}.</b> ${esc(e.what)} ${t("Prepare:", "Préparation :")} ${esc(e.prep.join("; "))}.</li>`.replace(" : ", FR ? " : " : ": ")).join("")}</ul>`)}
      ${sec(t("Lucky years and numbers", "Années de chance et nombres"), `<ul>${J.map((p) => `<li>${p.from ? mon(p.from) : t("Now", "Maintenant")} – ${p.to ? mon(p.to) : t("later", "plus tard")} : ${t(`Jupiter in your ${ORD[p.house]} house.`, `Jupiter dans votre ${ORD[p.house]} maison.`)} ${esc(p.text)}</li>`.replace(" : ", FR ? " : " : ": ")).join("")}</ul><p>${t("Your numbers:", "Vos nombres :")} ${N.set.join(", ")}. ${t("Personal year", "Année personnelle")} ${N.personalYear}.</p>`)}
      <p class="r-foot">${t("For reflection and entertainment. Not financial, medical or legal advice.", "Pour la réflexion et le divertissement. Ni conseil financier, ni médical, ni juridique.")}</p>`;
  }

  return { brief, yearAhead, bindYear, lifeCycles, careerExtras, love, bindLove, journal, bindJournal, report };
};
