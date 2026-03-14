

const ALLSPORTS_TABLE_BASE = "https://apiv2.allsportsapi.com/football/";

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchStandings() {
  const params = new URLSearchParams({
    met: "Standings",
    APIkey: CONFIG.ALLSPORTS_API_KEY,
    leagueId: CONFIG.DEFAULT_LEAGUE_ID,
  });
  const res = await fetch(`${ALLSPORTS_TABLE_BASE}?${params}`);
  if (!res.ok) throw new Error(`AllSportsAPI error ${res.status}`);
  const data = await res.json();
  // AllSportsAPI returns: data.result.total (overall standings array)
  // or sometimes data.result as a direct array
  const result = data.result;
  if (Array.isArray(result)) return result;
  if (result?.total && Array.isArray(result.total)) return result.total;
  return [];
}


function rankBadgeClass(pos) {
  const n = parseInt(pos, 10);
  if (n <= 4) return "rank-badge rank-badge--cl";
  if (n <= 6) return "rank-badge rank-badge--el";
  if (n >= 18) return "rank-badge rank-badge--rel";
  return "rank-badge rank-badge--default";
}


function gdClass(gd) {
  const v = parseInt(gd, 10);
  if (v > 0) return "gd-positive";
  if (v < 0) return "gd-negative";
  return "";
}

function renderStandings(standings) {
  const tbody = document.querySelector("#standings-table tbody");
  if (!tbody) return;

  if (!standings.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-msg">No standings data available.</td></tr>`;
    return;
  }

  tbody.innerHTML = standings
    .map((team) => {
      const pos = team.standing_place || team.league_round || "–";
      const logo = team.team_logo || "";
      const name = team.standing_team || team.team_name || "Unknown";
      const p = team.standing_P ?? team.overall_league_payed ?? "–";
      const w = team.standing_W ?? team.overall_league_W ?? "–";
      const d = team.standing_D ?? team.overall_league_D ?? "–";
      const l = team.standing_L ?? team.overall_league_L ?? "–";
      const gf = team.standing_F ?? team.overall_league_GF ?? "–";
      const ga = team.standing_A ?? team.overall_league_GA ?? "–";
      const gd =
        team.standing_GD ??
        (parseInt(gf, 10) || 0) - (parseInt(ga, 10) || 0) ??
        "–";
      const pts = team.standing_PTS ?? team.overall_league_PTS ?? "–";

      const logoEl = logo
        ? `<img class="team-cell__logo" src="${escapeAttr(logo)}" alt="${escapeAttr(name)}" loading="lazy">`
        : `<span aria-hidden="true">⚽</span>`;

      const gdVal =
        typeof gd === "number" || !isNaN(parseInt(gd, 10))
          ? `<span class="${gdClass(gd)}">${gd > 0 ? "+" : ""}${gd}</span>`
          : "–";

      return `
      <tr>
        <td><span class="${rankBadgeClass(pos)}">${escapeHTML(String(pos))}</span></td>
        <td>${logoEl}</td>
        <td><div class="team-cell">${escapeHTML(name)}</div></td>
        <td>${escapeHTML(String(p))}</td>
        <td>${escapeHTML(String(w))}</td>
        <td>${escapeHTML(String(d))}</td>
        <td>${escapeHTML(String(l))}</td>
        <td>${escapeHTML(String(gf))}</td>
        <td>${escapeHTML(String(ga))}</td>
        <td>${gdVal}</td>
        <td><strong>${escapeHTML(String(pts))}</strong></td>
      </tr>`;
    })
    .join("");
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function initTable() {
  const table = document.getElementById("standings-table");
  if (!table) return;

  const tbody = table.querySelector("tbody");
  tbody.innerHTML = `<tr><td colspan="11"><div class="spinner-wrap"><div class="spinner"></div></div></td></tr>`;

  try {
    const standings = await fetchStandings();
    renderStandings(standings);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="11"><div class="error-msg"><strong>Failed to load standings: </strong>${escapeHTML(err.message)}</div></td></tr>`;
  }
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
