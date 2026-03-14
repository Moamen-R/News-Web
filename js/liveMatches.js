
const ALLSPORTS_BASE = "https://apiv2.allsportsapi.com/football/";

/**
 * Fetch currently live football matches.
 * @returns {Promise<Array>}
 */
async function fetchLiveMatches() {
  const params = new URLSearchParams({
    met: "Livescore",
    APIkey: CONFIG.ALLSPORTS_API_KEY,
  });
  const res = await fetch(`${ALLSPORTS_BASE}?${params}`);
  if (!res.ok) throw new Error(`AllSportsAPI error ${res.status}`);
  const data = await res.json();
  // AllSportsAPI wraps results in data.result
  return data.result || [];
}

/**
 * Build the HTML for a single live-match card.
 * @param {Object} match
 * @returns {string}
 */
function liveMatchCardHTML(match) {
  const homeLogo = match.home_team_logo || "";
  const awayLogo = match.away_team_logo || "";
  const homeName = match.event_home_team || "Home";
  const awayName = match.event_away_team || "Away";

  // AllSportsAPI returns a combined score string like "2 - 1" in event_final_result
  const finalResult = match.event_final_result || "";
  const scoreParts = finalResult.split("-").map(s => s.trim());
  const homeScore = scoreParts[0] || "–";
  const awayScore = scoreParts[1] || "–";

  // Show match status (e.g. "45'" for minute, "Half Time", "Finished", etc.)
  const status = match.event_status || "";

  const homeLogoEl = homeLogo
    ? `<img class="live-team__logo" src="${escapeAttr(homeLogo)}" alt="${escapeAttr(homeName)}" loading="lazy">`
    : `<span class="live-team__logo" aria-hidden="true">⚽</span>`;

  const awayLogoEl = awayLogo
    ? `<img class="live-team__logo" src="${escapeAttr(awayLogo)}" alt="${escapeAttr(awayName)}" loading="lazy">`
    : `<span class="live-team__logo" aria-hidden="true">⚽</span>`;

  return `
    <div class="live-match-card">
      <div class="live-team">
        ${homeLogoEl}
        <span class="live-team__name">${escapeHTML(homeName)}</span>
      </div>
      <div class="live-score">
        <span class="live-score__result">${escapeHTML(homeScore)} – ${escapeHTML(awayScore)}</span>
        ${status ? `<span class="live-score__status">${escapeHTML(status)}</span>` : ""}
      </div>
      <div class="live-team live-team--right">
        ${awayLogoEl}
        <span class="live-team__name">${escapeHTML(awayName)}</span>
      </div>
    </div>`;
}

/** Initialise the live-matches widget on the home page. */
async function initLiveMatches() {
  const container = document.getElementById("live-matches-body");
  if (!container) return;

  container.innerHTML = `<div class="spinner-wrap"><div class="spinner spinner--sm"></div></div>`;

  try {
    const matches = await fetchLiveMatches();

    if (!matches.length) {
      container.innerHTML = `<p class="empty-msg">No live matches right now.</p>`;
      return;
    }

    container.innerHTML = matches.slice(0, 6).map(liveMatchCardHTML).join("");
  } catch (err) {
    container.innerHTML = `<p class="error-msg"><strong>Failed to load matches: </strong>${escapeHTML(err.message)}</p>`;
  }
}

// Utility helpers
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
