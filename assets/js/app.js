const DATA_URL = "./data/cards/person-001.json";

function $(id) {
  return document.getElementById(id);
}

function safeText(value) {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s.length ? s : "—";
}

function setStatus(message, isError = false) {
  const el = $("status");
  if (!el) return;
  el.textContent = message;
  el.style.opacity = "0.9";
  el.style.color = isError ? "#ffb4b4" : "";
}

function renderCard(data) {
  const nom = safeText(data?.nom);
  const prenom = safeText(data?.prenom);
  const age = safeText(data?.age);

  $("field-nom").textContent = nom;
  $("field-prenom").textContent = prenom;
  $("field-age").textContent = age;

  $("card-title").textContent = `${prenom} ${nom}`.trim() || "—";

  setStatus("Données chargées depuis JSON ✅");
}

async function loadCard(url) {
  try {
    setStatus("Chargement des données…");

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    renderCard(data);
  } catch (err) {
    console.error(err);
    setStatus("Erreur: impossible de charger le JSON. Vérifie le chemin et le format.", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCard(DATA_URL);
});
