document.addEventListener("DOMContentLoaded", function () {
    const darkModeSwitch = document.getElementById("darkModeSwitch");
    const body = document.body;
    const searchBar = document.querySelector(".search-bar");
    const locationButton = document.getElementById("current-location-btn");
    const apiKey = "1a02ea3b91e7fc7af1a2dd0ed911e959"; // API Key


    //  Dark Mode Functionality
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("light-mode");
        darkModeSwitch.checked = true;
    }

    darkModeSwitch.addEventListener("change", function () {
        if (darkModeSwitch.checked) {
            body.classList.add("light-mode");
            localStorage.setItem("darkMode", "enabled");
        } else {
            body.classList.remove("light-mode");
            localStorage.setItem("darkMode", "disabled");
        }
    });

    //  Live Date & Time
    function updateDateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        let ampm = hours >= 12 ? "PM" : "AM";


        document.getElementById("live-time").textContent = `${hours}:${minutes} ${ampm}`;
        document.getElementById("live-date").textContent = now.toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "short",
        });
    }

    //  Current Location
    locationButton.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    fetchWeatherDataByCoords(position.coords.latitude, position.coords.longitude);
                },
                showError
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    });

    function showError(error) {
        const messages = {
            1: "Location access denied. Please enable it for live weather.",
            2: "Location unavailable. Try again later.",
            3: "Location request timed out.",
        };
        alert(messages[error.code] || "An unknown error occurred.");
    }

    function fetchWeatherDataByCoords(lat, lon) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
        fetchWeatherData(url);
    }

    // Weather Data by City Name
    function fetchWeatherDataByCity(city) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
        fetchWeatherData(url);
    }

    //  Data from API
    function fetchWeatherData(url) {
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("City not found");
                    } else {
                        throw new Error("Failed to fetch weather data");
                    }
                }
                return response.json();
            })
            .then((data) => updateWeatherUI(data))

    }

    //  Update UI with Weather Data
    function updateWeatherUI(data) {
        if (!data || !data.main || !data.weather || !data.sys) {
            console.error("Invalid weather data:", data);
            return;
        }

        const cityElement = document.querySelector(".card-title");
        const tempElement = document.querySelector(".degree-text");
        const feelsLikeElement = document.querySelector(".feels-like");
        const conditionElement = document.querySelector(".weather-condition");
        const humidityElement = document.querySelector(".humidity p:nth-of-type(1)");
        const windElement = document.querySelector(".wind-speed p:nth-of-type(1)");
        const pressureElement = document.querySelector(".pressure p:nth-of-type(1)");
        const sunriseElement = document.querySelector(".sunrise");
        const sunsetElement = document.querySelector(".sunset");
        const weatherIcon = document.querySelector(".sun-icon");
        const locationButton = document.getElementById("current-location-btn");

        if (cityElement) cityElement.textContent = data.name;
        if (tempElement) tempElement.textContent = `${Math.round(data.main.temp)}°C`;
        if (feelsLikeElement) feelsLikeElement.textContent = `Feels Like: ${Math.round(data.main.feels_like)}°C`;
        if (conditionElement) conditionElement.textContent = data.weather[0].description;
        if (humidityElement) humidityElement.textContent = `${data.main.humidity}%`;
        if (windElement) windElement.textContent = `${data.wind.speed} km/h`;
        if (pressureElement) pressureElement.textContent = `${data.main.pressure} hPa`;

        const weatherMapping = {
            Clear: "sunny.png",
            Clouds: "cloudy.png",
            Rain: "rainy.png",
            Thunderstorm: "thunderstorm.png",
            Snow: "snow.png",
            Drizzle: "drizzle.png",
            Mist: "mist.png",
            Fog: "fog.png"
        };

        const weatherType = data.weather[0].main;
        if (weatherIcon) {
            weatherIcon.src = weatherMapping[weatherType] || "default.png"; // Default if condition not listed
        }

        //  sunrise & sunset using timezone 
        const timezoneOffset = data.timezone; // Offset in seconds
        const sunriseTime = new Date((data.sys.sunrise + timezoneOffset) * 1000);
        const sunsetTime = new Date((data.sys.sunset + timezoneOffset) * 1000);

        // Format time to "06:03 AM" or "03:02 PM"
        function formatTime(date) {
            let hours = date.getUTCHours();
            let minutes = date.getUTCMinutes();
            let ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12; // Convert 0 to 12
            minutes = String(minutes).padStart(2, "0"); // Ensure 2-digit minutes
            return `${hours}:${minutes} ${ampm}`; // Non-breaking space prevents AM/PM from moving to next line
        }


        if (sunriseElement) sunriseElement.textContent = `Sunrise: ${formatTime(sunriseTime)}`;
        if (sunsetElement) sunsetElement.textContent = `Sunset: ${formatTime(sunsetTime)}`;

        if (weatherIcon) weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        if (locationButton) locationButton.textContent = ` ${data.name}`;
    }

    // 5-Day Forecast Data
    function fetchFiveDayForecast(city) {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

        fetch(forecastUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch forecast data");
                }
                return response.json();
            })
            .then((forecastData) => updateForecastUI(forecastData))
            .catch((error) => console.error("Error fetching forecast:", error));
    }

    // 5-Day Forecast UI
    function updateForecastUI(forecastData) {
        const forecastItems = document.querySelectorAll(".row.forecast .col-md-3.mt-3, .row.forecast .col-md-7.mt-3");

        if (forecastItems.length < 10) { // Ensure 10 elements (5 days × 2 elements per day)
            console.error("Forecast elements not found or incorrect structure!");
            return;
        }

        const dailyForecasts = [];

        //  Extract relevant data (one forecast per day)
        forecastData.list.forEach((entry) => {
            const date = new Date(entry.dt * 1000);
            const day = date.toLocaleDateString("en-GB", { weekday: "long" });
            const formattedDate = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

            if (!dailyForecasts.some(f => f.day === day)) {
                dailyForecasts.push({
                    temp: Math.round(entry.main.temp),
                    day: day,
                    date: formattedDate
                });
            }
        });

        //  Update temperature and date while keeping images
        dailyForecasts.slice(0, 5).forEach((data, index) => {
            forecastItems[index * 2].textContent = `${data.temp}°C`; // Temperature
            forecastItems[index * 2 + 1].textContent = `${data.day}, ${data.date}`; // Day & Date
        });
    }
    function fetchHourlyForecast(city) {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;

        fetch(forecastUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to fetch hourly forecast data");
                }
                return response.json();
            })
            .then((forecastData) => updateHourlyForecast(forecastData))
            .catch((error) => console.error("Error fetching hourly forecast:", error));
    }




    // Modify existing fetch function to include forecast fetch
    function fetchWeatherData(url) {
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("City not found");
                    } else {
                        throw new Error("Failed to fetch weather data");
                    }
                }
                return response.json();
            })
            .then((data) => {
                updateWeatherUI(data);
                fetchFiveDayForecast(data.name); // Fetch daily forecast
                fetchHourlyForecast(data.name); // Fetch hourly forecast
            })
            .catch((error) => console.error("Error fetching weather:", error));
    }
    function updateHourlyForecast(forecastData) {
        const hourlyContainer = document.getElementById("hourly-forecast");
        hourlyContainer.innerHTML = ""; // Clear previous data

        const nextHours = forecastData.list.slice(0, 5); // Get next 5 forecast items

        nextHours.forEach((hour, index) => {
            const time = new Date(hour.dt * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
            const temp = Math.round(hour.main.temp);
            const windSpeed = hour.wind.speed;
            const weatherIcon = `https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`;

            let forecastItem = "";

            if (index === 3) {
                // Keep 4th container (21:00) unchanged with hardcoded images
                forecastItem = `
                <div class="forecast-item1 text-center">
                    <p>21:00</p>
                    <img src="./assets/cloudy.png" alt="Weather Icon" class="forecast-image"> <!-- Fixed Image -->
                    <p>25&deg;C</p>
                    <img src="./assets/right direction.png" alt="Wind Direction" class="forecast-image"> <!-- Fixed Image -->
                    <p>3km/h</p>
                </div>
            `;
            } else {
                // Update dynamically for other containers
                forecastItem = `
                <div class="forecast-item text-center">
                    <p>${time}</p>
                    <img src="${weatherIcon}" alt="Weather Icon" class="forecast-image">
                    <p>${temp}&deg;C</p>
                    <img src="./assets/direction.png" alt="Wind Direction" class="forecast-image">
                    <p>${windSpeed} km/h</p>
                </div>
            `;
            }

            hourlyContainer.innerHTML += forecastItem;
        });
    }

    //  Search Bar - Press Enter to Fetch Weather
    searchBar.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            const city = searchBar.value.trim();
            if (city) {
                fetchWeatherDataByCity(city);
                searchBar.value = ""; // Clear input
            }
        }
    });

    setInterval(updateDateTime, 1000);
    updateDateTime();

    function updateRunCount() {
        let runCount = localStorage.getItem("runCount") || 0;
        runCount = parseInt(runCount) + 1;
        localStorage.setItem("runCount", runCount);

        // Create a div to display the count
        let countDisplay = document.getElementById("run-count-display");
        if (!countDisplay) {
            countDisplay = document.createElement("div");
            countDisplay.id = "run-count-display";
            countDisplay.style.position = "fixed";
            countDisplay.style.bottom = "10px";
            countDisplay.style.right = "10px";
            countDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            countDisplay.style.color = "white";
            countDisplay.style.padding = "10px 15px";
            countDisplay.style.borderRadius = "10px";
            countDisplay.style.fontSize = "14px";
            countDisplay.style.zIndex = "1000";
            document.body.appendChild(countDisplay);
        }

        // Update the text content
        countDisplay.textContent = `Live Runs: ${runCount}`;
    }

    updateRunCount(); // Call function to update count on every page load
});
