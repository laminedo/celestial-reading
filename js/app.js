// UI: intake form, tabs, period navigation and rendering.

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const state = { birth: null, chart: null, tab: "daily", offset: 0, profileId: null, adding: false };

  // ---------- saved profiles (you, family, partner…) ----------
  const uid = () => Math.random().toString(36).slice(2, 10);
  const getProfiles = () => store.get("celestial.profiles") || [];
  const setProfiles = (list) => store.set("celestial.profiles", list);
  (() => {
    // Older versions kept a single birth record.
    const legacy = store.get("celestial.birth");
    if (legacy && legacy.date && !getProfiles().length) {
      const id = uid();
      setProfiles([{ id, birth: legacy }]);
      store.set("celestial.active", id);
    }
  })();

  let V;
  const views = () => V || (V = Views({
    $, esc, store, fmtDate, tfmt, state, signChip, precisionNote, parseTypedDate, formatTypedDate,
    profiles: getProfiles, activeId: () => state.profileId, rerender: () => render(),
  }));

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
    const list = getProfiles();
    let id = state.adding ? null : state.profileId;
    if (id && list.some((p) => p.id === id)) list.forEach((p) => { if (p.id === id) p.birth = birth; });
    else { id = uid(); list.push({ id, birth }); }
    setProfiles(list);
    store.set("celestial.active", id);
    state.adding = false;
    load(birth, id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  $("#edit-btn").addEventListener("click", () => { state.adding = false; showIntake(); });
  $("#add-btn").addEventListener("click", () => { state.adding = true; showIntake(); });
  $("#report-btn").addEventListener("click", () => {
    $("#report").innerHTML = views().report(state.chart);
    window.print();
  });
  $("#profile-select").addEventListener("change", (e) => {
    const p = getProfiles().find((x) => x.id === e.target.value);
    if (p) { store.set("celestial.active", p.id); load(p.birth, p.id); }
  });
  $("#delete-btn").addEventListener("click", () => {
    const p = getProfiles().find((x) => x.id === state.profileId);
    if (!p || !window.confirm(`Remove ${p.birth.name || "this profile"} from this device?`)) return;
    const rest = getProfiles().filter((x) => x.id !== p.id);
    setProfiles(rest);
    if (rest.length) { store.set("celestial.active", rest[0].id); load(rest[0].birth, rest[0].id); }
    else { store.set("celestial.active", null); state.birth = null; state.chart = null; state.profileId = null; form.reset(); showIntake(); }
  });

  function renderHeader() {
    const list = getProfiles();
    const sel = $("#profile-select");
    sel.innerHTML = list.map((p) => `<option value="${esc(p.id)}" ${p.id === state.profileId ? "selected" : ""}>${esc(p.birth.name || "Me")} · ${esc(isoToTyped(p.birth.date))}</option>`).join("");
    sel.hidden = list.length < 2;
    $("#delete-btn").hidden = list.length < 2;
  }
  $("#brand").addEventListener("click", (e) => { e.preventDefault(); if (state.chart) { state.offset = 0; render(); } });

  function showIntake() {
    $("#intake").hidden = false;
    $("#results").hidden = true;
    $(".header-actions").hidden = true;
    $("#cancel-btn").hidden = !state.chart;
    $("#intake h1").innerHTML = state.adding ? "Add someone<br>to your circle" : "What do the planets<br>ask of you right now?";
    if (state.adding) {
      form.reset(); setPlace(null); cityInput.value = ""; $("#manual").open = false;
    } else if (state.birth) {
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

  function load(birth, id) {
    state.birth = birth;
    state.chart = Reading.natal(birth);
    state.offset = 0;
    state.profileId = id || null;
    $("#intake").hidden = true;
    $("#results").hidden = false;
    $(".header-actions").hidden = false;
    renderHeader();
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
    const tabs = [["daily", "Today"], ["weekly", "This Week"], ["monthly", "This Month"], ["year", "Year Ahead"], ["chart", "Birth Chart"], ["life", "Life Cycles"],
      ["career", "Career & Money"], ["love", "Love & Match"], ["luck", "Luck & Numbers"], ["places", "Places & Car"], ["journal", "Journal & Goals"]];

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

      <div id="panel">${panel(c)}</div>
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
    if (state.tab === "luck") bindAddress(c);
    if (state.tab === "places") bindYear(c);
    if (state.tab === "year") views().bindYear(c);
    if (state.tab === "love") views().bindLove(c);
    if (state.tab === "journal") views().bindJournal(c);
    const active = $("#results [data-tab].active");
    if (active) active.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function panel(c) {
    switch (state.tab) {
      case "chart": return renderChart(c);
      case "year": return views().yearAhead(c);
      case "life": return views().lifeCycles(c);
      case "career": return renderCareer(c);
      case "love": return views().love(c);
      case "luck": return renderLuck(c);
      case "places": return renderPlaces(c);
      case "journal": return views().journal(c);
      default: return renderPeriod(c);
    }
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

      ${R.kind === "daily" && state.offset === 0 ? views().brief(c, R) : ""}
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

  // ---------- career & love ----------
  const signChip = (i) => `<span class="badge">${SIGNS[i].glyph} ${SIGNS[i].name}</span>`;
  const precisionNote = (what) => `<p class="note">ⓘ Add your birth time and city for a precise ${what}. This version uses your Sun and Venus signs.</p>`;

  function renderCareer(c) {
    const K = Destiny.career(c);
    return `
      <section class="card hero-reading">
        <p class="eyebrow">Your natural line of work</p>
        <h2>Where your talents pay off</h2>
        <p class="overview">${esc(K.style)} ${esc(K.lp)}</p>
        <div class="badges mt-s">${K.fields.map((f) => `<span class="badge good">${esc(f)}</span>`).join("")}</div>
        ${K.approx ? precisionNote("career reading with your Midheaven") : ""}
      </section>

      <div class="grid-2">
        <section class="card">
          <h3>What your chart says about work</h3>
          <ul class="placements">${K.points.map((p) => `<li><div><strong>${esc(p.title)}</strong><p>${esc(p.text)}</p></div></li>`).join("")}</ul>
        </section>
        <section class="card">
          <h3>${esc(K.money.title)}</h3>
          <p class="small-p">${esc(K.money.text)}</p>
        </section>
      </div>
      ${views().careerExtras(c)}`;
  }

  // ---------- luck & numbers ----------
  const tfmt = (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  function renderLuck(c) {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + state.offset);
    const H = Destiny.planetaryHours(c, date, c.place);
    const D = Destiny.luckyDays(c, c.place);
    const M = Destiny.luckyMonths(c);
    const J = Destiny.jupiterYears(c);
    const N = Destiny.personalNumbers(c, state.birth);
    const homes = Destiny.bestHomeNumbers(c);
    const savedAddr = store.get("celestial.address") || "";
    const stars = (n) => n ? "★".repeat(n) + "☆".repeat(3 - n) : "☆☆☆";
    const range = (p) => `${p.from ? fmtDate(p.from, { month: "short", year: "numeric" }) : "Now"} – ${p.to ? fmtDate(p.to, { month: "short", year: "numeric" }) : "later"}`;

    return `
      <section class="card alert">
        <strong>Read this first</strong>
        <p>Lottery draws and games of chance are random. No chart, day, hour or number can change your odds, and every ticket has the same chance. Treat these timings as tradition and fun. Set a budget you can afford to lose. If gambling stops being fun, call or text 1-800-GAMBLER (US) for free, confidential help.</p>
      </section>

      <div class="period-nav">
        <button class="ghost icon" data-nav="-1" aria-label="Previous day">‹</button>
        <div class="period-label">
          <span>${fmtDate(date, { weekday: "long", month: "long", day: "numeric" })}</span>
          ${state.offset !== 0 ? `<button class="link" data-nav="reset">Back to today</button>` : `<small>Today</small>`}
        </div>
        <button class="ghost icon" data-nav="1" aria-label="Next day">›</button>
      </div>

      <section class="card hero-reading">
        <p class="eyebrow">Best start times for success and money</p>
        <h2>${H.best.map((h) => tfmt(h.from)).join(" · ")}</h2>
        <p class="overview">Today is ruled by ${PLANETS[H.dayRuler].name}. Your chart ruler is ${PLANETS[H.lucky.chartRuler].name}, your money planet is ${PLANETS[H.lucky.moneyRuler].name} and your career planet is ${PLANETS[H.lucky.careerRuler].name}. These are the planetary hours that suit you best for starting important work, signing deals, or anything you want to grow.</p>
        <div class="chips">
          <span class="chip">☀︎ Sunrise ${tfmt(H.sunrise)}</span><span class="chip">☾︎ Sunset ${tfmt(H.sunset)}</span>
          ${H.best.map((h) => `<span class="chip gold">${PLANETS[h.planet].glyph} ${PLANETS[h.planet].name} hour ${tfmt(h.from)}–${tfmt(h.to)}</span>`).join("")}
        </div>
        ${H.approx ? `<p class="note">ⓘ ${c.place ? "Sunrise is approximate at this latitude." : "Add your birth city to calculate sunrise for your location. Times below assume 6am sunrise."}</p>` : ""}
      </section>

      <section class="card">
        <h3>All planetary hours</h3>
        <div class="hours">
          ${H.hours.map((h) => `
            <div class="hour ${h.best ? "best" : ""} ${h.score < 0 ? "weak" : ""} ${h.night ? "night" : ""}" title="${esc(H.meaning[h.planet])}">
              <span class="h-glyph">${PLANETS[h.planet].glyph}</span>
              <span><strong>${tfmt(h.from)}</strong> <small>${PLANETS[h.planet].name}</small></span>
            </div>`).join("")}
        </div>
        <ul class="hour-key">
          ${["jupiter", "venus", "sun", "mercury", "saturn"].map((k) => `<li><b>${PLANETS[k].glyph} ${PLANETS[k].name}:</b> ${esc(H.meaning[k])}</li>`).join("")}
        </ul>
        <p class="hint">Times in your device's time zone. Planetary hours divide daylight and night into 12 parts each, so they're longer in summer.</p>
      </section>

      <div class="grid-2">
        <section class="card">
          <h3>Luckiest days ahead</h3>
          <ol class="timeline">
            ${D.top.map((d) => `
              <li><time>${fmtDate(d.date, { weekday: "short", month: "short", day: "numeric" })}</time>
                <div><strong>${d.phase.icon} ${d.hour ? `Best hour ${tfmt(d.hour.from)} (${PLANETS[d.hour.planet].name})` : ""}</strong>
                <p>${esc(d.reasons.join(" · ") || "A generally favorable day")}</p></div></li>`).join("")}
          </ol>
        </section>
        <section class="card">
          <h3>Best months (next 12)</h3>
          <ul class="months">
            ${M.map((m) => `
              <li class="${m.best ? "best" : ""}">
                <strong>${fmtDate(m.date, { month: "short", year: "numeric" })}</strong>
                <span>${m.best ? "★ " : ""}${esc(m.reasons.slice(0, 2).join(" · ") || "Steady month")}</span>
              </li>`).join("")}
          </ul>
        </section>
      </div>

      <section class="card">
        <h3>Your lucky years: Jupiter's journey through your chart</h3>
        <p class="small-p">Jupiter, the planet of luck and money, spends about a year in each sign. When it moves through your 2nd, 5th, 8th, 10th or 11th house, traditional astrology calls it a peak time for money, opportunity and good fortune.</p>
        <ol class="timeline">
          ${J.map((p) => `
            <li class="${p.current ? "now" : ""}"><time>${range(p)}</time>
              <div><strong>${stars(p.stars)} Jupiter in ${SIGNS[p.sign].name} · your ${Reading.ORD[p.house]} house${p.current ? " · now" : ""}${p.returnYear ? " · Jupiter return" : ""}</strong>
              <p>${esc(p.text)}${p.returnYear ? " Jupiter returns to where it was when you were born: a lucky 12-year reset." : ""}</p></div></li>`).join("")}
        </ol>
      </section>

      <div class="grid-2">
        <section class="card">
          <h3>Your personal numbers</h3>
          <div class="lucky nums">
            <div><small>Life Path</small><strong>${N.lifePath}</strong></div>
            <div><small>Birthday</small><strong>${N.birthday}</strong></div>
            <div><small>Personal year</small><strong>${N.personalYear}</strong></div>
            <div><small>Personal month</small><strong>${N.personalMonth}</strong></div>
            <div><small>Today</small><strong>${N.personalDay}</strong></div>
            ${N.expression ? `<div><small>Name</small><strong>${N.expression}</strong></div>` : `<div><small>Sun sign</small><strong>${N.sunLucky}</strong></div>`}
          </div>
          <p class="small-p mt-s">Your number set: <strong class="gold">${N.set.join(" · ")}</strong>. Use these when you choose numbers for fun. They don't make a combination more likely to win.</p>
        </section>
        <section class="card">
          <h3>House number calculator</h3>
          <label class="field"><span>Your address</span>
            <input type="text" id="addr-input" placeholder="e.g. 1472 Maple St, Apt 3B" value="${esc(savedAddr)}" autocomplete="street-address"></label>
          <label class="check"><input type="checkbox" id="addr-letters"> Count street letters too (Pythagorean)</label>
          <div id="addr-result" aria-live="polite"></div>
          <h4 class="mt">Best house numbers for you</h4>
          <ul class="home-list">${homes.map((h) => `<li><b class="gold">${h.n}</b> ${esc(h.title)} <small>e.g. ${h.examples.join(", ")}</small></li>`).join("")}</ul>
        </section>
      </div>`;
  }

  function bindAddress(c) {
    const input = $("#addr-input"), letters = $("#addr-letters"), out = $("#addr-result");
    if (!input) return;
    const update = () => {
      store.set("celestial.address", input.value);
      const r = Destiny.addressNumber(input.value, { includeLetters: letters.checked });
      if (!r) { out.innerHTML = ""; return; }
      if (r.error) { out.innerHTML = `<p class="field-error">${esc(r.error)}</p>`; return; }
      const m = Destiny.matchHome(r.value, c);
      out.innerHTML = `
        <div class="num-result">
          <span class="big-num">${r.value}</span>
          <div><strong>${esc(r.title)}</strong><small>${r.work.map(esc).join(" → ")}</small></div>
        </div>
        <p class="small-p">${esc(r.text)}</p>
        <p class="match ${m.level}"><b>${esc(m.label)}.</b> ${esc(m.text)}</p>`;
    };
    input.addEventListener("input", update);
    letters.addEventListener("change", update);
    update();
  }

  // ---------- places & car ----------
  function placeList(list, cls = "") {
    return `<ol class="place-list ${cls}">${list.map((p) => `<li><strong>${esc(p.name)}</strong><p>${esc(p.text)}${p.caution ? " " + esc(p.caution) : ""}</p></li>`).join("")}</ol>`;
  }

  function renderPlaces(c) {
    const R = Places.relocation(c);
    const car = Places.car(c);
    const savedYear = store.get("celestial.buildYear") || "";
    return `
      <section class="card hero-reading">
        <p class="eyebrow">Where you thrive</p>
        <h2>Best countries and US states for you</h2>
        <p class="overview">This uses relocation astrology: your birth chart is recast as if you were born in each place. Where Jupiter, Venus or the Sun land on an angle of your chart, life tends to feel luckier and easier. Where Saturn or Mars land there, it's usually harder work.</p>
      </section>
      ${R ? `
      <div class="grid-2">
        <section class="card"><h3>Best countries</h3>${placeList(R.countries)}
          ${R.countriesHard.length ? `<h4 class="mt">More challenging</h4>${placeList(R.countriesHard, "hard")}` : ""}</section>
        <section class="card"><h3>Best US states</h3>${placeList(R.states)}
          ${R.statesHard.length ? `<h4 class="mt">More challenging</h4>${placeList(R.statesHard, "hard")}` : ""}</section>
      </div>` : `
      <section class="card"><p class="note">ⓘ Relocation needs your exact birth time and birth city. Tap "Edit birth details" at the top to add them.</p></section>`}

      <section class="card">
        <p class="eyebrow">Your car</p>
        <h2>${esc(car.main.type)}</h2>
        <p class="overview">Your chart is mostly ${car.main.element}. ${esc(car.main.why)} ${esc(car.drive)}</p>
        <div class="grid-2 inner">
          <div><h4>Models that match your energy</h4><div class="badges">${car.main.examples.map((m) => `<span class="badge good">${esc(m)}</span>`).join("")}</div></div>
          ${car.alt ? `<div><h4>Your Venus taste: ${esc(car.alt.type.toLowerCase())}</h4><div class="badges">${car.alt.examples.map((m) => `<span class="badge">${esc(m)}</span>`).join("")}</div></div>` : ""}
          <div><h4>Lucky colors</h4><p>${car.colors.map(esc).join(" · ")}</p></div>
          <div><h4>Best build years (recent)</h4><p>${car.years.length ? car.years.map((y) => `<b class="gold">${y.year}</b>`).join(" · ") : "None stand out. Any year in your number family works."}</p></div>
        </div>
        <p class="hint">Example models are for style only. Choose a car on safety ratings, reliability and budget first.</p>
      </section>

      <section class="card">
        <h3>Build year checker: car or house</h3>
        <p class="small-p">Enter the year a car was made or a house was built. It's reduced to one digit and compared with your Life Path, and its Chinese zodiac year is compared with yours.</p>
        <label class="field"><span>Build year</span>
          <input type="text" id="year-input" inputmode="numeric" maxlength="4" placeholder="e.g. 2019" value="${esc(savedYear)}"></label>
        <div id="year-result" aria-live="polite"></div>
      </section>`;
  }

  function bindYear(c) {
    const input = $("#year-input"), out = $("#year-result");
    if (!input) return;
    const update = () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 4);
      store.set("celestial.buildYear", input.value);
      if (input.value.length < 4) { out.innerHTML = ""; return; }
      const r = Places.buildYear(c, input.value);
      if (r.error) { out.innerHTML = `<p class="field-error">${esc(r.error)}</p>`; return; }
      out.innerHTML = `
        <div class="num-result">
          <span class="big-num">${r.value}</span>
          <div><strong>${esc(r.title)}</strong><small>${r.work.map(esc).join(" → ")}</small></div>
        </div>
        <p class="match ${r.match.level}"><b>${esc(r.match.label)}.</b> ${esc(r.match.text)}</p>
        <p class="match ${r.zodiac.level}">${esc(r.zodiac.text)}</p>`;
    };
    input.addEventListener("input", update);
    update();
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
  $("#cancel-btn").addEventListener("click", () => { state.adding = false; if (state.chart) load(state.birth, state.profileId); });
  const activeId = store.get("celestial.active");
  const profiles = getProfiles();
  const saved = profiles.find((p) => p.id === activeId) || profiles[0];
  if (saved) load(saved.birth, saved.id);

  // Installable, offline-capable app.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
