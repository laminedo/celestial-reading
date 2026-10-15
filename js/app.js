// UI: intake form, tabs, period navigation and rendering.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const state = { birth: null, chart: null, tab: "daily", offset: 0 };

  // ---------- background stars ----------
  (() => {
    const box = $(".stars");
    let html = "";
    for (let i = 0; i < 140; i++) {
      const size = Math.random() < 0.85 ? 1 : 2;
      html += `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-delay:${(Math.random() * 6).toFixed(2)}s;opacity:${(0.3 + Math.random() * 0.7).toFixed(2)}"></i>`;
    }
    box.innerHTML = html;
  })();

  // ---------- time zone options ----------
  (() => {
    const sel = $("#tz-select");
    const offsets = [];
    for (let h = -12; h <= 14; h++) offsets.push(h);
    offsets.push(-9.5, -3.5, 3.5, 4.5, 5.5, 5.75, 6.5, 9.5, 10.5);
    offsets.sort((a, b) => a - b);
    const label = (o) => {
      const sign = o < 0 ? "−" : "+";
      const a = Math.abs(o);
      return `UTC${sign}${String(Math.floor(a)).padStart(2, "0")}:${String(Math.round((a % 1) * 60)).padStart(2, "0")}`;
    };
    sel.innerHTML = `<option value="auto">Automatic (from birth city)</option>` + offsets.map((o) => `<option value="${o}">${label(o)}</option>`).join("");
  })();

  // ---------- birth city search (Open-Meteo geocoding, no key needed) ----------
  const cityInput = $("#city-input");
  const cityList = $("#city-list");
  const placeInfo = $("#place-info");
  let selectedPlace = null;
  let cityResults = [];
  let activeIdx = -1;
  let searchTimer = null;
  let searchSeq = 0;

  const placeLabel = (p) => [p.name, p.admin1, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
  const coordLabel = (p) => `${Math.abs(p.lat).toFixed(2)}°${p.lat >= 0 ? "N" : "S"}, ${Math.abs(p.lon).toFixed(2)}°${p.lon >= 0 ? "E" : "W"}`;

  async function geocode(query) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
    const data = await res.json();
    return (data.results || []).map((r) => ({
      name: r.name, admin1: r.admin1 || "", country: r.country || "",
      lat: r.latitude, lon: r.longitude, timezone: r.timezone || "",
    }));
  }

  function setPlace(p) {
    selectedPlace = p;
    placeInfo.textContent = p ? `📍 ${coordLabel(p)}${p.timezone ? " · " + p.timezone : ""}` : "";
    placeInfo.classList.remove("error");
  }

  function closeList() {
    cityList.hidden = true;
    cityInput.setAttribute("aria-expanded", "false");
    activeIdx = -1;
  }

  function renderList() {
    if (!cityResults.length) { closeList(); return; }
    cityList.innerHTML = cityResults.map((p, i) => `
      <li role="option" id="city-opt-${i}" data-idx="${i}" aria-selected="${i === activeIdx}" class="${i === activeIdx ? "active" : ""}">
        <strong>${esc(p.name)}</strong> <span>${esc([p.admin1, p.country].filter(Boolean).join(", "))}</span>
      </li>`).join("");
    cityList.hidden = false;
    cityInput.setAttribute("aria-expanded", "true");
    if (activeIdx >= 0) cityInput.setAttribute("aria-activedescendant", `city-opt-${activeIdx}`);
    else cityInput.removeAttribute("aria-activedescendant");
  }

  function choose(i) {
    const p = cityResults[i];
    if (!p) return;
    cityInput.value = placeLabel(p);
    setPlace(p);
    closeList();
  }

  cityInput.addEventListener("input", () => {
    setPlace(null);
    clearTimeout(searchTimer);
    const q = cityInput.value.trim();
    if (q.length < 2) { cityResults = []; closeList(); return; }
    searchTimer = setTimeout(async () => {
      const seq = ++searchSeq;
      try {
        const results = await geocode(q);
        if (seq !== searchSeq) return;
        cityResults = results;
        activeIdx = -1;
        renderList();
        if (!results.length) { placeInfo.textContent = "No matches — check the spelling or enter coordinates below."; placeInfo.classList.add("error"); }
      } catch {
        if (seq !== searchSeq) return;
        placeInfo.textContent = "City search is unavailable right now — enter coordinates below instead.";
        placeInfo.classList.add("error");
        $("#manual").open = true;
      }
    }, 300);
  });

  cityInput.addEventListener("keydown", (e) => {
    if (cityList.hidden) return;
    if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = (activeIdx + 1) % cityResults.length; renderList(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); activeIdx = (activeIdx - 1 + cityResults.length) % cityResults.length; renderList(); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); choose(activeIdx); }
    else if (e.key === "Escape") closeList();
  });
  cityList.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li");
    if (li) { e.preventDefault(); choose(Number(li.dataset.idx)); }
  });
  cityInput.addEventListener("blur", () => setTimeout(closeList, 100));

  // Resolve the birthplace: manual coordinates win, then a picked city, then the top search hit.
  async function resolvePlace(fd) {
    const lat = parseFloat(fd.get("lat")), lon = parseFloat(fd.get("lon"));
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { name: cityInput.value.trim() || coordLabel({ lat, lon }), lat, lon, timezone: selectedPlace?.timezone || "" };
    }
    if (selectedPlace) return selectedPlace;
    const q = cityInput.value.trim();
    if (!q) return null;
    try {
      const [top] = await geocode(q);
      if (top) { cityInput.value = placeLabel(top); setPlace(top); }
      return top || null;
    } catch {
      return null;
    }
  }

  // ---------- typed birth date (MM/DD/YYYY) ----------
  const dateInput = $("#date-input");
  const dateError = $("#date-error");

  // Rebuild the field as MM/DD/YYYY, padding single digits ("5/3/1990" → "05/03/1990").
  function formatTypedDate(raw, typingForward) {
    const segs = ["", "", ""], max = [2, 2, 4];
    let seg = 0;
    const advance = () => {
      if (seg < 2 && segs[seg]) {
        if (segs[seg].length === 1) segs[seg] = "0" + segs[seg];
        seg++;
      }
    };
    for (const ch of raw) {
      if (/\d/.test(ch)) {
        if (segs[seg].length >= max[seg]) { if (seg === 2) break; advance(); }
        segs[seg] += ch;
        // A month starting 2–9 or a day starting 4–9 can only be one digit.
        if ((seg === 0 && segs[0].length === 1 && ch > "1") || (seg === 1 && segs[1].length === 1 && ch > "3")) advance();
      } else {
        advance();
      }
    }
    if (typingForward && seg < 2 && segs[seg].length === max[seg]) advance();
    return segs[0] + (seg >= 1 ? "/" + segs[1] : "") + (seg >= 2 ? "/" + segs[2] : "");
  }

  function parseTypedDate(value) {
    const m = String(value || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!m) return { error: "Enter your birthday as MM/DD/YYYY, e.g. 11/08/1995." };
    const month = Number(m[1]), day = Number(m[2]);
    let year = Number(m[3]);
    if (m[3].length === 2) {
      const yy = new Date().getFullYear() % 100;
      year += year > yy ? 1900 : 2000;
    }
    if (month < 1 || month > 12) return { error: "Month must be between 01 and 12." };
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return { error: `${new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long" })} ${year} has ${daysInMonth} days.` };
    }
    if (year < 1900) return { error: "Please enter a year from 1900 onward." };
    if (new Date(year, month - 1, day) > new Date()) return { error: "Your birth date can't be in the future." };
    return { iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
  }

  const isoToTyped = (iso) => {
    const [y, m, d] = (iso || "").split("-");
    return y ? `${m}/${d}/${y}` : "";
  };

  function showDateError(msg) {
    dateError.textContent = msg || "";
    dateInput.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  dateInput.addEventListener("input", (e) => {
    const forward = !(e.inputType || "").startsWith("delete");
    dateInput.value = formatTypedDate(dateInput.value, forward);
    showDateError("");
  });
  dateInput.addEventListener("blur", () => {
    if (dateInput.value.trim()) showDateError(parseTypedDate(dateInput.value).error);
  });

  // ---------- form ----------
  const form = $("#birth-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const parsed = parseTypedDate(fd.get("date"));
    if (parsed.error) { showDateError(parsed.error); dateInput.focus(); return; }
    const birth = { name: fd.get("name").trim(), date: parsed.iso, time: fd.get("time"), tz: fd.get("tz") };
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Reading the stars…";
    const place = await resolvePlace(fd);
    btn.disabled = false;
    btn.textContent = "Reveal my reading ✧";
    if (cityInput.value.trim() && !place) {
      placeInfo.textContent = "Couldn't find that city — pick one from the list or enter coordinates.";
      placeInfo.classList.add("error");
      return;
    }
    if (place) {
      birth.place = { name: place.name, admin1: place.admin1 || "", country: place.country || "", lat: place.lat, lon: place.lon, timezone: place.timezone || "" };
      birth.placeLabel = cityInput.value.trim() || placeLabel(place);
    }
    store.set("celestial.birth", birth);
    load(birth);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#edit-btn").addEventListener("click", showIntake);
  $("#brand").addEventListener("click", (e) => { e.preventDefault(); if (state.chart) { state.offset = 0; render(); } });

  function showIntake() {
    $("#intake").hidden = false;
    $("#results").hidden = true;
    $("#edit-btn").hidden = true;
    if (state.birth) {
      form.elements.name.value = state.birth.name || "";
      form.elements.date.value = isoToTyped(state.birth.date);
      form.elements.time.value = state.birth.time || "";
      form.elements.tz.value = state.birth.tz || "auto";
      const p = state.birth.place;
      cityInput.value = p ? state.birth.placeLabel || placeLabel(p) : "";
      setPlace(p && p.timezone ? p : null);
      form.elements.lat.value = p && !p.timezone ? p.lat : "";
      form.elements.lon.value = p && !p.timezone ? p.lon : "";
      $("#manual").open = Boolean(p && !p.timezone);
    }
  }

  function load(birth) {
    state.birth = birth;
    state.chart = Reading.natal(birth);
    state.offset = 0;
    $("#intake").hidden = true;
    $("#results").hidden = false;
    $("#edit-btn").hidden = false;
    render();
  }

  // ---------- rendering ----------
  const fmtDate = (d, o = { month: "short", day: "numeric" }) => d.toLocaleDateString(undefined, o);
  const rating = (v) => {
    let html = "";
    for (let i = 1; i <= 5; i++) html += `<span class="dot ${v >= i ? "on" : v >= i - 0.5 ? "half" : ""}"></span>`;
    return `<span class="rating" aria-label="${v} out of 5">${html}</span>`;
  };

  function targetDate() {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    if (state.tab === "daily") d.setDate(d.getDate() + state.offset);
    if (state.tab === "weekly") d.setDate(d.getDate() + state.offset * 7);
    if (state.tab === "monthly") { d.setDate(1); d.setMonth(d.getMonth() + state.offset); }
    return d;
  }

  function render() {
    const c = state.chart;
    const sun = SIGNS[c.signs.sun], moon = SIGNS[c.signs.moon];
    const greeting = c.name ? `${esc(c.name)}, you're a` : "You're a";
    const tabs = [["daily", "Today"], ["weekly", "This Week"], ["monthly", "This Month"], ["chart", "Birth Chart"]];

    $("#results").innerHTML = `
      <section class="card profile">
        <div class="profile-glyph" aria-hidden="true">${sun.glyph}</div>
        <div class="profile-body">
          <p class="eyebrow">${greeting}</p>
          <h1>${sun.name} Sun <span class="muted">·</span> ${moon.name} Moon${c.rising !== null ? ` <span class="muted">·</span> ${SIGNS[c.rising].name} Rising` : ""}</h1>
          <p class="profile-sub">${sun.symbol} · ${sun.dates}${state.birth.placeLabel ? ` · Born in ${esc(state.birth.placeLabel)}` : ""}</p>
          <div class="badges">
            <span class="badge el-${sun.element.toLowerCase()}">${sun.element}</span>
            <span class="badge">${sun.modality}</span>
            <span class="badge">Ruled by ${sun.ruler}</span>
            <span class="badge">Life Path ${c.lifePath.number}</span>
            <span class="badge">${c.chinese.element} ${c.chinese.animal}</span>
          </div>
          ${c.notes.map((n) => `<p class="note">ⓘ ${esc(n)}</p>`).join("")}
        </div>
      </section>

      <nav class="tabs" role="tablist">
        ${tabs.map(([k, l]) => `<button role="tab" data-tab="${k}" aria-selected="${state.tab === k}" class="${state.tab === k ? "active" : ""}">${l}</button>`).join("")}
      </nav>

      <div id="panel">${state.tab === "chart" ? renderChart(c) : renderPeriod(c)}</div>
    `;

    $("#results").querySelectorAll("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => { state.tab = b.dataset.tab; state.offset = 0; render(); }));
    $("#results").querySelectorAll("[data-nav]").forEach((b) =>
      b.addEventListener("click", () => { state.offset = b.dataset.nav === "reset" ? 0 : state.offset + Number(b.dataset.nav); render(); }));
    $("#results").querySelectorAll(".todo input").forEach((cb) =>
      cb.addEventListener("change", () => {
        const done = store.get(cb.dataset.key) || {};
        done[cb.dataset.idx] = cb.checked;
        store.set(cb.dataset.key, done);
        cb.closest("li").classList.toggle("done", cb.checked);
      }));
  }

  function renderPeriod(c) {
    const date = targetDate();
    const R = state.tab === "daily" ? Reading.daily(c, date) : state.tab === "weekly" ? Reading.weekly(c, date) : Reading.monthly(c, date);
    const unit = { daily: "day", weekly: "week", monthly: "month" }[state.tab];
    const nowLabel = { daily: "Today", weekly: "This week", monthly: "This month" }[state.tab];
    const doneKey = `celestial.todo.${c.seed}.${R.kind}.${R.label}`;
    const done = store.get(doneKey) || {};

    return `
      <div class="period-nav">
        <button class="ghost icon" data-nav="-1" aria-label="Previous ${unit}">‹</button>
        <div class="period-label">
          <span>${esc(R.label)}</span>
          ${state.offset !== 0 ? `<button class="link" data-nav="reset">Back to ${nowLabel.toLowerCase()}</button>` : `<small>${nowLabel}</small>`}
        </div>
        <button class="ghost icon" data-nav="1" aria-label="Next ${unit}">›</button>
      </div>

      <section class="card hero-reading">
        <p class="eyebrow">${{ daily: "Daily", weekly: "Weekly", monthly: "Monthly" }[R.kind]} reading</p>
        <h2>${esc(R.headline)}</h2>
        <p class="overview">${esc(R.overview)}</p>
        ${R.moon ? `
          <div class="chips">
            <span class="chip">${R.moon.phase.icon} ${R.moon.phase.name} · ${R.moon.illumination}%</span>
            <span class="chip">☽︎ Moon in ${R.moon.sign.name} ${R.moon.sign.glyph}</span>
            <span class="chip">${Reading.ORD[R.moon.house]} house focus</span>
          </div>` : ""}
      </section>

      ${R.notes.map((n) => `
        <section class="card alert">
          <strong>⚠ ${esc(n.title)}</strong> <span class="muted">${esc(n.range)}</span>
          <p>${esc(n.text)}</p>
        </section>`).join("")}

      <div class="grid-2">
        <section class="card">
          <h3>What you need to do</h3>
          <ul class="todo">
            ${R.todo.map((t, i) => `
              <li class="${done[i] ? "done" : ""}">
                <label><input type="checkbox" data-key="${esc(doneKey)}" data-idx="${i}" ${done[i] ? "checked" : ""}><span>${esc(t)}</span></label>
              </li>`).join("")}
          </ul>
        </section>
        <section class="card">
          <h3>Steer clear of</h3>
          <ul class="avoid">${R.avoid.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
          ${R.lucky ? `
            <h3 class="mt">Lucky for you</h3>
            <div class="lucky">
              <div><small>Number</small><strong>${R.lucky.number}</strong></div>
              <div><small>Color</small><strong>${esc(R.lucky.color)}</strong></div>
              <div><small>Best hour</small><strong>${R.lucky.time}</strong></div>
            </div>` : ""}
        </section>
      </div>

      ${R.days ? renderWeekStrip(R.days) : ""}
      ${R.calendar ? renderMonthCal(R) : ""}

      <section class="areas">
        ${R.areas.map((a) => `
          <div class="card area area-${a.key}">
            <div class="area-head"><span class="area-icon">${a.icon}</span><h4>${a.label}</h4>${rating(a.rating)}</div>
            <p>${esc(a.text)}</p>
          </div>`).join("")}
      </section>

      ${(R.events && R.events.length) || (R.keyDates && R.keyDates.length) ? `
        <section class="card">
          <h3>${R.kind === "weekly" ? "Cosmic events this week" : "Key dates"}</h3>
          <ol class="timeline">
            ${(R.events || R.keyDates).map((e) => `
              <li><time>${fmtDate(e.date, { weekday: "short", month: "short", day: "numeric" })}</time>
                <div><strong>${esc(e.title)}</strong><p>${esc(e.text)}</p></div></li>`).join("")}
          </ol>
        </section>` : ""}
    `;
  }

  function renderWeekStrip(days) {
    const today = new Date().toDateString();
    return `
      <section class="card">
        <h3>Your week at a glance</h3>
        <div class="week">
          ${days.map((d) => {
            const pct = Math.round(((d.total - 4) / 16) * 100);
            return `
              <div class="day ${d.best ? "best" : ""} ${d.tough ? "tough" : ""} ${d.date.toDateString() === today ? "today" : ""}">
                <small>${fmtDate(d.date, { weekday: "short" })}</small>
                <b>${d.date.getDate()}</b>
                <span class="day-glyph" title="Moon in ${SIGNS[d.moonSign].name}">${SIGNS[d.moonSign].glyph}</span>
                <div class="meter"><i style="height:${Math.max(8, Math.min(100, pct))}%"></i></div>
                <em>${d.best ? "Best" : d.tough ? "Go easy" : "&nbsp;"}</em>
              </div>`;
          }).join("")}
        </div>
        <p class="hint">Glyph = sign the Moon visits that day · bar = overall energy for you.</p>
      </section>`;
  }

  function renderMonthCal(R) {
    const first = R.calendar[0].date;
    const lead = (first.getDay() + 6) % 7;
    const today = new Date().toDateString();
    const power = R.power.map((d) => d.toDateString());
    const tough = R.tough.map((d) => d.toDateString());
    const cells = Array(lead).fill(`<div class="cell empty"></div>`).concat(R.calendar.map((d) => {
      const lvl = Math.max(0, Math.min(4, Math.round(((d.total - 6) / 12) * 4)));
      const ds = d.date.toDateString();
      return `<div class="cell lvl-${lvl} ${power.includes(ds) ? "power" : ""} ${tough.includes(ds) ? "tough" : ""} ${ds === today ? "today" : ""}">${d.date.getDate()}</div>`;
    }));
    return `
      <section class="card">
        <h3>Energy calendar</h3>
        <div class="cal-head">${["M", "T", "W", "T", "F", "S", "S"].map((x) => `<span>${x}</span>`).join("")}</div>
        <div class="cal">${cells.join("")}</div>
        <p class="hint"><span class="key power"></span> power day &nbsp; <span class="key tough"></span> go easy &nbsp; brighter = stronger day for you</p>
      </section>`;
  }

  // ---------- birth chart ----------
  function renderChart(c) {
    const sun = SIGNS[c.signs.sun];
    const total = Object.values(c.elements).reduce((a, b) => a + b, 0);
    return `
      <div class="grid-chart">
        <section class="card wheel-card">
          <h3>Your birth chart</h3>
          ${wheel(c)}
          <p class="hint">Planet positions at ${c.when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}${state.birth.time ? "" : " (noon — no birth time given)"}.
          <span class="legend"><i class="soft"></i> harmonious <i class="hard"></i> challenging</span></p>
        </section>
        <section class="card">
          <h3>Your placements</h3>
          <ul class="placements">
            ${c.rising !== null ? `
              <li class="rising-row">
                <span class="p-glyph">AC</span>
                <div>
                  <strong>${SIGNS[c.rising].name} Rising ${SIGNS[c.rising].glyph}</strong>
                  <small>${Astro.degreeInSign(c.angles.asc).toFixed(0)}° · your Ascendant: first impressions and how you approach life</small>
                  <p>${esc(RISING[c.rising])} Your Midheaven in ${SIGNS[Astro.signOf(c.angles.mc)].name} points your public path toward ${SIGNS[Astro.signOf(c.angles.mc)].domain}.</p>
                </div>
              </li>` : ""}
            ${Reading.PLANET_KEYS.map((k) => {
              const s = SIGNS[c.signs[k]];
              return `
                <li>
                  <span class="p-glyph">${PLANETS[k].glyph}</span>
                  <div>
                    <strong>${PLANETS[k].name} in ${s.name} ${s.glyph}</strong>
                    <small>${Astro.degreeInSign(c.lon[k]).toFixed(0)}°${c.rising !== null ? ` · ${Reading.ORD[c.houses[k]]} house` : ""}${c.retro[k] ? " · retrograde ℞" : ""} · ${PLANETS[k].role}</small>
                    <p>${esc(Reading.placementText(k, c))}</p>
                  </div>
                </li>`;
            }).join("")}
          </ul>
        </section>
      </div>

      <section class="card">
        <p class="eyebrow">Sun sign deep dive</p>
        <h2>${sun.glyph} ${sun.name}</h2>
        <p class="overview">${esc(sun.summary)}</p>
        <div class="grid-2 inner">
          <div><h4>Strengths</h4><div class="badges">${sun.strengths.map((s) => `<span class="badge good">${s}</span>`).join("")}</div></div>
          <div><h4>Growth edges</h4><div class="badges">${sun.challenges.map((s) => `<span class="badge warn">${s}</span>`).join("")}</div></div>
          <div><h4>In love</h4><p>${esc(sun.love)}</p></div>
          <div><h4>Career & purpose</h4><p>${esc(sun.career)}</p></div>
          <div><h4>Best matches</h4><p>${sun.compatible.map((n) => `${SIGNS.find((s) => s.name === n).glyph} ${n}`).join(" · ")}</p></div>
          <div><h4>Lucky charms</h4><p>Number ${sun.lucky.number} · ${sun.lucky.color} · ${sun.lucky.day} · ${sun.lucky.stone}</p></div>
        </div>
      </section>

      <div class="grid-3">
        <section class="card">
          <h3>Element balance</h3>
          ${Object.entries(c.elements).map(([el, v]) => `
            <div class="bar-row"><span>${el}</span><div class="bar"><i class="el-${el.toLowerCase()}" style="width:${(v / total) * 100}%"></i></div><b>${Math.round((v / total) * 100)}%</b></div>`).join("")}
          <p class="small-p"><strong>Dominant: ${c.dominant}.</strong> ${ELEMENT_INFO[c.dominant].desc}</p>
        </section>
        <section class="card">
          <h3>Life Path ${c.lifePath.number}</h3>
          <p class="big-num">${c.lifePath.number}</p>
          <p><strong>${esc(c.lifePath.title)}</strong></p>
          <p class="small-p">${esc(c.lifePath.text)}</p>
        </section>
        <section class="card">
          <h3>Chinese zodiac</h3>
          <p class="big-num">${c.chinese.animal}</p>
          <p><strong>${c.chinese.element} ${c.chinese.animal}</strong></p>
          <p class="small-p">${esc(c.chinese.traits)}.</p>
        </section>
      </div>
    `;
  }

  function wheel(c) {
    const S = 372, C = S / 2, R1 = 165, R2 = 132, RP = 108, RA = 80;
    const rot = c.angles ? c.angles.asc : 0; // Ascendant sits at the left (9 o'clock) when known
    const pt = (lon, r) => {
      const a = (180 + lon - rot) * Math.PI / 180;
      return [C + r * Math.cos(a), C - r * Math.sin(a)];
    };
    const elColor = { Fire: "var(--fire)", Earth: "var(--earth)", Air: "var(--air)", Water: "var(--water)" };
    let svg = `<svg viewBox="0 0 ${S} ${S}" class="wheel" role="img" aria-label="Birth chart wheel">`;
    svg += `<circle cx="${C}" cy="${C}" r="${R1}" class="ring"/><circle cx="${C}" cy="${C}" r="${R2}" class="ring"/><circle cx="${C}" cy="${C}" r="${RA}" class="ring faint"/>`;
    SIGNS.forEach((s, i) => {
      const [x1, y1] = pt(i * 30, R2), [x2, y2] = pt(i * 30, R1);
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="ring"/>`;
      const [gx, gy] = pt(i * 30 + 15, (R1 + R2) / 2);
      svg += `<text x="${gx}" y="${gy}" class="sign-glyph" style="fill:${elColor[s.element]}">${s.glyph}</text>`;
    });
    // whole-sign house numbers and the angles (Ascendant / Midheaven)
    if (c.angles) {
      for (let h = 1; h <= 12; h++) {
        const [hx, hy] = pt(((c.rising + h - 1) % 12) * 30 + 15, RA - 13);
        svg += `<text x="${hx}" y="${hy}" class="house-num">${h}</text>`;
      }
      [["AC", c.angles.asc], ["MC", c.angles.mc]].forEach(([label, lon]) => {
        const [x1, y1] = pt(lon, R1 + 2), [x2, y2] = pt(lon + 180, R1 + 2);
        const [lx, ly] = pt(lon, R1 + 12);
        svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="axis"/>`;
        svg += `<text x="${lx}" y="${ly}" class="axis-label">${label}</text>`;
      });
    }
    // aspect lines
    c.aspects.forEach((a) => {
      const [x1, y1] = pt(c.lon[a.a], RA), [x2, y2] = pt(c.lon[a.b], RA);
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="asp ${a.kind}"/>`;
    });
    // planets, nudged inward when crowded
    const placed = [];
    [...Reading.PLANET_KEYS].sort((a, b) => c.lon[a] - c.lon[b]).forEach((k) => {
      let r = RP;
      while (placed.some((p) => Math.abs(Astro.norm(p.lon - c.lon[k] + 180) - 180) < 10 && p.r === r)) r -= 17;
      placed.push({ lon: c.lon[k], r });
      const [tx, ty] = pt(c.lon[k], R2), [ix, iy] = pt(c.lon[k], R2 - 6);
      const [px, py] = pt(c.lon[k], r);
      const [ax, ay] = pt(c.lon[k], RA);
      svg += `<line x1="${tx}" y1="${ty}" x2="${ix}" y2="${iy}" class="tick"/>`;
      svg += `<circle cx="${ax}" cy="${ay}" r="2" class="anchor"/>`;
      svg += `<text x="${px}" y="${py}" class="planet-glyph"><title>${PLANETS[k].name} ${Astro.degreeInSign(c.lon[k]).toFixed(0)}° ${SIGNS[c.signs[k]].name}</title>${PLANETS[k].glyph}</text>`;
    });
    return svg + "</svg>";
  }

  // ---------- boot ----------
  const saved = store.get("celestial.birth");
  if (saved && saved.date) load(saved);
})();
