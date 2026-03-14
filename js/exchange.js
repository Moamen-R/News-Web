/**
 * exchange.js – Renders exchange-rate widget (USD→EGP, SAR→EGP)
 *              and the currency converter tool.
 * Uses ExchangeRate-API v6.
 */

const EXCHANGE_BASE = "https://v6.exchangerate-api.com/v6";

// Base currency for the widget rates display
const WIDGET_BASE = "EGP";
const WIDGET_PAIRS = ["USD", "SAR"];

// Popular currencies for the converter dropdowns
const CURRENCIES = [
  "AED","AUD","CAD","CHF","CNY","DKK","EGP","EUR",
  "GBP","HKD","JPY","KWD","NOK","NZD","QAR","SAR",
  "SEK","SGD","TRY","USD",
];

/** Cache for fetched rates to reduce API calls */
const ratesCache = {};

/**
 * Fetch all exchange rates for a given base currency.
 * @param {string} baseCurrency
 * @returns {Promise<Object>}  map of currency -> rate
 */
async function fetchRates(baseCurrency) {
  if (ratesCache[baseCurrency]) return ratesCache[baseCurrency];
  const res = await fetch(`${EXCHANGE_BASE}/${CONFIG.EXCHANGE_API_KEY}/latest/${baseCurrency}`);
  if (!res.ok) throw new Error(`ExchangeRate-API error ${res.status}`);
  const data = await res.json();
  if (data.result !== "success") throw new Error(data["error-type"] || "API error");
  ratesCache[baseCurrency] = data.conversion_rates;
  return data.conversion_rates;
}

// ── Widget ────────────────────────────────────────────────────────────────────

/**
 * Render USD/SAR vs EGP rate cards.
 */
async function initExchangeWidget() {
  const ratesEl = document.getElementById("rates-grid");
  if (!ratesEl) return;

  ratesEl.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1"><div class="spinner spinner--sm"></div></div>`;

  try {
    const rates = await fetchRates(WIDGET_BASE);

    ratesEl.innerHTML = WIDGET_PAIRS.map((cur) => {
      // How many EGP per 1 unit of cur
      // rates[EGP] is relative to EGP base, so rates[USD] = EGP per USD
      const rate = rates[cur] ? (1 / rates[cur]).toFixed(4) : "N/A";
      // Actually ExchangeRate-API base=EGP gives rates[USD] = how many USD per 1 EGP
      // We want EGP per 1 USD → 1 / rates[USD]
      const egpPer1 = rates[cur] ? (1 / rates[cur]).toFixed(2) : "N/A";
      return `
        <div class="rate-card">
          <div class="rate-card__pair">1 ${escapeHTML(cur)} =</div>
          <div class="rate-card__value">${egpPer1} EGP</div>
        </div>`;
    }).join("");
  } catch (err) {
    ratesEl.innerHTML = `<p class="error-msg" style="grid-column:1/-1">${escapeHTML(err.message)}</p>`;
  }
}

// ── Converter ─────────────────────────────────────────────────────────────────

function populateCurrencySelects() {
  const fromEl = document.getElementById("conv-from");
  const toEl = document.getElementById("conv-to");
  if (!fromEl || !toEl) return;

  const options = CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join("");
  fromEl.innerHTML = options;
  toEl.innerHTML = options;

  fromEl.value = "USD";
  toEl.value = "EGP";
}

async function convertCurrency() {
  const amountEl = document.getElementById("conv-amount");
  const fromEl   = document.getElementById("conv-from");
  const toEl     = document.getElementById("conv-to");
  const resultEl = document.getElementById("conv-result");
  if (!amountEl || !fromEl || !toEl || !resultEl) return;

  const amount = parseFloat(amountEl.value);
  if (isNaN(amount) || amount < 0) { resultEl.textContent = "—"; return; }

  const from = fromEl.value;
  const to   = toEl.value;

  resultEl.innerHTML = `<div class="spinner spinner--sm"></div>`;

  try {
    const rates = await fetchRates(from);
    const rate = rates[to];
    if (rate == null) throw new Error(`Rate not found for ${to}`);
    const converted = (amount * rate).toFixed(2);
    resultEl.textContent = `${amount} ${from} = ${converted} ${to}`;
  } catch (err) {
    resultEl.textContent = `Error: ${err.message}`;
  }
}

function swapCurrencies() {
  const fromEl = document.getElementById("conv-from");
  const toEl   = document.getElementById("conv-to");
  if (!fromEl || !toEl) return;
  [fromEl.value, toEl.value] = [toEl.value, fromEl.value];
  convertCurrency();
}

/** Initialise the converter widget. */
function initConverter() {
  populateCurrencySelects();

  const amountEl = document.getElementById("conv-amount");
  const fromEl   = document.getElementById("conv-from");
  const toEl     = document.getElementById("conv-to");
  const swapBtn  = document.getElementById("conv-swap");

  if (amountEl) amountEl.addEventListener("input", debounce(convertCurrency, 500));
  if (fromEl)   fromEl.addEventListener("change", convertCurrency);
  if (toEl)     toEl.addEventListener("change", convertCurrency);
  if (swapBtn)  swapBtn.addEventListener("click", swapCurrencies);

  // Trigger initial conversion
  convertCurrency();
}

/** Initialise both exchange components. */
async function initExchange() {
  await initExchangeWidget();
  initConverter();
}

// Helpers
function escapeHTML(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
