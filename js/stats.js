/**
 * stats.js – Fetches and renders player statistics (Top Scorers, Yellow/Red Cards).
 * Includes sort buttons for each section.
 * Uses AllSportsAPI.
 */

const ALLSPORTS_STATS_BASE = "https://apiv2.allsportsapi.com/football/";

/** Cached player data */
let topScorers   = [];
let yellowCards  = [];
let redCards     = [];

// ── Sort state ────────────────────────────────────────────────────────────────

// Active sort key per section
let scorersSort  = "goals";
let yellowSort   = "yellow_cards";
let redSort      = "red_cards";

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch player statistics for the configured league.
 * @returns {Promise<Array>}
 */
async function fetchTopScorers() {
  const params = new URLSearchParams({
    met: "TopScorers",
    APIkey: CONFIG.ALLSPORTS_API_KEY,
    leagueId: CONFIG.DEFAULT_LEAGUE_ID,
  });
  const res = await fetch(`${ALLSPORTS_STATS_BASE}?${params}`);
  if (!res.ok) throw new Error(`AllSportsAPI error ${res.status}`);
  const data = await res.json();
  return data.result || [];
}

// ── Render ────────────────────────────────────────────────────────────────────

/**
 * Build a player card HTML string.
 * @param {Object} player
 * @returns {string}
 */
function playerCardHTML(player) {
  const name    = player.player_name   || player.scorer_name  || "Unknown";
  const photo   = player.player_image  || player.scorer_image || "";
  const team    = player.team_name     || player.scorer_team  || "";
  const teamLogo= player.team_logo     || "";
  const goals   = parseInt(player.player_goals  || player.scorer_goals  || 0, 10);
  const yellow  = parseInt(player.player_yellow_cards || player.scorer_yellow || 0, 10);
  const red     = parseInt(player.player_red_cards    || player.scorer_red    || 0, 10);

  const photoEl = photo
    ? `<img class="player-card__photo" src="${escapeAttr(photo)}" alt="${escapeAttr(name)}" loading="lazy">`
    : `<div class="player-card__photo-placeholder">👤</div>`;

  const teamLogoEl = teamLogo
    ? `<img class="player-card__team-logo" src="${escapeAttr(teamLogo)}" alt="${escapeAttr(team)}" loading="lazy">`
    : "";

  return `
    <div class="player-card">
      ${photoEl}
      <div class="player-card__body">
        <p class="player-card__name">${escapeHTML(name)}</p>
        <div class="player-card__team">
          ${teamLogoEl}
          <span>${escapeHTML(team)}</span>
        </div>
        <div class="player-card__stats">
          <span class="stat-pill stat-pill--goals" title="Goals">⚽ ${goals}</span>
          <span class="stat-pill stat-pill--yellow" title="Yellow cards">🟨 ${yellow}</span>
          <span class="stat-pill stat-pill--red" title="Red cards">🟥 ${red}</span>
        </div>
      </div>
    </div>`;
}

/**
 * Sort a player array by a given key descending.
 */
function sortPlayers(players, key) {
  const fieldMap = {
    goals:        (p) => parseInt(p.player_goals  || p.scorer_goals  || 0, 10),
    yellow_cards: (p) => parseInt(p.player_yellow_cards || p.scorer_yellow || 0, 10),
    red_cards:    (p) => parseInt(p.player_red_cards    || p.scorer_red    || 0, 10),
  };
  const getter = fieldMap[key] || fieldMap.goals;
  return [...players].sort((a, b) => getter(b) - getter(a));
}

function renderSection(sectionId, players, sortKey) {
  const container = document.getElementById(sectionId);
  if (!container) return;

  if (!players.length) {
    container.innerHTML = `<p class="empty-msg">No data available.</p>`;
    return;
  }

  const sorted = sortPlayers(players, sortKey);
  container.innerHTML = sorted.map(playerCardHTML).join("");
}

function renderAllSections() {
  renderSection("scorers-grid",  topScorers,  scorersSort);
  renderSection("yellow-grid",   yellowCards, yellowSort);
  renderSection("red-grid",      redCards,    redSort);
}

// ── Sort buttons ──────────────────────────────────────────────────────────────

function activateSortBtn(groupEl, clickedBtn) {
  groupEl.querySelectorAll(".sort-btn").forEach((b) => b.classList.remove("active"));
  clickedBtn.classList.add("active");
}

function initSortButtons() {
  document.querySelectorAll("[data-sort-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.sortSection;
      const key     = btn.dataset.sortKey;
      const group   = btn.closest(".stats-controls");

      activateSortBtn(group, btn);

      if (section === "scorers")  { scorersSort  = key; renderSection("scorers-grid",  topScorers,  scorersSort); }
      if (section === "yellow")   { yellowSort   = key; renderSection("yellow-grid",   yellowCards, yellowSort); }
      if (section === "red")      { redSort      = key; renderSection("red-grid",      redCards,    redSort); }
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function initStats() {
  // Show spinners
  ["scorers-grid", "yellow-grid", "red-grid"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1"><div class="spinner"></div></div>`;
  });

  try {
    const allPlayers = await fetchTopScorers();

    // The AllSportsAPI TopScorers endpoint returns all players with their stats
    topScorers  = allPlayers;
    yellowCards = allPlayers;
    redCards    = allPlayers;

    renderAllSections();
  } catch (err) {
    ["scorers-grid", "yellow-grid", "red-grid"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="error-msg" style="grid-column:1/-1"><strong>Failed to load statistics: </strong>${escapeHTML(err.message)}</div>`;
    });
  }

  initSortButtons();
}

// Helpers
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
