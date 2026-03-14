
const OWM_BASE = "https://api.openweathermap.org/data/2.5/weather";

// Map OWM icon codes to emoji for lightweight display
const OWM_ICON_MAP = {
  "01d": "☀️", "01n": "🌙",
  "02d": "⛅", "02n": "⛅",
  "03d": "☁️", "03n": "☁️",
  "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️",
  "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️",
  "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    lat,
    lon,
    appid: CONFIG.OPENWEATHER_API_KEY,
    units: "metric",
  });
  const res = await fetch(`${OWM_BASE}?${params}`);
  if (!res.ok) throw new Error(`OpenWeatherMap error ${res.status}`);
  return res.json();
}

function renderWeather(data, el) {
  const icon = OWM_ICON_MAP[data.weather[0]?.icon] || "🌤️";
  const city = data.name || "Unknown";
  const temp = Math.round(data.main?.temp ?? 0);
  const cond = data.weather[0]?.description || "";

  el.innerHTML = `
    <div class="weather-body">
      <span class="weather-icon" role="img" aria-label="${escapeAttr(cond)}">${icon}</span>
      <div class="weather-info">
        <p class="weather-info__city">${escapeHTML(city)}</p>
        <p class="weather-info__temp">${temp}°C</p>
        <p class="weather-info__cond">${escapeHTML(cond)}</p>
      </div>
    </div>`;
}

/** Initialise the weather widget. */
async function initWeather() {
  const widget = document.getElementById("weather-body");
  if (!widget) return;

  widget.innerHTML = `<div class="spinner-wrap"><div class="spinner spinner--sm"></div></div>`;

  try {
    const coords = await getUserCoords();
    const data = await fetchWeather(coords.lat, coords.lon);
    renderWeather(data, widget);
  } catch (err) {
    widget.innerHTML = `<p class="error-msg">${escapeHTML(err.message)}</p>`;
  }
}

function getUserCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 30.0444, lon: 31.2357 }); // Cairo fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 30.0444, lon: 31.2357 })  // Cairo fallback on denial
    );
  });
}

// Utility helpers (shared across modules loaded in the same page)
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
