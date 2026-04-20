const cityInput = document.getElementById("city");
const searchBtn = document.getElementById("searchBtn");
const logoutBtn = document.getElementById("logoutBtn");
const weatherResult = document.getElementById("weatherResult");
const statusMsg = document.getElementById("statusMsg");
const loader = document.getElementById("loader");

if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "login.html";
}

function showStatus(message) {
    statusMsg.textContent = message;
}

function setLoading(isLoading) {
    loader.style.display = isLoading ? "block" : "none";
    searchBtn.disabled = isLoading;
    searchBtn.textContent = isLoading ? "Loading..." : "Get Weather";
}

async function getWeather() {
    const city = cityInput.value.trim();
    weatherResult.style.display = "none";
    weatherResult.innerHTML = "";
    showStatus("");

    if (!city) {
        showStatus("Please enter a city name.");
        return;
    }

    try {
        setLoading(true);

        const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            showStatus("City not found. Try another city.");
            return;
        }

        const location = geoData.results[0];
        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true&timezone=auto`
        );
        const weatherData = await weatherResponse.json();

        if (!weatherData.current_weather) {
            showStatus("Weather data is currently unavailable.");
            return;
        }

        weatherResult.innerHTML = `
            <h3>${location.name}, ${location.country}</h3>
            <p class="metric">Temperature: <strong>${weatherData.current_weather.temperature} &deg;C</strong></p>
            <p class="metric">Wind Speed: <strong>${weatherData.current_weather.windspeed} km/h</strong></p>
            <p class="metric">Weather Code: <strong>${weatherData.current_weather.weathercode}</strong></p>
            <p class="metric">Local Time: <strong>${weatherData.current_weather.time}</strong></p>
        `;
        weatherResult.style.display = "block";
    } catch (error) {
        showStatus("Unable to fetch weather right now. Please try again.");
    } finally {
        setLoading(false);
    }
}

searchBtn.addEventListener("click", getWeather);
cityInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        getWeather();
    }
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
});
