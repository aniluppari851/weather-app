// Add your OpenWeatherMap API key here
// You can get one for free at https://openweathermap.org/api
const API_KEY = 'YOUR_API_KEY_HERE';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const weatherInfo = document.getElementById('weather-info');

// Weather Display Elements
const cityNameEl = document.getElementById('city-name');
const countryEl = document.getElementById('country');
const dateTimeEl = document.getElementById('date-time');
const weatherIcon = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const weatherConditionEl = document.getElementById('weather-condition');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');

// Unit Toggle Buttons
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');

// State variables
let currentTempCelsius = null;
let currentFeelsLikeCelsius = null;
let currentUnit = 'C'; // 'C' or 'F'

// Auto-focus input on load
window.onload = () => {
    cityInput.focus();

    // Check local storage for last searched city
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        fetchWeatherData(lastCity);
    }
};

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherDataByCoords(lat, lon);
            },
            (error) => {
                showError("Unable to retrieve your location. Please check permissions.");
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

celsiusBtn.addEventListener('click', () => {
    if (currentUnit !== 'C' && currentTempCelsius !== null) {
        currentUnit = 'C';
        updateTemperatureDisplay();
        celsiusBtn.classList.add('active');
        fahrenheitBtn.classList.remove('active');
    }
});

fahrenheitBtn.addEventListener('click', () => {
    if (currentUnit !== 'F' && currentTempCelsius !== null) {
        currentUnit = 'F';
        updateTemperatureDisplay();
        fahrenheitBtn.classList.add('active');
        celsiusBtn.classList.remove('active');
    }
});

/**
 * Fetch weather data by city name
 * @param {string} city - The city name
 */
async function fetchWeatherData(city) {
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
        showError("Please set your OpenWeatherMap API key in script.js");
        return;
    }

    showLoading();

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("City not found. Please check the spelling.");
            } else if (response.status === 401) {
                throw new Error("Invalid API key. If you just created it, please wait a few hours for it to activate.");
            } else {
                throw new Error("Failed to fetch weather data. Please try again.");
            }
        }

        const data = await response.json();

        // Save to local storage on successful fetch
        localStorage.setItem('lastCity', data.name);

        updateUI(data);
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Fetch weather data by coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function fetchWeatherDataByCoords(lat, lon) {
    if (!API_KEY || API_KEY === '877337fed2a1d44cced98b768edea2bd') {
        showError("Please set your OpenWeatherMap API key in script.js");
        return;
    }

    showLoading();

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Invalid API key. If you just created it, please wait a few hours for it to activate.");
            } else {
                throw new Error("Failed to fetch weather data for your location.");
            }
        }

        const data = await response.json();

        // Save to local storage on successful fetch
        localStorage.setItem('lastCity', data.name);
        // Also update the input field visually
        cityInput.value = data.name;

        updateUI(data);
    } catch (error) {
        showError(error.message);
    }
}

/**
 * Update the UI with fetched weather data
 * @param {Object} data - Weather data from API
 */
function updateUI(data) {
    hideLoadingAndError();

    // Extract required data
    const city = data.name;
    const country = data.sys.country;
    const weather = data.weather[0];
    const main = data.main;
    const wind = data.wind;

    // Store celsius values for unit toggling
    currentTempCelsius = main.temp;
    currentFeelsLikeCelsius = main.feels_like;

    // Update basic text contents
    cityNameEl.textContent = city;
    countryEl.textContent = country;
    weatherConditionEl.textContent = weather.description;
    humidityEl.textContent = `${main.humidity}%`;
    windSpeedEl.textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`; // Convert m/s to km/h

    // Update temperatures dynamically
    updateTemperatureDisplay();

    // Update Date and Time
    updateDateTime(data.timezone);

    // Set Weather Icon using OpenWeatherMap's icon URL
    weatherIcon.src = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
    weatherIcon.classList.remove('hidden');

    // Show Weather Info container with animation
    weatherInfo.classList.remove('hidden');
}

/**
 * Update the displayed temperatures based on the selected unit
 */
function updateTemperatureDisplay() {
    if (currentTempCelsius === null) return;

    let temp = currentTempCelsius;
    let feelsLike = currentFeelsLikeCelsius;

    if (currentUnit === 'F') {
        temp = (temp * 9 / 5) + 32;
        feelsLike = (feelsLike * 9 / 5) + 32;
    }

    temperatureEl.textContent = `${Math.round(temp)}°`;
    feelsLikeEl.textContent = `${Math.round(feelsLike)}°${currentUnit}`;
}

/**
 * Update the date and time string based on timezone offset
 * @param {number} timezoneOffsetSeconds - Shift in seconds from UTC
 */
function updateDateTime(timezoneOffsetSeconds) {
    // Get current date time in UTC
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

    // Create new Date object for city local time
    const cityLocalTime = new Date(utcTime + (timezoneOffsetSeconds * 1000));

    // Format options
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };

    dateTimeEl.textContent = cityLocalTime.toLocaleDateString('en-US', options);
}

// UI Helpers
function showLoading() {
    weatherInfo.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loading.classList.remove('hidden');
}

function showError(message) {
    loading.classList.add('hidden');
    weatherInfo.classList.add('hidden');
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideLoadingAndError() {
    loading.classList.add('hidden');
    errorMessage.classList.add('hidden');
}
