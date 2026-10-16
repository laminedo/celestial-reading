// Optional account sync (Supabase, email magic link). The app works fully without it:
// everything lives in localStorage, and when signed in each profile, journal day, goal and
// setting is mirrored as one row in `sync_items`. Conflicts resolve per item, newest edit wins.

const Sync = (() => {
  const SUPABASE_URL = "https://jwwtmhwayjwqbpftmcax.supabase.co";
  const SUPABASE_KEY = "sb_publishable_TUvgvX2fmXjobQdAi3aABA_FH-aT6OB"; // publishable: safe in the browser, row-level security protects data
  const META = "celestial.sync.meta"; // { itemKey: { hash, local: ms of last local edit, synced: ms of last server version applied/pushed } }
  const LAST = "celestial.sync.last";
  const PREFS = { active: "celestial.active", match: "celestial.match", address: "celestial.address", buildYear: "celestial.buildYear" };
  const SYNCED_KEYS = new Set(["celestial.profiles", "celestial.journal", "celestial.goals", ...Object.values(PREFS)]);

  const ls = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  let client = null, user = null, timer = null, busy = false, again = false;
  let listeners = { status: [], remote: [] };
  let status = { state: "off", message: "" };
  const emit = (type, payload) => listeners[type].forEach((fn) => { try { fn(payload); } catch { /* ignore */ } });
  const setStatus = (state, message = "") => { status = { state, message, at: Date.now() }; emit("status", status); };

  // ---------- local items ----------
  function flatten() {
    const items = {};
    (ls.get("celestial.profiles") || []).forEach((p) => { if (p && p.id) items[`profile:${p.id}`] = p; });
    Object.entries(ls.get("celestial.journal") || {}).forEach(([d, v]) => (items[`journal:${d}`] = v));
    Object.entries(ls.get("celestial.goals") || {}).forEach(([d, v]) => (items[`goal:${d}`] = v));
    Object.entries(PREFS).forEach(([name, k]) => {
      const v = ls.get(k);
      if (v !== null && v !== undefined && v !== "") items[`pref:${name}`] = v;
    });
    return items;
  }

  function applyRemote(key, value) {
    const [kind, ...rest] = key.split(":");
    const id = rest.join(":");
    if (kind === "profile") {
      const list = ls.get("celestial.profiles") || [];
      const i = list.findIndex((p) => p.id === id);
      if (value === null) { if (i >= 0) list.splice(i, 1); }
      else if (i >= 0) list[i] = value; else list.push(value);
      ls.set("celestial.profiles", list);
    } else if (kind === "journal" || kind === "goal") {
      const k = kind === "journal" ? "celestial.journal" : "celestial.goals";
      const obj = ls.get(k) || {};
      if (value === null) delete obj[id]; else obj[id] = value;
      ls.set(k, obj);
    } else if (kind === "pref" && PREFS[id]) {
      if (value === null) { try { localStorage.removeItem(PREFS[id]); } catch { /* ignore */ } }
      else ls.set(PREFS[id], value);
    }
  }

  const hash = (v) => JSON.stringify(v);

  // Record a local edit time for every item whose content changed since we last looked.
  function detectLocal(now = Date.now()) {
    const meta = ls.get(META) || {};
    const items = flatten();
    let changed = false;
    // Data that existed before this device's first sync gets time 0, so the cloud copy wins on overlap.
    const firstSync = !ls.get(LAST);
    for (const [k, v] of Object.entries(items)) {
      const h = hash(v);
      if (!meta[k]) { meta[k] = { hash: h, local: firstSync ? 0 : now, synced: 0, dirty: true }; changed = true; }
      else if (meta[k].hash !== h) { meta[k] = { ...meta[k], hash: h, local: now, dirty: true }; changed = true; }
    }
    for (const k of Object.keys(meta)) {
      if (!(k in items) && meta[k].hash !== null) { meta[k] = { ...meta[k], hash: null, local: now, dirty: true }; changed = true; }
    }
    ls.set(META, meta);
    return changed;
  }

  // ---------- sync ----------
  async function syncNow() {
    if (!client || !user) return;
    if (busy) { again = true; return; }
    busy = true;
    setStatus("syncing");
    try {
      detectLocal();
      const { data: rows, error } = await client.from("sync_items").select("key, value, deleted, updated_at");
      if (error) throw error;
      const meta = ls.get(META) || {};
      const server = Object.fromEntries(rows.map((r) => [r.key, { ...r, t: Date.parse(r.updated_at) }]));
      const push = [];
      let remoteChanged = false;

      for (const key of new Set([...Object.keys(meta), ...Object.keys(server)])) {
        const m = meta[key], s = server[key];
        const serverChanged = Boolean(s) && s.t > ((m && m.synced) || 0);
        // Local edits win unless the server copy also changed since our last sync; then the newer edit wins.
        const localWins = m && m.dirty && (!serverChanged || m.local >= s.t);
        if (localWins) {
          const value = m.hash === null ? null : JSON.parse(m.hash);
          if (!s && value === null) { delete meta[key]; continue; } // deleted before it ever reached the server
          push.push({ user_id: user.id, key, value, deleted: value === null, updated_at: new Date(m.local || Date.now()).toISOString() }); // when the edit happened, so the newest edit wins
        } else if (serverChanged) {
          const value = s.deleted ? null : s.value;
          if (!m || m.hash !== (value === null ? null : hash(value))) { applyRemote(key, value); remoteChanged = true; }
          meta[key] = { hash: value === null ? null : hash(value), local: s.t, synced: s.t, dirty: false };
        }
      }

      if (push.length) {
        const { data: saved, error: upErr } = await client.from("sync_items").upsert(push, { onConflict: "user_id,key" }).select("key, updated_at");
        if (upErr) throw upErr;
        saved.forEach((r) => {
          const t = Date.parse(r.updated_at);
          if (meta[r.key]) meta[r.key] = { ...meta[r.key], local: t, synced: t, dirty: false };
        });
      }
      ls.set(META, meta);
      ls.set(LAST, Date.now());
      if (remoteChanged) emit("remote");
      setStatus("synced");
    } catch (e) {
      setStatus("error", navigator.onLine === false ? "You're offline. Changes will sync when you reconnect." : (e && e.message) || "Sync failed");
    } finally {
      busy = false;
      if (again) { again = false; schedule(500); }
    }
  }

  function schedule(ms = 1500) {
    clearTimeout(timer);
    timer = setTimeout(syncNow, ms);
  }

  // Called by the app's storage wrapper after every write.
  function changed(storageKey) {
    if (!SYNCED_KEYS.has(storageKey)) return;
    detectLocal();
    if (user) schedule();
  }

  // ---------- auth ----------
  async function init() {
    if (!window.supabase || !window.supabase.createClient) { setStatus("unavailable", "Sync is unavailable offline."); return; }
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
    });
    client.auth.onAuthStateChange((event, session) => {
      const was = user && user.id;
      user = session ? session.user : null;
      if (user && user.id !== was) { setStatus("syncing"); schedule(50); }
      if (!user) setStatus("off");
    });
    const { data } = await client.auth.getSession();
    user = data.session ? data.session.user : null;
    if (user) schedule(50); else setStatus("off");
    window.addEventListener("online", () => user && schedule(200));
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && user) schedule(200); });
  }

  async function signIn(email) {
    if (!client) throw new Error("Sync is unavailable right now. Check your connection and reload.");
    const redirect = location.href.split("#")[0].split("?")[0];
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect, shouldCreateUser: true } });
    if (error) throw error;
  }

  async function signOut({ keepLocal = true } = {}) {
    if (client) await client.auth.signOut();
    user = null;
    try { localStorage.removeItem(META); localStorage.removeItem(LAST); } catch { /* ignore */ }
    if (!keepLocal) {
      ["celestial.profiles", "celestial.journal", "celestial.goals", ...Object.values(PREFS)].forEach((k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
      emit("remote");
    }
    setStatus("off");
  }

  async function deleteCloudData() {
    if (!client || !user) return;
    const { error } = await client.from("sync_items").delete().eq("user_id", user.id);
    if (error) throw error;
    await signOut({ keepLocal: true });
  }

  return {
    init, signIn, signOut, deleteCloudData, syncNow, changed,
    on: (type, fn) => listeners[type].push(fn),
    get user() { return user; },
    get status() { return status; },
    lastSync: () => ls.get(LAST),
    // exposed for tests
    _flatten: flatten, _applyRemote: applyRemote, _detectLocal: detectLocal,
    _setClient: (c, u) => { client = c; user = u; },
  };
})();
