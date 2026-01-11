/**
 * App de révision (statique) — refonte
 * Source unique : data/decks/index.json -> deck.json -> cards[]
 *
 * Affichage carte (simple) :
 * - notion
 * - explication (fallback: definition si l'ancien deck est encore en place)
 * - exemple
 * - image fixe (branding) si la carte n'a pas d'image propre (optionnel)
 *
 * UI :
 * - sélection deck
 * - suivant
 * - aléatoire
 */

// Base URLs robustes (GitHub Pages friendly)
const ROOT_DIR = new URL("../../", import.meta.url);
const DECKS_DIR = new URL("data/decks/", ROOT_DIR);
const DECKS_INDEX_URL = new URL("index.json", DECKS_DIR);

// Image globale par défaut (branding)
const DEFAULT_CARD_IMAGE = {
  src: "assets/images/istqb-fl-fr/001.png",
  alt: "Illustration — révision test logiciel"
};

function $(id) {
  return document.getElementById(id);
}

function setStatus(message, isError = false) {
  const el = $("status");
  if (!el) return;
  el.textContent = message;
  el.dataset.state = isError ? "error" : "ok";
}

function setControlsEnabled(enabled) {
  const deckSelect = $("deck-select");
  const btnNext = $("btn-next");
  const btnRandom = $("btn-random");

  if (deckSelect) deckSelect.disabled = !enabled;
  if (btnNext) btnNext.disabled = !enabled;
  if (btnRandom) btnRandom.disabled = !enabled;
}

function safeText(value) {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s.length ? s : "—";
}

// Sécurité : on injecte via innerHTML => on échappe tout texte venant des JSON
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function fetchJSON(urlObj) {
  const res = await fetch(urlObj.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status} on ${res.url}`);
  return res.json();
}

/**
 * Normalize deck to a minimal internal model.
 * Accepts both:
 * - new format: { cards: [{ notion, explication, exemple, ...}] }
 * - old format: { cards: [{ notion, definition, exemple, ...}] } (compat)
 */
function normalizeDeck(rawDeck, fallbackId = "deck") {
  const id = safeText(rawDeck?.id) !== "—" ? String(rawDeck.id) : fallbackId;
  const title = safeText(rawDeck?.title) !== "—" ? String(rawDeck.title) : "Deck";
  const description = safeText(rawDeck?.description);

  const cardsRaw = Array.isArray(rawDeck?.cards) ? rawDeck.cards : [];

  const cards = cardsRaw.map((c, idx) => {
    const cardId = safeText(c?.id) !== "—" ? String(c.id) : String(idx + 1).padStart(3, "0");

    const notion = safeText(c?.notion);

    // Nouveau champ cible = explication
    // Compat: ancien deck peut encore avoir "definition"
    const explication = safeText(c?.explication ?? c?.definition);

    const exemple = safeText(c?.exemple);

    // image optionnelle au niveau carte
    const imageSrc = c?.image?.src ? String(c.image.src).trim() : "";
    const imageAlt = c?.image?.alt ? String(c.image.alt).trim() : "";

    return {
      id: cardId,
      notion,
      explication,
      exemple,
      image: imageSrc ? { src: imageSrc, alt: imageAlt || notion || DEFAULT_CARD_IMAGE.alt } : null
    };
  });

  return { id, title, description, cards };
}

function resolveCardImage(card) {
  if (card?.image?.src) {
    return {
      src: safeText(card.image.src),
      alt: safeText(card.image.alt) !== "—" ? card.image.alt : DEFAULT_CARD_IMAGE.alt
    };
  }
  return DEFAULT_CARD_IMAGE;
}

function cardHTML(deck, card, positionText) {
  const deckTitle = escapeHTML(safeText(deck?.title));
  const cardId = escapeHTML(safeText(card?.id));
  const notion = escapeHTML(safeText(card?.notion));

  const explication = escapeHTML(safeText(card?.explication));
  const exemple = escapeHTML(safeText(card?.exemple));

  const pos = escapeHTML(safeText(positionText));

  const img = resolveCardImage(card);
  const imgSrc = escapeHTML(img.src);
  const imgAlt = escapeHTML(img.alt);

  return `
    <article class="card">
      <div class="card__badge">${deckTitle} • ID ${cardId} • ${pos}</div>

      <h2 class="card__title">${notion}</h2>

      <div class="card__media">
        <img class="card__img" src="${imgSrc}" alt="${imgAlt}" loading="lazy" />
      </div>

      <div class="card__sections">
        <section class="section">
          <h3 class="section__label">Explication</h3>
          <p class="section__content">${explication}</p>
        </section>

        <section class="section">
          <h3 class="section__label">Exemple</h3>
          <p class="section__content">${exemple}</p>
        </section>
      </div>
    </article>
  `;
}

function renderSingleCard(deck, cardIndex) {
  const container = $("cards");
  if (!container) return;

  const total = deck.cards.length;

  if (total === 0) {
    container.innerHTML = `
      <article class="card">
        <h2 class="card__title">Aucune carte</h2>
        <p class="card__text">Ce deck ne contient aucune carte pour le moment.</p>
      </article>
    `;
    setStatus("Deck chargé, mais vide.", true);
    setControlsEnabled(false);
    return;
  }

  const i = Math.max(0, Math.min(cardIndex, total - 1));
  const card = deck.cards[i];

  const posText = `${i + 1}/${total}`;
  container.innerHTML = cardHTML(deck, card, posText);

  setStatus(`Deck: ${deck.title} — carte ${posText}`);
  setControlsEnabled(true);
}

function storageKey(deckId) {
  return `revisionapp:deck:${deckId}:index`;
}

function loadSavedIndex(deckId) {
  try {
    const raw = localStorage.getItem(storageKey(deckId));
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveIndex(deckId, index) {
  try {
    localStorage.setItem(storageKey(deckId), String(index));
  } catch {
    // ignore
  }
}

async function loadDeckCatalog() {
  const decksIndex = await fetchJSON(DECKS_INDEX_URL);
  const decks = Array.isArray(decksIndex?.decks) ? decksIndex.decks : [];

  if (decks.length === 0) {
    throw new Error('Deck catalog vide (champ "decks").');
  }

  return decks
    .map((d) => ({
      id: String(d.id || "").trim(),
      title: String(d.title || "").trim(),
      file: String(d.file || "").trim()
    }))
    .filter((d) => d.id && d.file);
}

async function loadDeckFile(deckMeta) {
  const deckUrl = new URL(deckMeta.file, DECKS_DIR);
  const rawDeck = await fetchJSON(deckUrl);
  return normalizeDeck(rawDeck, deckMeta.id);
}

function fillDeckSelect(options, selectedId) {
  const select = $("deck-select");
  if (!select) return;

  select.innerHTML = options
    .map((d) => {
      const id = escapeHTML(d.id);
      const title = escapeHTML(d.title || d.id);
      const selected = d.id === selectedId ? "selected" : "";
      return `<option value="${id}" ${selected}>${title}</option>`;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  setControlsEnabled(false);
  setStatus("Chargement…");

  const deckSelect = $("deck-select");
  const btnNext = $("btn-next");
  const btnRandom = $("btn-random");

  let decksMeta = [];
  let currentDeck = null;
  let currentIndex = 0;

  async function loadDeckById(deckId) {
    const meta = decksMeta.find((d) => d.id === deckId) || decksMeta[0];

    currentDeck = await loadDeckFile(meta);
    currentIndex = Math.max(0, Math.min(loadSavedIndex(currentDeck.id), currentDeck.cards.length - 1));

    renderSingleCard(currentDeck, currentIndex);
  }

  if (deckSelect) {
    deckSelect.addEventListener("change", async (e) => {
      const id = e.target.value;
      setControlsEnabled(false);
      setStatus("Changement de deck…");

      try {
        await loadDeckById(id);
      } catch (err) {
        console.error(err);
        setStatus(`Erreur: ${err.message}`, true);
      }
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      if (!currentDeck || currentDeck.cards.length === 0) return;
      currentIndex = (currentIndex + 1) % currentDeck.cards.length;
      saveIndex(currentDeck.id, currentIndex);
      renderSingleCard(currentDeck, currentIndex);
    });
  }

  if (btnRandom) {
    btnRandom.addEventListener("click", () => {
      if (!currentDeck || currentDeck.cards.length === 0) return;

      const n = currentDeck.cards.length;
      if (n === 1) return renderSingleCard(currentDeck, 0);

      let next = currentIndex;
      while (next === currentIndex) next = Math.floor(Math.random() * n);

      currentIndex = next;
      saveIndex(currentDeck.id, currentIndex);
      renderSingleCard(currentDeck, currentIndex);
    });
  }

  try {
    decksMeta = await loadDeckCatalog();

    const selectedId = decksMeta[0].id;
    fillDeckSelect(decksMeta, selectedId);

    await loadDeckById(selectedId);
  } catch (err) {
    console.error(err);
    $("cards").innerHTML = `
      <article class="card">
        <h2 class="card__title">Impossible de charger les decks</h2>
        <p class="card__text">
          Vérifie <code>data/decks/index.json</code> et le fichier deck référencé.
        </p>
      </article>
    `;
    setStatus(`Erreur: ${err.message}`, true);
    setControlsEnabled(false);
  }
});
