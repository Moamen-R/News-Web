
const ALLSPORTS_MATCHES_BASE = "https://apiv2.allsportsapi.com/football/";

/** All fetched matches (used for client-side filtering) */
let allMatches = [];

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch fixtures for the configured league and current season.
 * @returns {Promise<Array>}
 */
async function fetchLeagueMatches() {
  // Current season year (use previous year from Jan-June, else current year)
  const now = new Date();
  const season = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();

  const params = new URLSearchParams({
    met: "Fixtures",
    APIkey: CONFIG.ALLSPORTS_API_KEY,
    leagueId: CONFIG.DEFAULT_LEAGUE_ID,
    from: `${season}-08-01`,
    to: `${season + 1}-06-30`,
  });

  const res = await fetch(`${ALLSPORTS_MATCHES_BASE}?${params}`);
  if (!res.ok) throw new Error(`AllSportsAPI error ${res.status}`);
  const data = await res.json();
  return data.result || [];
}

// ── Render ────────────────────────────────────────────────────────────────────

/**
 * Determine status class and label for a match.
 */
function matchStatusInfo(match) {
  const status = (match.event_status || "").toLowerCase();
  if (status === "finished") {
    return { cls: "match-status--finished", label: "FT" };
  }
  if (status === "inprogress" || status === "live" || status === "1h" || status === "2h" || status === "ht") {
    return { cls: "match-status--live", label: `🔴 ${match.event_status}` };
  }
  // Upcoming / Fixture
  return { cls: "match-status--upcoming", label: formatDate(match.event_date, match.event_time) };
}

function formatDate(dateStr, timeStr) {
  if (!dateStr) return "TBD";
  try {
    const d = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
      (timeStr ? ` ${timeStr}` : "");
  } catch {
    return dateStr;
  }
}

/**
 * Build HTML for one match card.
 */
function matchCardHTML(match) {
  const homeTeam = match.event_home_team || "Home";
  const awayTeam = match.event_away_team || "Away";
  const homeLogo = match.home_team_logo || "";
  const awayLogo = match.away_team_logo || "";

  const { cls: statusCls, label: statusLabel } = matchStatusInfo(match);
  const isLive = statusCls === "match-status--live";
  const isFinished = statusCls === "match-status--finished";

  const homeScore = match.event_final_result
    ? match.event_final_result.split(" - ")[0]
    : (match.event_home_final_result ?? "");
  const awayScore = match.event_final_result
    ? match.event_final_result.split(" - ")[1]
    : (match.event_away_final_result ?? "");

  const scoreHTML = (isLive || isFinished)
    ? `<span class="match-score ${isLive ? "match-score--live" : ""}">${escapeHTML(String(homeScore))} – ${escapeHTML(String(awayScore))}</span>`
    : "";

  const homeLogoEl = homeLogo
    ? `<img class="match-team__logo" src="${escapeAttr(homeLogo)}" alt="${escapeAttr(homeTeam)}" loading="lazy">`
    : `<span class="match-team__logo" aria-hidden="true">⚽</span>`;

  const awayLogoEl = awayLogo
    ? `<img class="match-team__logo" src="${escapeAttr(awayLogo)}" alt="${escapeAttr(awayTeam)}" loading="lazy">`
    : `<span class="match-team__logo" aria-hidden="true">⚽</span>`;

  return `
    <div class="match-card" data-home="${escapeAttr(homeTeam.toLowerCase())}" data-away="${escapeAttr(awayTeam.toLowerCase())}" data-date="${escapeAttr(match.event_date || "")}">
      <div class="match-team">
        ${homeLogoEl}
        <span class="match-team__name">${escapeHTML(homeTeam)}</span>
      </div>
      <div class="match-center">
        ${scoreHTML}
        <span class="match-status ${statusCls}">${escapeHTML(statusLabel)}</span>
      </div>
      <div class="match-team match-team--right">
        ${awayLogoEl}
        <span class="match-team__name">${escapeHTML(awayTeam)}</span>
      </div>
    </div>`;
}

/**
 * Render (or re-render) the filtered matches list.
 */
function renderMatches(matches) {
  const list = document.getElementById("matches-list");
  if (!list) return;

  if (!matches.length) {
    list.innerHTML = `<p class="empty-msg">No matches found for the selected filters.</p>`;
    return;
  }

  list.innerHTML = matches.map(matchCardHTML).join("");
}

// ── Filters ───────────────────────────────────────────────────────────────────

function applyFilters() {
  const teamFilter = (document.getElementById("filter-team")?.value || "").toLowerCase().trim();
  const dateFilter = document.getElementById("filter-date")?.value || "";

  let filtered = allMatches;

  if (teamFilter) {
    filtered = filtered.filter((m) => {
      const home = (m.event_home_team || "").toLowerCase();
      const away = (m.event_away_team || "").toLowerCase();
      return home.includes(teamFilter) || away.includes(teamFilter);
    });
  }

  if (dateFilter) {
    filtered = filtered.filter((m) => m.event_date === dateFilter);
  }

  renderMatches(filtered);
}

function resetFilters() {
  const teamInput = document.getElementById("filter-team");
  const dateInput = document.getElementById("filter-date");
  if (teamInput) teamInput.value = "";
  if (dateInput) dateInput.value = "";
  renderMatches(allMatches);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function initMatches() {
  const list = document.getElementById("matches-list");
  if (!list) return;

  list.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  try {
    allMatches = await fetchLeagueMatches();

    // Sort by date ascending
    allMatches.sort((a, b) => {
      const da = a.event_date || "";
      const db = b.event_date || "";
      return da < db ? -1 : da > db ? 1 : 0;
    });

    renderMatches(allMatches);
  } catch (err) {
    list.innerHTML = `<div class="error-msg"><strong>Failed to load matches: </strong>${escapeHTML(err.message)}</div>`;
  }

  // Wire up filters
  const teamInput = document.getElementById("filter-team");
  const dateInput = document.getElementById("filter-date");
  const resetBtn  = document.getElementById("filter-reset");

  if (teamInput) teamInput.addEventListener("input", debounce(applyFilters, 300));
  if (dateInput) dateInput.addEventListener("change", applyFilters);
  if (resetBtn)  resetBtn.addEventListener("click", resetFilters);
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

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
