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
        <div class="brief-head"><p class="eyebrow">Your morning brief</p><span class="energy">Energy ${"●".repeat(Math.round(energy))}${"○".repeat(5 - Math.round(energy))}</span></div>
        <div class="brief-grid">
          <div><small>Best start time</small><strong>${tfmt(next.from)}</strong><span>${PLANETS[next.planet].name} hour</span></div>
          <div><small>Do this</small><strong class="txt">${esc(R.todo[0])}</strong></div>
          <div><small>Avoid</small><strong class="txt">${esc(R.avoid[0])}</strong></div>
          <div><small>Wear</small><strong>${esc(R.lucky.color)}</strong><span>Lucky number ${R.lucky.number}</span></div>
        </div>
      </section>`;
  }

  // ---------- year ahead ----------
  function yearAhead(c) {
    const year = Life.currentSolarYear(c) + state.offset;
    const Y = Life.yearAhead(c, year);
    const now = new Date();
    const plan = state.offset === 0 ? Life.planner(c, now) : Life.planner(c, Y.when);
    const retroName = (p) => `${PLANETS[p.planet].name} retrograde`;
    return `
      <div class="period-nav">
        <button class="ghost icon" data-nav="-1" aria-label="Previous year">‹</button>
        <div class="period-label"><span>Birthday year ${year}–${year + 1}</span>
          ${state.offset !== 0 ? `<button class="link" data-nav="reset">Back to this year</button>` : `<small>Starts ${fmtDate(Y.when, { month: "long", day: "numeric", year: "numeric" })}</small>`}</div>
        <button class="ghost icon" data-nav="1" aria-label="Next year">›</button>
      </div>
      <section class="card hero-reading">
        <p class="eyebrow">Solar return · personal year ${Y.personalYear}</p>
        <h2>${esc(HOUSES[Y.sunH].headline)}</h2>
        <p class="overview">Each birthday the Sun returns to the exact spot it held when you were born. A chart cast for that moment sets the tone for your next 12 months. ${esc(LIFE_PATH[Y.personalYear][0])} energy colors this year in numerology.</p>
        ${Y.approx ? `<p class="note">ⓘ Add your birth time and city to get the year's rising sign and exact houses.</p>` : ""}
      </section>
      <section class="card">
        <h3>Your year's themes</h3>
        <ul class="placements">${Y.themes.map((t) => `<li><div><strong>${esc(t.title)}</strong><p>${esc(t.text)}</p></div></li>`).join("")}</ul>
      </section>
      <section class="card">
          <h3>Month by month</h3>
          <ul class="months two-col">${Y.months.map((m) => `<li class="${m.best ? "best" : ""}"><strong>${mon(m.date)}</strong><span>${m.best ? "★ " : ""}${esc(m.reasons.slice(0, 2).join(" · ") || "Steady month: keep routines going")}</span></li>`).join("")}</ul>
        </section>
      <section class="card">
          <div class="row-head"><h3>Retrograde & eclipse planner</h3><button class="ghost small" id="ics-btn">Add to calendar</button></div>
          <p class="small-p">${state.offset === 0 ? "The next 12 months" : "This birthday year"}. The calendar file includes a reminder the day before each one.</p>
          <ol class="timeline">${plan.map((e) => e.kind === "retro" ? `
            <li><time>${day(e.from)}${e.to ? ` – ${day(e.to)}` : ""}</time>
              <div><strong>℞ ${retroName(e)} in ${SIGNS[e.sign].name}</strong><p>Affects your ${ORD[e.house]} house: ${esc(HOUSES[e.house].short)}.</p>${checklist(e.check)}</div></li>` : `
            <li><time>${day(e.date)}</time>
              <div><strong>${e.type === "solar" ? "🌑 Solar eclipse" : "🌕 Lunar eclipse"}${e.minor ? " (penumbral)" : ""} in ${SIGNS[e.sign].name}</strong><p>${e.type === "solar" ? "A powerful new beginning" : "A turning point or ending"} in your ${ORD[e.house]} house: ${esc(HOUSES[e.house].short)}.</p>${checklist(e.check)}</div></li>`).join("")}</ol>
        </section>`;
  }

  function bindYear(c) {
    const btn = $("#ics-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const Y = Life.yearAhead(c, Life.currentSolarYear(c) + state.offset);
      const plan = state.offset === 0 ? Life.planner(c, new Date()) : Life.planner(c, Y.when);
      const events = plan.map((e) => e.kind === "retro"
        ? { start: e.from, end: e.to || e.from, title: `${PLANETS[e.planet].name} retrograde in ${SIGNS[e.sign].name}`, text: e.check.join(". ") }
        : { start: e.date, title: `${e.type === "solar" ? "Solar" : "Lunar"} eclipse in ${SIGNS[e.sign].name}`, text: e.check.join(". ") });
      const life = Life.lifeCycles(c).filter((e) => e.status !== "past").slice(0, 6)
        .map((e) => ({ start: e.from, title: e.title, text: `${e.what} Prepare: ${e.prep.join(". ")}` }));
      events.push({ start: Y.when, title: `Birthday year ${Y.year} begins`, text: Y.themes.map((t) => t.title).join(". ") });
      download("celestial-calendar.ics", Life.ics([...events, ...life]), "text/calendar");
    });
  }

  // ---------- life cycles ----------
  function lifeCycles(c) {
    const L = Life.lifeCycles(c);
    const now = L.filter((e) => e.status === "now");
    const next = L.filter((e) => e.status === "future").slice(0, 3);
    const past = L.filter((e) => e.status === "past");
    const item = (e) => `
      <li class="${e.status}"><time>Age ${e.approx ? "~" : ""}${e.age} · ${e.approx ? e.from.getFullYear() : mon(e.from)}${!e.approx && e.to - e.from > 30 * Astro.DAY ? ` – ${mon(e.to)}` : ""}</time>
        <div><strong>${esc(e.title)}${e.status === "now" ? " · happening now" : ""}</strong><p>${esc(e.what)}</p>${e.status !== "past" ? `<h5>How to prepare</h5>${checklist(e.prep)}` : ""}</div></li>`;
    return `
      <section class="card hero-reading">
        <p class="eyebrow">Your life's turning points</p>
        <h2>${now.length ? `Right now: ${esc(now[0].title)}` : next.length ? `Next up: ${esc(next[0].title)} at ${next[0].approx ? "about " : ""}age ${next[0].age}` : "Your life cycles"}</h2>
        <p class="overview">Saturn (about every 7 years) and Jupiter (every 12 years) mark the big chapters of life. Knowing when they arrive helps you prepare instead of being surprised. Saturn and Jupiter dates are calculated for your chart; the others are typical ages.</p>
      </section>
      ${now.length ? `<section class="card now-card"><h3>Happening now</h3><ol class="timeline life">${now.map(item).join("")}</ol></section>` : ""}
      <section class="card"><h3>Coming up</h3><ol class="timeline life">${next.map(item).join("")}</ol></section>
      <section class="card">
        <h3>Your full life timeline</h3>
        <ol class="timeline life compact">${L.filter((e) => e.status === "future").slice(3).map(item).join("")}</ol>
        <details class="past"><summary>Show ${past.length} past milestones</summary><ol class="timeline life compact">${past.map(item).join("")}</ol></details>
      </section>`;
  }

  // ---------- career & money extras ----------
  function careerExtras(c) {
    const M = Life.moneyStyle(c);
    const T = Life.careerTiming(c, c.place);
    return `
      <section class="card">
        <p class="eyebrow">Your money style</p>
        <h2>${esc(M.name)}</h2>
        <p class="overview">${esc(M.text)} Your money house is ${SIGNS[M.second].name} (${M.element}).</p>
        <div class="grid-2 inner">
          <div><h4>Blind spot</h4><p class="small-p">${esc(M.blind)}</p><h4 class="mt">Habits that work for you</h4>${checklist(M.tips)}</div>
          <div><ul class="placements tight">
            <li><div><strong>Spending</strong><p>${esc(M.venus)}</p></div></li>
            <li><div><strong>Growth</strong><p>${esc(M.jupiter)}</p></div></li>
            <li><div><strong>Lesson</strong><p>${esc(M.saturn)}</p></div></li>
            <li><div><strong>Loans & investing</strong><p>${esc(M.shared)}</p></div></li></ul></div>
        </div>
        <p class="hint">For reflection, not financial advice. For investment decisions, talk to a licensed financial advisor.</p>
      </section>
      <section class="card">
        <h3>Career timing: best dates in the next 60 days</h3>
        <div class="timing">${T.map((a) => `
          <div class="timing-col"><h4>${a.icon} ${esc(a.label)}</h4>
            <ol>${a.picks.map((p) => `<li><b>${day(p.date)}</b>${p.hour ? ` · ${tfmt(p.hour.from)} (${PLANETS[p.hour.planet].name} hour)` : ""}<small>${esc(p.why)}</small></li>`).join("")}</ol>
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
        <p class="eyebrow">Your ideal partner</p>
        <h2>${esc(P.headline)}</h2>
        <p class="overview">${esc(P.ideal)} ${esc(P.loveText)}</p>
        <div class="grid-2 inner">
          <div><h4>Most compatible signs</h4><div class="badges">${P.best.map(ctx.signChip).join("")}</div></div>
          <div><h4>Takes more work</h4><div class="badges">${P.challenge.map((i) => `<span class="badge warn">${SIGNS[i].glyph} ${SIGNS[i].name}</span>`).join("")}</div></div>
        </div>
        <p class="small-p mt-s">Life Path match: partners with Life Path ${P.lpMatch.numbers.join(", ")} share your number family.</p>
        ${P.approx ? ctx.precisionNote("partner reading with your Descendant") : ""}
      </section>
      <section class="card">
        <h3>What you need in love</h3>
        <ul class="placements">${P.points.map((p) => `<li><div><strong>${esc(p.title)}</strong><p>${esc(p.text)}</p></div></li>`).join("")}</ul>
      </section>
      <section class="card">
        <h3>Compatibility checker</h3>
        <p class="small-p">Compare your chart with a partner, crush, friend or business partner.</p>
        <form id="match-form" class="match-form" autocomplete="off">
          ${others.length ? `<label class="field"><span>Saved person</span><select name="pick"><option value="">Enter details below</option>${others.map((p) => `<option value="${esc(p.id)}" ${last.pick === p.id ? "selected" : ""}>${esc(p.birth.name || "Unnamed")} · ${esc(p.birth.date)}</option>`).join("")}</select></label>` : ""}
          <div class="row3">
            <label class="field"><span>Their name</span><input name="name" maxlength="40" placeholder="e.g. Sam" value="${esc(last.name || "")}"></label>
            <label class="field"><span>Birth date</span><input name="date" inputmode="numeric" placeholder="MM / DD / YYYY" maxlength="14" value="${esc(last.date || "")}"></label>
            <label class="field"><span>Birth time <em>(optional)</em></span><input name="time" type="time" value="${esc(last.time || "")}"></label>
          </div>
          <p class="field-error" id="match-error"></p>
          <button class="primary" type="submit">Check compatibility ♥</button>
        </form>
        <div id="match-result"></div>
      </section>`;
  }

  function matchResult(c, other) {
    const S = Life.synastry(c, other);
    const nm = esc(other.name || "them");
    return `
      <div class="match-card">
        <div class="score-ring" style="--p:${S.overall}"><span>${S.overall}%</span></div>
        <div><p class="eyebrow">You & ${nm}</p><h3>${esc(S.verdict)}</h3>
          <p class="small-p">${SIGNS[c.signs.sun].glyph} ${SIGNS[c.signs.sun].name} + ${SIGNS[other.signs.sun].glyph} ${SIGNS[other.signs.sun].name}. ${esc(S.elements)}</p></div>
      </div>
      ${Object.values(S.cats).map((x) => bar(x.label, x.pct)).join("")}
      <div class="grid-2 inner">
        <div><h4>Strengths</h4><p class="small-p">${S.strengths.length ? esc(S.strengths.join(", ")) : "A balanced match with no single standout area."}</p>
          <h4 class="mt">Watch out for</h4><p class="small-p">${S.friction.length ? esc(S.friction.join(", ")) : "No major friction points."}</p></div>
        <div><h4>Tips for you two</h4>${checklist(S.tips)}<p class="small-p">${esc(S.lifePath)}</p></div>
      </div>
      ${other.time ? "" : `<p class="hint">Without their birth time, their Moon sign may be off by one sign.</p>`}`;
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
        if (!dateIn.value.trim()) { if (!silent) err.textContent = "Enter their birth date."; return; }
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
        <p class="eyebrow">Moon cycle ${fmtDate(cyc.start)} – ${fmtDate(cyc.end)}</p>
        <h2>${stage === "set" ? "Set your intention" : "Full Moon check-in"}</h2>
        <p class="overview">This cycle began with a New Moon in ${SIGNS[cyc.sign].name}, in your ${ORD[house]} house: a natural time to set goals around ${esc(HOUSES[house].short)}. Set a goal at the New Moon, check in at the Full Moon (${fmtDate(cyc.full)}), and review before the next New Moon (${fmtDate(cyc.end)}).</p>
      </section>
      <div class="grid-2">
        <section class="card">
          <h3>This cycle's goal</h3>
          <form id="goal-form" class="stack">
            <label class="field"><span>My intention</span><textarea name="goal" rows="2" maxlength="300" placeholder="e.g. Save $200 and apply to two new jobs">${esc(g.goal || "")}</textarea></label>
            <label class="field"><span>First small step</span><input name="step" maxlength="160" value="${esc(g.step || "")}" placeholder="e.g. Update my résumé on Saturday"></label>
            <label class="field"><span>Full Moon check-in: progress so far</span>
              <div class="range-row"><input type="range" name="progress" min="0" max="100" step="10" value="${g.progress || 0}"><b id="prog-val">${g.progress || 0}%</b></div></label>
            <label class="field"><span>Notes and what I learned</span><textarea name="review" rows="2" maxlength="400" placeholder="What worked? What will you change next cycle?">${esc(g.review || "")}</textarea></label>
            <button class="primary" type="submit">Save goal</button>
            <p class="saved-msg" id="goal-saved" aria-live="polite"></p>
          </form>
          ${pastGoals.length ? `<h4 class="mt">Past cycles</h4><ul class="past-goals">${pastGoals.map(([k, v]) => `<li><b>${fmtDate(new Date(k + "T12:00"))}</b> ${esc(v.goal || "No goal written")} <span class="gold">${v.progress || 0}%</span></li>`).join("")}</ul>` : ""}
        </section>
        <section class="card">
          <h3>Today's journal</h3>
          <form id="journal-form" class="stack">
            <div class="moods" role="radiogroup" aria-label="Mood">${MOODS.map((m, i) => `<label><input type="radio" name="mood" value="${i + 1}" ${entry.mood === i + 1 ? "checked" : ""}><span>${m}</span></label>`).join("")}</div>
            <label class="field"><span>How did today go?</span><textarea name="note" rows="4" maxlength="1000" placeholder="Wins, worries, things you noticed…">${esc(entry.note || "")}</textarea></label>
            <button class="primary" type="submit">Save entry</button>
            <p class="saved-msg" id="journal-saved" aria-live="polite"></p>
          </form>
          <div id="patterns">${patterns(entries)}</div>
        </section>
      </div>
      <section class="card">
        <h3>Recent entries</h3>
        ${entries.length ? `<ul class="entries">${entries.slice(0, 14).map(([k, v]) => `<li><span class="mood">${MOODS[(v.mood || 3) - 1]}</span><div><b>${fmtDate(new Date(k + "T12:00"), { weekday: "short", month: "short", day: "numeric" })}</b> <small>Moon in ${SIGNS[v.moonSign]?.name || "?"} · ${esc(PHASES[v.phase]?.name || "")}</small><p>${esc(v.note || "")}</p></div></li>`).join("")}</ul>` : `<p class="small-p">No entries yet. Write a line a day and your patterns will appear here.</p>`}
        <p class="hint">Your journal and goals stay private in this browser on this device.</p>
      </section>`;
  }

  function patterns(entries) {
    const rated = entries.filter(([, v]) => v.mood);
    if (rated.length < 5) return `<p class="hint">Rate your mood for ${5 - rated.length} more day${rated.length === 4 ? "" : "s"} to see how the Moon lines up with your moods.</p>`;
    const avg = (list) => list.length ? list.reduce((s, [, v]) => s + v.mood, 0) / list.length : null;
    const byEl = ["Fire", "Earth", "Air", "Water"].map((el) => [el, avg(rated.filter(([, v]) => SIGNS[v.moonSign]?.element === el))]).filter(([, a]) => a !== null);
    const groups = { "New Moon": [0, 7], "Waxing": [1, 2, 3], "Full Moon": [4], "Waning": [5, 6] };
    const byPh = Object.entries(groups).map(([n, idx]) => [n, avg(rated.filter(([, v]) => idx.includes(v.phase)))]).filter(([, a]) => a !== null);
    const best = [...byEl].sort((a, b) => b[1] - a[1])[0];
    const rows = (list) => list.map(([n, a]) => bar(n, Math.round((a / 5) * 100))).join("");
    return `<h4 class="mt">Your patterns</h4><p class="small-p">Your best moods come when the Moon is in a ${best[0]} sign.</p>${rows(byEl)}${rows(byPh)}`;
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
      $("#goal-saved").textContent = "Saved ✓";
    });
    jf.addEventListener("submit", (e) => {
      e.preventDefault();
      const J = store.get("celestial.journal") || {};
      const now = new Date();
      const mood = jf.querySelector("input[name=mood]:checked");
      J[dkey(now)] = { mood: mood ? Number(mood.value) : null, note: jf.elements.note.value.trim(), moonSign: Astro.signOf(Astro.longitudes(now).moon), phase: Astro.phase(now).index };
      store.set("celestial.journal", J);
      ctx.rerender();
      const msg = $("#journal-saved"); if (msg) msg.textContent = "Saved ✓";
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
    return `
      <header class="r-head"><p>✧ Celestial Reading</p><h1>${esc(c.name || "Your")} birth chart report</h1>
        <p>${esc(state.birth.date)}${state.birth.time ? ` · ${esc(state.birth.time)}` : ""}${state.birth.placeLabel ? ` · ${esc(state.birth.placeLabel)}` : ""} · generated ${fmtDate(new Date(), { dateStyle: "medium" })}</p></header>
      ${sec("Your chart", `<p><b>${sun.name} Sun · ${SIGNS[c.signs.moon].name} Moon${c.rising !== null ? ` · ${SIGNS[c.rising].name} Rising` : ""}</b> · Life Path ${c.lifePath.number} · ${c.chinese.element} ${c.chinese.animal}</p>
        <p>${esc(sun.summary)}</p>
        <table>${Reading.PLANET_KEYS.map((k) => `<tr><td>${PLANETS[k].name}</td><td>${SIGNS[c.signs[k]].name} ${Astro.degreeInSign(c.lon[k]).toFixed(0)}°${c.rising !== null ? `, ${ORD[c.houses[k]]} house` : ""}</td><td>${esc(Reading.placementText(k, c))}</td></tr>`).join("")}</table>`)}
      ${sec("Career", `<p>${esc(K.style)} ${esc(K.lp)}</p><p><b>Best fields:</b> ${esc(K.fields.join(", "))}.</p><p>${esc(K.money.text)}</p>`)}
      ${sec("Money style: " + esc(M.name), `<p>${esc(M.text)}</p><p><b>Blind spot:</b> ${esc(M.blind)}</p><ul>${M.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`)}
      ${sec("Love", `<p>${esc(P.ideal)}</p><p><b>Most compatible:</b> ${P.best.map((i) => SIGNS[i].name).join(", ")}. ${esc(P.loveText)}</p>`)}
      ${sec(`Year ahead (${Y.year}–${Y.year + 1})`, `<ul>${Y.themes.map((t) => `<li><b>${esc(t.title)}.</b> ${esc(t.text)}</li>`).join("")}</ul>`)}
      ${sec("Coming life cycles", `<ul>${L.map((e) => `<li><b>Age ${e.approx ? "~" : ""}${e.age}, ${e.from.getFullYear()}: ${esc(e.title)}.</b> ${esc(e.what)} Prepare: ${esc(e.prep.join("; "))}.</li>`).join("")}</ul>`)}
      ${sec("Lucky years and numbers", `<ul>${J.map((p) => `<li>${p.from ? mon(p.from) : "Now"} – ${p.to ? mon(p.to) : "later"}: Jupiter in your ${ORD[p.house]} house. ${esc(p.text)}</li>`).join("")}</ul><p>Your numbers: ${N.set.join(", ")}. Personal year ${N.personalYear}.</p>`)}
      <p class="r-foot">For reflection and entertainment. Not financial, medical or legal advice.</p>`;
  }

  return { brief, yearAhead, bindYear, lifeCycles, careerExtras, love, bindLove, journal, bindJournal, report };
};
