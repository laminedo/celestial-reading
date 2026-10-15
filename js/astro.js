// Low-precision planetary positions (Paul Schlyter's method, ~1° accuracy).
// Returns tropical geocentric ecliptic longitudes in degrees.

const Astro = (() => {
  const RAD = Math.PI / 180;
  const DAY = 86400000;
  const norm = (x) => ((x % 360) + 360) % 360;
  const sind = (x) => Math.sin(x * RAD);
  const cosd = (x) => Math.cos(x * RAD);
  const dayNumber = (date) => date.getTime() / DAY + 2440587.5 - 2451543.5;

  const ELEMENTS = {
    sun:     (d) => ({ N: 0, i: 0, w: 282.9404 + 4.70935e-5 * d, a: 1, e: 0.016709 - 1.151e-9 * d, M: 356.047 + 0.9856002585 * d }),
    moon:    (d) => ({ N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.0549, M: 115.3654 + 13.0649929509 * d }),
    mercury: (d) => ({ N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d }),
    venus:   (d) => ({ N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d }),
    mars:    (d) => ({ N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d }),
    jupiter: (d) => ({ N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.895 + 0.0830853001 * d }),
    saturn:  (d) => ({ N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.967 + 0.0334442282 * d }),
  };

  function eccentricAnomaly(M, e) {
    M = norm(M);
    let E = M + (180 / Math.PI) * e * sind(M) * (1 + e * cosd(M));
    for (let k = 0; k < 10; k++) {
      const dE = (E - (180 / Math.PI) * e * sind(E) - M) / (1 - e * cosd(E));
      E -= dE;
      if (Math.abs(dE) < 1e-6) break;
    }
    return E;
  }

  // Position in the orbit's reference frame → ecliptic lon/lat/r.
  function orbit(el) {
    const E = eccentricAnomaly(el.M, el.e);
    const xv = el.a * (cosd(E) - el.e);
    const yv = el.a * Math.sqrt(1 - el.e * el.e) * sind(E);
    const v = Math.atan2(yv, xv) / RAD;
    const r = Math.hypot(xv, yv);
    const vw = v + el.w;
    const x = r * (cosd(el.N) * cosd(vw) - sind(el.N) * sind(vw) * cosd(el.i));
    const y = r * (sind(el.N) * cosd(vw) + cosd(el.N) * sind(vw) * cosd(el.i));
    const z = r * sind(vw) * sind(el.i);
    return { lon: Math.atan2(y, x) / RAD, lat: Math.atan2(z, Math.hypot(x, y)) / RAD, r };
  }

  const toXYZ = ({ lon, lat, r }) => ({
    x: r * cosd(lon) * cosd(lat),
    y: r * sind(lon) * cosd(lat),
    z: r * sind(lat),
  });

  function longitudes(date) {
    const d = dayNumber(date);
    const out = {};

    const s = ELEMENTS.sun(d);
    const sun = orbit(s);
    out.sun = norm(sun.lon);
    const sunXYZ = toXYZ({ lon: sun.lon, lat: 0, r: sun.r });

    const m = ELEMENTS.moon(d);
    const Ms = norm(s.M), Mm = norm(m.M);
    const Ls = Ms + s.w, Lm = Mm + m.w + m.N;
    const D = Lm - Ls, F = Lm - m.N;
    out.moon = norm(orbit(m).lon
      - 1.274 * sind(Mm - 2 * D) + 0.658 * sind(2 * D) - 0.186 * sind(Ms)
      - 0.059 * sind(2 * Mm - 2 * D) - 0.057 * sind(Mm - 2 * D + Ms)
      + 0.053 * sind(Mm + 2 * D) + 0.046 * sind(2 * D - Ms) + 0.041 * sind(Mm - Ms)
      - 0.035 * sind(D) - 0.031 * sind(Mm + Ms) - 0.015 * sind(2 * F - 2 * D)
      + 0.011 * sind(Mm - 4 * D));

    const Mj = ELEMENTS.jupiter(d).M, Msa = ELEMENTS.saturn(d).M;
    const perturb = {
      jupiter: -0.332 * sind(2 * Mj - 5 * Msa - 67.6) - 0.056 * sind(2 * Mj - 2 * Msa + 21)
        + 0.042 * sind(3 * Mj - 5 * Msa + 21) - 0.036 * sind(Mj - 2 * Msa)
        + 0.022 * cosd(Mj - Msa) + 0.023 * sind(2 * Mj - 3 * Msa + 52) - 0.016 * sind(Mj - 5 * Msa - 69),
      saturn: 0.812 * sind(2 * Mj - 5 * Msa - 67.6) - 0.229 * cosd(2 * Mj - 4 * Msa - 2)
        + 0.119 * sind(Mj - 2 * Msa - 3) + 0.046 * sind(2 * Mj - 6 * Msa - 69) + 0.014 * sind(Mj - 3 * Msa + 32),
    };

    for (const p of ["mercury", "venus", "mars", "jupiter", "saturn"]) {
      const helio = orbit(ELEMENTS[p](d));
      helio.lon += perturb[p] || 0;
      const h = toXYZ(helio);
      out[p] = norm(Math.atan2(h.y + sunXYZ.y, h.x + sunXYZ.x) / RAD);
    }
    return out;
  }

  // Ascendant and Midheaven for a moment and place (lat/lon in degrees, east positive).
  function angles(date, lat, lon) {
    const jd = date.getTime() / DAY + 2440587.5;
    const ramc = norm(280.46061837 + 360.98564736629 * (jd - 2451545) + lon);
    const eps = 23.4393 - 3.563e-7 * (jd - 2451543.5);
    const asc = Math.atan2(cosd(ramc), -(sind(ramc) * cosd(eps) + Math.tan(lat * RAD) * sind(eps))) / RAD;
    const mc = Math.atan2(sind(ramc), cosd(ramc) * cosd(eps)) / RAD;
    return { asc: norm(asc), mc: norm(mc) };
  }

  const signOf = (lon) => Math.floor(norm(lon) / 30);
  const degreeInSign = (lon) => norm(lon) % 30;

  function phase(date) {
    const L = longitudes(date);
    const elong = norm(L.moon - L.sun);
    return {
      elong,
      index: Math.floor(norm(elong + 22.5) / 45) % 8,
      illumination: Math.round(((1 - cosd(elong)) / 2) * 100),
    };
  }

  const isRetrograde = (planet, date) => {
    const a = longitudes(new Date(date.getTime() - DAY / 2))[planet];
    const b = longitudes(new Date(date.getTime() + DAY / 2))[planet];
    return norm(b - a + 180) - 180 < 0;
  };

  // New, first quarter, full, last quarter moments between two dates.
  function phaseEvents(start, end) {
    const events = [];
    const step = DAY / 4;
    let t = start.getTime();
    let prev = phase(new Date(t)).elong;
    while (t < end.getTime()) {
      const t2 = t + step;
      const cur = phase(new Date(t2)).elong;
      for (let q = 0; q < 4; q++) {
        const target = q * 90;
        const a = norm(prev - target + 180) - 180;
        const b = norm(cur - target + 180) - 180;
        if (a < 0 && b >= 0) {
          let lo = t, hi = t2;
          for (let k = 0; k < 20; k++) {
            const mid = (lo + hi) / 2;
            if (norm(phase(new Date(mid)).elong - target + 180) - 180 < 0) lo = mid; else hi = mid;
          }
          const when = new Date(hi);
          if (when >= start && when < end) {
            events.push({ date: when, quarter: q, phaseIndex: q * 2, moonLon: longitudes(when).moon });
          }
        }
      }
      prev = cur;
      t = t2;
    }
    return events;
  }

  // Sign changes and retrograde stations sampled daily at local noon.
  function planetEvents(planet, start, end) {
    const events = [];
    const day = new Date(start);
    day.setHours(12, 0, 0, 0);
    let prevSign = signOf(longitudes(day)[planet]);
    let prevRetro = isRetrograde(planet, day);
    while (day < end) {
      day.setDate(day.getDate() + 1);
      const sign = signOf(longitudes(day)[planet]);
      const retro = isRetrograde(planet, day);
      if (sign !== prevSign) events.push({ type: "ingress", planet, date: new Date(day), sign });
      if (retro !== prevRetro) events.push({ type: retro ? "station-retro" : "station-direct", planet, date: new Date(day), sign });
      prevSign = sign;
      prevRetro = retro;
    }
    return events;
  }

  return { longitudes, angles, signOf, degreeInSign, phase, isRetrograde, phaseEvents, planetEvents, norm, DAY };
})();
