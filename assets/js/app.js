// Base "data/cards/" calculée depuis l'emplacement réel du fichier JS.
// app.js est dans /assets/js/ → on remonte de 2 niveaux vers / puis /data/cards/
const DATA_DIR = new URL("../../data/cards/", import.meta.url);
const MANIFEST_URL = new URL("index.json", DATA_DIR);

function $(id) {
  return document.getElementById(id);
}

function setStatus(message, isError = false) {
  const el = $("status");
  if (!el) return;
  el.textContent = message;
  el.dataset.state = isError ? "error" : "ok";
}

function safeText(value) {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s.length ? s : "—";
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cardHTML({ id, nom, prenom, age }) {
  const _id = escapeHTML(safeText(id));
  const _nom = escapeHTML(safeText(nom));
  const _prenom = escapeHTML(safeText(prenom));
  const _age = escapeHTML(safeText(age));
  const title = `${_prenom} ${_nom}`.trim() || "—";

  return `
    <article class="card">
      <div class="card__badge">ID • ${_id}</div>
      <h2 class="card__title">${title}</h2>

      <dl class="card__meta">
        <div class="meta__row">
          <dt>Nom</dt>
          <dd>${_nom}</dd>
        </div>
        <div class="meta__row">
          <dt>Prénom</dt>
          <dd>${_prenom}</dd>
        </div>
        <div class="meta__row">
          <dt>Âge</dt>
          <dd>${_age}</dd>
        </div>
      </dl>
    </article>
  `;
}

async function fetchJSON(urlObj) {
  const url = urlObj.toString();
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    // On donne un message "debuggable" direct
    throw new Error(`Fetch failed: HTTP ${res.status} on ${res.url}`);
  }
  return res.json();
}

async function loadAndRenderAllCards() {
  const container = $("cards");
  if (!container) return;

  try {
    setStatus(`Chargement du manifest… (${MANIFEST_URL})`);

    const manifest = await fetchJSON(MANIFEST_URL);
    const cards = Array.isArray(manifest?.cards) ? manifest.cards : [];

    if (cards.length === 0) {
      container.innerHTML = "";
      setStatus('Aucune carte: "cards" est vide dans index.json.', true);
      return;
    }

    setStatus(`Manifest OK — ${cards.length} carte(s) à charger…`);

    const results = await Promise.allSettled(
      cards.map(async (entry) => {
        const id = entry?.id ?? "—";
        const file = entry?.file;

        if (!file) throw new Error(`Entrée sans "file" (id=${id})`);

        const dataUrl = new URL(file, DATA_DIR);
        const data = await fetchJSON(dataUrl);

        return {
          id,
          nom: data?.nom,
          prenom: data?.prenom,
          age: data?.age
        };
      })
    );

    const ok = [];
    const ko = [];

    for (const r of results) {
      if (r.status === "fulfilled") ok.push(r.value);
      else ko.push(r.reason);
    }

    container.innerHTML = ok.map(cardHTML).join("");

    if (ko.length > 0) {
      console.error("Card load errors:", ko);
      setStatus(`Chargé: ${ok.length}/${results.length}. Certaines cartes ont échoué (console).`, true);
    } else {
      setStatus(`Chargé: ${ok.length}/${results.length} ✅`);
    }
  } catch (err) {
    console.error(err);
    $("cards").innerHTML = "";
    setStatus(`Erreur: ${err.message}`, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadAndRenderAllCards();
});
