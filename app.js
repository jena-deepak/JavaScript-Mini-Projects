const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherContent = document.getElementById('weather-content');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');

const cityNameEl = document.getElementById('city-name');
const tempEl = document.getElementById('temperature');
const conditionEl = document.getElementById('weather-condition');
const descriptionEl = document.getElementById('weather-description');
const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');
const elevationEl = document.getElementById('elevation');
const feelsLikeEl = document.getElementById('feels-like');
const pressureEl = document.getElementById('pressure');
const sunsetEl = document.getElementById('sunset');

const bgImage = document.getElementById('bg-image');
const canvas = document.getElementById('weather-canvas');
const ctx = canvas.getContext('2d');

// WMO Weather interpretation codes (WW)
const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

// Background mapping
const weatherBackgrounds = {
    'Clear sky': 'clear-day.png',
    'Mainly clear': 'clear-day.png',
    'Partly cloudy': 'cloudy.png',
    'Overcast': 'cloudy.png',
    'Fog': 'fog.png',
    'Depositing rime fog': 'fog.png',
    'Light drizzle': 'rain.png',
    'Moderate drizzle': 'rain.png',
    'Dense drizzle': 'rain.png',
    'Slight rain': 'rain.png',
    'Moderate rain': 'rain.png',
    'Heavy rain': 'rain.png',
    'Slight snow fall': 'snow.png',
    'Moderate snow fall': 'snow.png',
    'Heavy snow fall': 'snow.png',
    'Snow grains': 'snow.png',
    'Slight rain showers': 'rain.png',
    'Moderate rain showers': 'rain.png',
    'Violent rain showers': 'rain.png',
    'Slight snow showers': 'snow.png',
    'Heavy snow showers': 'snow.png',
    'Thunderstorm': 'thunderstorm.png',
    'Thunderstorm with slight hail': 'thunderstorm.png',
    'Thunderstorm with heavy hail': 'thunderstorm.png'
};

let particles = [];
let animationId;

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    }
});

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

async function fetchWeather(city) {
    showLoading();

    try {
        // 1. Geocoding to get lat/long
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const { latitude, longitude, name, elevation } = geoData.results[0];

        // 2. Fetch Weather Data (Added apparent_temperature, surface_pressure, sunrise, sunset)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,surface_pressure&daily=sunrise,sunset&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        updateUI(name, weatherData, elevation);
    } catch (error) {
        console.error(error);
        showError();
    }
}

function updateUI(city, data, elevation) {
    const current = data.current_weather;
    const condition = weatherCodes[current.weathercode] || 'Unknown';

    // Get hourly data index
    const currentTimeStr = current.time;
    const hourlyTimes = data.hourly.time;
    const index = hourlyTimes.findIndex(t => t === currentTimeStr);

    const humidity = index !== -1 ? data.hourly.relativehumidity_2m[index] : '--';
    const feelsLike = index !== -1 ? data.hourly.apparent_temperature[index] : current.temperature;
    const pressure = index !== -1 ? data.hourly.surface_pressure[index] : '--';

    // Get sunset time
    const sunsetTime = data.daily.sunset[0];
    const sunset = sunsetTime ? new Date(sunsetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

    // Update Text
    cityNameEl.textContent = city;
    tempEl.textContent = Math.round(current.temperature);
    windSpeedEl.textContent = `${current.windspeed} km/h`;
    conditionEl.textContent = condition;
    humidityEl.textContent = `${humidity}%`;
    elevationEl.textContent = elevation ? `${elevation} m` : '-- m';
    feelsLikeEl.textContent = `${Math.round(feelsLike)}°C`;
    pressureEl.textContent = `${Math.round(pressure)} hPa`;
    sunsetEl.textContent = sunset;

    // Generate Description
    descriptionEl.textContent = generateDescription(condition, current.temperature, feelsLike);

    // Update Background
    updateBackground(condition, current.is_day);

    // Update Particles
    updateParticles(condition);

    showContent();
}

function generateDescription(condition, temp, feelsLike) {
    let desc = "";
    const isCold = temp < 10;
    const isHot = temp > 25;
    const isRainy = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle');
    const isSnowy = condition.toLowerCase().includes('snow');
    const isClear = condition.toLowerCase().includes('clear') || condition.toLowerCase().includes('sunny');

    if (isRainy) {
        desc = "Don't forget your umbrella! It's a bit wet out there.";
    } else if (isSnowy) {
        desc = "Bundle up! It's a winter wonderland.";
    } else if (isClear) {
        if (isHot) desc = "It's a beautiful, sunny day. Stay hydrated!";
        else if (isCold) desc = "Clear skies, but quite chilly. Dress warmly.";
        else desc = "Perfect weather for a walk. Enjoy the clear skies!";
    } else {
        desc = `Current conditions are ${condition.toLowerCase()}.`;
    }

    if (Math.abs(temp - feelsLike) > 3) {
        desc += ` It feels like ${Math.round(feelsLike)}°C.`;
    }

    return desc;
}

function updateBackground(condition, isDay) {
    let bgFile = weatherBackgrounds[condition] || 'clear-day.png';

    // Handle night time for clear skies
    if (isDay === 0 && (condition === 'Clear sky' || condition === 'Mainly clear')) {
        bgFile = 'clear-night.png';
    }

    bgImage.style.opacity = 0;
    setTimeout(() => {
        bgImage.style.backgroundImage = `url('assets/${bgFile}')`;
        bgImage.style.opacity = 1;
    }, 500);
}

function updateParticles(condition) {
    // Stop existing animation
    if (animationId) cancelAnimationFrame(animationId);
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isRain = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle') || condition.toLowerCase().includes('thunderstorm');
    const isSnow = condition.toLowerCase().includes('snow');

    if (isRain) {
        initParticles('rain');
        animateParticles('rain');
    } else if (isSnow) {
        initParticles('snow');
        animateParticles('snow');
    }
}

function initParticles(type) {
    const particleCount = type === 'rain' ? 100 : 50;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 5 + 2,
            length: Math.random() * 20 + 10,
            size: Math.random() * 2 + 1
        });
    }
}

function animateParticles(type) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';

    particles.forEach(p => {
        if (type === 'rain') {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, p.y + p.length);
            ctx.stroke();
            p.y += p.speed * 2;
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.y += p.speed / 2;
            p.x += Math.sin(p.y * 0.01) * 0.5;
        }

        if (p.y > canvas.height) {
            p.y = -20;
            p.x = Math.random() * canvas.width;
        }
    });

    animationId = requestAnimationFrame(() => animateParticles(type));
}

function showLoading() {
    weatherContent.classList.add('hidden');
    errorState.classList.add('hidden');
    loadingState.classList.remove('hidden');
}

function showContent() {
    loadingState.classList.add('hidden');
    errorState.classList.add('hidden');
    weatherContent.classList.remove('hidden');
}

function showError() {
    loadingState.classList.add('hidden');
    weatherContent.classList.add('hidden');
    errorState.classList.remove('hidden');
}

// Digital Clock
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('digital-clock').textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);
updateClock(); // Initial call
