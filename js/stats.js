

const ALLSPORTS_STATS_BASE = "https://apiv2.allsportsapi.com/football/";

/** Cached player data */
let topScorers = [];
let yellowCards = [];
let redCards = [];

// Active sort key per section
let scorersSort = "goals";
let yellowSort = "goals";
let redSort = "goals";

  async function fetchTopScorers() {
  const currentYear = new Date().getFullYear();
  const season = currentYear; // e.g. 2025 for 2025/2026 season
  
  const topscorersParams = new URLSearchParams({
    met: "Topscorers",
    APIkey: CONFIG.ALLSPORTS_API_KEY,
    leagueId: CONFIG.DEFAULT_LEAGUE_ID,
    season: String(season),
  });

  const teamsParams = new URLSearchParams({
    met: "Teams",
    APIkey: CONFIG.ALLSPORTS_API_KEY,
    leagueId: CONFIG.DEFAULT_LEAGUE_ID,
  });

  const [scorersRes, teamsRes] = await Promise.all([
    fetch(`${ALLSPORTS_STATS_BASE}?${topscorersParams}`),
    fetch(`${ALLSPORTS_STATS_BASE}?${teamsParams}`)
  ]);

  if (!scorersRes.ok) {
    const errBody = await scorersRes.text();
    console.error(`AllSportsAPI error ${scorersRes.status}:`, errBody);
    throw new Error(`AllSportsAPI error ${scorersRes.status}`);
  }

  const scorersData = await scorersRes.json();
  const scorers = scorersData.result || [];

  // Build dictionary of player images from the Teams endpoint
  const imageMap = {};
  if (teamsRes.ok) {
    const teamsData = await teamsRes.json();
    if (teamsData.success && teamsData.result) {
      teamsData.result.forEach(team => {
        if (team.players) {
          team.players.forEach(player => {
            if (player.player_image) {
              imageMap[player.player_key] = player.player_image;
            }
          });
        }
      });
    }
  }

  // Assign images to top scorers
  scorers.forEach(scorer => {
    if (scorer.player_key && imageMap[scorer.player_key]) {
      scorer.player_image = imageMap[scorer.player_key];
    }
  });

  return scorers;
}

function playerCardHTML(player) {
  const name = player.player_name || player.scorer_name || "Unknown";
  const photo = player.player_image || player.scorer_image || "";
  const team = player.team_name || player.scorer_team || "";
  const teamLogo = player.team_logo || "";
  // AllSportsAPI Topscorers uses: goals, assists, penalty_goals
  const goals = parseInt(
    player.goals || player.player_goals || player.scorer_goals || 0,
    10,
  );
  const assists = parseInt(player.assists || 0, 10);
  const penalty = parseInt(player.penalty_goals || 0, 10);

  const photoEl = photo
    ? `<img class="player-card__photo" src="${escapeAttr(photo)}" alt="${escapeAttr(name)}" loading="lazy" onerror="this.outerHTML='<div class=\\'player-card__photo-placeholder\\'>👤</div>'">`
    : `<div class="player-card__photo-placeholder">👤</div>`;

  const teamLogoEl = teamLogo
    ? `<img class="player-card__team-logo" src="${escapeAttr(teamLogo)}" alt="${escapeAttr(team)}" loading="lazy">`
    : "";

  // Build stats pills – only show what's available
  let statsPills = `<span class="stat-pill stat-pill--goals" title="Goals">⚽ ${goals}</span>`;
  if (assists > 0)
    statsPills += `<span class="stat-pill stat-pill--yellow" title="Assists">🅰️ ${assists}</span>`;
  if (penalty > 0)
    statsPills += `<span class="stat-pill stat-pill--red" title="Penalty Goals">🎯 ${penalty}</span>`;

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
          ${statsPills}
        </div>
      </div>
    </div>`;
}


function sortPlayers(players, key) {
  const fieldMap = {
    goals: (p) =>
      parseInt(p.goals || p.player_goals || p.scorer_goals || 0, 10),
    assists: (p) => parseInt(p.assists || 0, 10),
    penalty_goals: (p) => parseInt(p.penalty_goals || 0, 10),
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
  renderSection("scorers-grid", topScorers, scorersSort);
  renderSection("yellow-grid", yellowCards, yellowSort);
  renderSection("red-grid", redCards, redSort);
}

function activateSortBtn(groupEl, clickedBtn) {
  groupEl
    .querySelectorAll(".sort-btn")
    .forEach((b) => b.classList.remove("active"));
  clickedBtn.classList.add("active");
}

function initSortButtons() {
  document.querySelectorAll("[data-sort-section]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.dataset.sortSection;
      const key = btn.dataset.sortKey;
      const group = btn.closest(".stats-controls");

      activateSortBtn(group, btn);

      if (section === "scorers") {
        scorersSort = key;
        renderSection("scorers-grid", topScorers, scorersSort);
      }
      if (section === "yellow") {
        yellowSort = key;
        renderSection("yellow-grid", yellowCards, yellowSort);
      }
      if (section === "red") {
        redSort = key;
        renderSection("red-grid", redCards, redSort);
      }
    });
  });
}

async function initStats() {
  // Show spinners
  ["scorers-grid", "yellow-grid", "red-grid"].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1"><div class="spinner"></div></div>`;
  });

  try {
    const allPlayers = await fetchTopScorers();

    topScorers = allPlayers;
    yellowCards = allPlayers;
    redCards = allPlayers;

    renderAllSections();
  } catch (err) {
    ["scorers-grid", "yellow-grid", "red-grid"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML = `<div class="error-msg" style="grid-column:1/-1"><strong>Failed to load statistics: </strong>${escapeHTML(err.message)}</div>`;
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
