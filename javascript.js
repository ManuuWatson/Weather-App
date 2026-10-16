// 1. Paste your OpenWeatherMap API key here (https://openweathermap.org/api)
const API_KEY = "07ae79dc9d2150d4d9cd1fc6e623496c";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Grab the elements from index.html
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const messageEl = document.getElementById("message");
const weatherEl = document.getElementById("weather");
const unitButtons = document.querySelectorAll(".units button");

let units = "metric"; // "metric" = °C and m/s, "imperial" = °F and mph
let lastCity = "";

// ---------- UI helpers ----------

function showMessage(text, isError = false) {
  messageEl.textContent = text;
  messageEl.classList.toggle("error", isError);
  messageEl.hidden = false;
  weatherEl.hidden = true;
}

function setLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Searching…" : "Search";
}

// Picks a theme name that the CSS can use to change the background
function pickTheme(data) {
  const main = data.weather[0].main.toLowerCase();
  const isNight = data.weather[0].icon.endsWith("n");

  if (isNight) return "night";
  if (["rain", "drizzle", "thunderstorm"].includes(main)) return "rain";
  if (main === "snow") return "snow";
  if (main === "clear") return "clear";
  return "clouds";
}

function render(data) {
  const unitSymbol = units === "metric" ? "°C" : "°F";
  const windUnit = units === "metric" ? "m/s" : "mph";
  const weather = data.weather[0];

  document.getElementById("city").textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById("date").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  document.getElementById("temp").textContent = Math.round(data.main.temp);
  document.getElementById("unit-label").textContent = unitSymbol;
  document.getElementById("desc").textContent = weather.description;
  document.getElementById("humidity").textContent = `${data.main.humidity}%`;
  document.getElementById("feels").textContent = `${Math.round(data.main.feels_like)}${unitSymbol}`;
  document.getElementById("wind").textContent = `${Math.round(data.wind.speed)} ${windUnit}`;

  const icon = document.getElementById("icon");
  icon.src = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
  icon.alt = weather.description;

  document.body.dataset.theme = pickTheme(data);
  messageEl.hidden = true;
  weatherEl.hidden = false;
}

// ---------- API call (async/await) ----------

async function fetchWeather(city) {
  const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`;
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error(`We couldn't find "${city}". Check the spelling and try again.`);
  }
  if (response.status === 401) {
    throw new Error("Your API key was rejected. Check it, or wait a couple of hours if it's brand new.");
  }
  if (!response.ok) {
    throw new Error("The weather service had a problem. Try again in a moment.");
  }

  return response.json();
}

async function search(city) {
  city = city.trim();
  if (!city) return;

  if (API_KEY === "YOUR_API_KEY_HERE") {
    showMessage("Add your OpenWeatherMap API key at the top of javascript.js first.", true);
    return;
  }

  setLoading(true);
  try {
    const data = await fetchWeather(city);
    lastCity = city;
    localStorage.setItem("lastCity", city);
    render(data);
  } catch (err) {
    // fetch() throws a TypeError when the network is down
    const offline = err instanceof TypeError;
    showMessage(offline ? "Can't reach the weather service. Check your internet connection." : err.message, true);
  } finally {
    setLoading(false);
  }
}

// ---------- Events ----------

form.addEventListener("submit", (e) => {
  e.preventDefault(); // stop the page from reloading
  search(input.value);
});

unitButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    units = btn.dataset.unit;
    unitButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    if (lastCity) search(lastCity); // re-fetch in the new unit
  });
});

// Load the last searched city when the page opens
const saved = localStorage.getItem("lastCity");
if (saved) {
  input.value = saved;
  search(saved);
}