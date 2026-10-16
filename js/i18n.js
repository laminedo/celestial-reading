// Language: English (default) or French. Chosen once per device; the page reloads on change
// so every module builds its text in the right language from the start.

const LANG = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("celestial.lang"));
    if (saved === "en" || saved === "fr") return saved;
  } catch { /* storage unavailable */ }
  return (navigator.language || "").toLowerCase().startsWith("fr") ? "fr" : "en";
})();
const FR = LANG === "fr";
const LOCALE = FR ? "fr-FR" : undefined;

// t("English", "Français") — pick the active language.
const t = (en, fr) => (FR ? fr : en);

const ELEMENT_NAMES = { Fire: "Feu", Earth: "Terre", Air: "Air", Water: "Eau" };
const elName = (el) => (FR ? ELEMENT_NAMES[el] || el : el);

function setLang(lang) {
  try { localStorage.setItem("celestial.lang", JSON.stringify(lang)); } catch { /* storage unavailable */ }
  location.reload();
}

document.documentElement.lang = LANG;

// French contractions when a phrase follows "de" / "à", repeated across list items:
// de("les relations, les partenaires et les accords") → "des relations, des partenaires et des accords".
const frPrep = (x, forms) => String(x).split(/(, | et )/).map((part, i) => {
  if (i % 2) return part; // separator
  if (/^le /i.test(part)) return forms.le + part.slice(3);
  if (/^les /i.test(part)) return forms.les + part.slice(4);
  return forms.other + part;
}).join("");
const de = (x) => frPrep(x, { le: "du ", les: "des ", other: "de " }).replace(/\bde ([aeiouéèêh])/gi, "d'$1").replace(/\bd'(l')/g, "de $1");
const au = (x) => frPrep(x, { le: "au ", les: "aux ", other: "à " });
// "quelqu'un de" + adjective, with elision before a vowel.
const deAdj = (x) => (/^[aeiouéèêh]/i.test(x) ? "d'" : "de ") + x;
