/**
 * news.js – Fetches and renders categorised news using the GNews API.
 */

const GNEWS_BASE = "https://gnews.io/api/v4/search";
const CATEGORIES = ["politics", "economy", "entertainment", "sports"];
const ARTICLES_PER_ROW = 3;

/**
 * Fetch articles for a given topic/category.
 * @param {string} category
 * @returns {Promise<Array>}
 */
async function fetchNews(category) {
  const params = new URLSearchParams({
    q: category,
    lang: "en",
    max: ARTICLES_PER_ROW,
    apikey: CONFIG.GNEWS_API_KEY,
  });
  const res = await fetch(`${GNEWS_BASE}?${params}`);
  if (!res.ok) throw new Error(`GNews API error ${res.status}`);
  const data = await res.json();
  return data.articles || [];
}

/**
 * Create the DOM node for a single news article card.
 * @param {Object} article
 * @returns {HTMLElement}
 */
function createArticleCard(article) {
  const card = document.createElement("a");
  card.href = article.url || "#";
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.className = "news-card";

  const imgHTML = article.image
    ? `<img class="news-card__img" src="${escapeAttr(article.image)}" alt="${escapeAttr(article.title)}" loading="lazy">`
    : `<div class="news-card__img-placeholder">📰 No image</div>`;

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "";

  const source = article.source?.name || "";

  card.innerHTML = `
    ${imgHTML}
    <div class="news-card__body">
      <p class="news-card__title">${escapeHTML(article.title || "Untitled")}</p>
      <p class="news-card__desc">${escapeHTML(article.description || "")}</p>
      <div class="news-card__meta">
        <span class="news-card__source">${escapeHTML(source)}</span>
        <span>${escapeHTML(date)}</span>
      </div>
    </div>`;

  return card;
}

/**
 * Render a news section (heading + 3-article row) into the container.
 * @param {string} category
 * @param {HTMLElement} container
 */
async function renderNewsSection(category, container) {
  const section = document.createElement("section");
  section.className = "news-section";

  const heading = document.createElement("h2");
  heading.className = "section-heading";
  heading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  section.appendChild(heading);

  // Spinner placeholder
  const spinner = spinnerHTML("spinner--sm");
  const spinnerWrap = document.createElement("div");
  spinnerWrap.className = "spinner-wrap";
  spinnerWrap.innerHTML = spinner;
  section.appendChild(spinnerWrap);

  container.appendChild(section);

  try {
    const articles = await fetchNews(category);
    spinnerWrap.remove();

    if (!articles.length) {
      const empty = document.createElement("p");
      empty.className = "empty-msg";
      empty.textContent = `No articles found for "${category}".`;
      section.appendChild(empty);
      return;
    }

    const row = document.createElement("div");
    row.className = "news-row";
    articles.slice(0, ARTICLES_PER_ROW).forEach((art) => row.appendChild(createArticleCard(art)));
    section.appendChild(row);
  } catch (err) {
    spinnerWrap.remove();
    const errEl = document.createElement("div");
    errEl.className = "error-msg";
    errEl.innerHTML = `<strong>Failed to load ${category} news: </strong>${escapeHTML(err.message)}`;
    section.appendChild(errEl);
  }
}

/** Initialise news sections on the home page. */
async function initNews() {
  const container = document.getElementById("news-container");
  if (!container) return;

  // Render all categories (sequentially to respect API rate limits)
  for (const cat of CATEGORIES) {
    await renderNewsSection(cat, container);
  }
}

// Utilities (shared; will be overridden if defined in a shared utility file)
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function spinnerHTML(extraClass = "") {
  return `<div class="spinner ${extraClass}"></div>`;
}
