# News-Web

A multi-page News Dashboard built with plain HTML, CSS and Vanilla JavaScript.

## Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | News feed (4 categories), weather, exchange rates, currency converter, live matches |
| Matches | `matches.html` | League fixtures with team-name and date filters |
| Table | `table.html` | League standings table |
| Statistics | `stats.html` | Top scorers, yellow & red card leaders with sort controls |

## APIs Used

| API | Purpose | Free-tier limit |
|-----|---------|----------------|
| [GNews](https://gnews.io) | News articles | 100 req/day |
| [OpenWeatherMap](https://openweathermap.org) | Weather widget | 60 req/min |
| [AllSportsAPI](https://allsportsapi.com) | Football data | Free tier |
| [ExchangeRate-API](https://exchangerate-api.com) | Currency rates | 1 500 req/month |

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Moamen-R/News-Web.git
cd News-Web

# 2. Create your local API-key config (gitignored – never committed)
cp config.example.js config.js
# Edit config.js and fill in your API keys

# 3. Serve locally (any static server works)
python3 -m http.server 8080
# Then open http://localhost:8080
```

> **Note:** `config.js` is listed in `.gitignore`. It will never be committed.  
> Only `config.example.js` (with placeholder values) is tracked by git.
