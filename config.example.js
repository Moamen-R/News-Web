// ============================================================
// API Configuration Template
// ============================================================
// 1. Copy this file to config.js  (cp config.example.js config.js)
// 2. Replace every "YOUR_..." placeholder with your real API key.
// 3. config.js is listed in .gitignore and will NOT be committed.
// ============================================================

const CONFIG = {
  // https://gnews.io  – free tier: 100 requests/day
  GNEWS_API_KEY: "YOUR_GNEWS_API_KEY",

  // https://openweathermap.org – free tier: 60 req/min
  OPENWEATHER_API_KEY: "YOUR_OPENWEATHER_API_KEY",

  // https://allsportsapi.com – free tier
  ALLSPORTS_API_KEY: "YOUR_ALLSPORTS_API_KEY",

  // https://www.exchangerate-api.com – free tier: 1 500 req/month
  EXCHANGE_API_KEY: "YOUR_EXCHANGE_API_KEY",

  // Default league for matches / table / stats pages
  // 152 = Premier League  |  3 = UEFA Champions League  |  4 = Serie A
  DEFAULT_LEAGUE_ID: "152",
};
