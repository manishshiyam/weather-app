import { useState } from "react";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getWeather(cityName) {
    if (!cityName.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      // Step 1: Find the city's latitude and longitude
      const locationResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cityName
        )}&count=1&language=en&format=json`
      );

      if (!locationResponse.ok) {
        throw new Error("Unable to search for this city.");
      }

      const locationData = await locationResponse.json();

      if (!locationData.results || locationData.results.length === 0) {
        throw new Error("City not found. Please try another city.");
      }

      const location = locationData.results[0];

      // Step 2: Get weather using the city's coordinates
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to fetch weather data.");
      }

      const weatherData = await weatherResponse.json();

      // Step 3: Save the weather information
      setWeather({
        location,
        current: weatherData.current,
        daily: weatherData.daily,
      });

      setCity(cityName);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function getWeatherDescription(code) {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55].includes(code)) return "Drizzle";
    if ([56, 57].includes(code)) return "Freezing drizzle";
    if ([61, 63, 65].includes(code)) return "Rain";
    if ([66, 67].includes(code)) return "Freezing rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([85, 86].includes(code)) return "Snow showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";

    return "Unknown conditions";
  }

  function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if ([1, 2].includes(code)) return "🌤️";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫️";
    if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return "🌧️";
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";

    return "🌡️";
  }

  function searchWeather(event) {
    event.preventDefault();
    getWeather(city);
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
          );

          if (!response.ok) {
            throw new Error("Unable to fetch your local weather.");
          }

          const data = await response.json();

          setWeather({
            location: {
              name: "Your Location",
              admin1: "",
              country: "",
            },
            current: data.current,
            daily: data.daily,
          });
        } catch (err) {
          setError(err.message || "Unable to get your weather.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied. Please allow location access.");
        setLoading(false);
      }
    );
  }

  return (
    <main className="app">
      <section className="weather-container">
        <header className="header">
          <div className="brand">
            <span className="brand-icon">🌦️</span>
            <h1>WeatherNow</h1>
          </div>

          <p>Know your weather, plan your day.</p>
        </header>

        <form className="search-form" onSubmit={searchWeather}>
          <input
            type="text"
            placeholder="Search city, e.g. Chennai"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="City name"
          />

          <button type="submit" disabled={loading}>
            Search
          </button>
        </form>

        <button
          className="location-button"
          onClick={getCurrentLocation}
          disabled={loading}
        >
          📍 Use My Location
        </button>

        {loading && <p className="message">Getting weather data...</p>}

        {error && <p className="error">{error}</p>}

        {weather && !loading && (
          <>
            <section className="current-weather">
              <div className="location">
                <h2>{weather.location.name}</h2>

                <p>
                  {[weather.location.admin1, weather.location.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>

              <div className="weather-main">
                <span className="weather-icon">
                  {getWeatherIcon(weather.current.weather_code)}
                </span>

                <div>
                  <h3>{Math.round(weather.current.temperature_2m)}°C</h3>

                  <p>
                    {getWeatherDescription(weather.current.weather_code)}
                  </p>
                </div>
              </div>

              <p className="feels-like">
                Feels like {Math.round(weather.current.apparent_temperature)}°C
              </p>

              <div className="weather-details">
                <div className="detail-card">
                  <span>💧</span>
                  <p>Humidity</p>
                  <h4>{weather.current.relative_humidity_2m}%</h4>
                </div>

                <div className="detail-card">
                  <span>💨</span>
                  <p>Wind Speed</p>
                  <h4>{weather.current.wind_speed_10m} km/h</h4>
                </div>

                <div className="detail-card">
                  <span>🌧️</span>
                  <p>Precipitation</p>
                  <h4>{weather.current.precipitation} mm</h4>
                </div>
              </div>
            </section>

            <section className="forecast">
              <h2>5-Day Forecast</h2>

              <div className="forecast-list">
                {weather.daily.time.map((date, index) => (
                  <article className="forecast-card" key={date}>
                    <p>
                      {new Date(`${date}T12:00:00`).toLocaleDateString(
                        "en-US",
                        { weekday: "short" }
                      )}
                    </p>

                    <span>
                      {getWeatherIcon(weather.daily.weather_code[index])}
                    </span>

                    <p className="forecast-description">
                      {getWeatherDescription(
                        weather.daily.weather_code[index]
                      )}
                    </p>

                    <h4>
                      {Math.round(weather.daily.temperature_2m_max[index])}°
                      <span>
                        {" "}
                        / {Math.round(weather.daily.temperature_2m_min[index])}°
                      </span>
                    </h4>
                  </article>
                ))}
              </div>
            </section>

            <p className="updated">
              Weather data updates periodically. Values shown are from the
              latest available API response.
            </p>
          </>
        )}

        {!weather && !loading && !error && (
          <div className="welcome">
            <span>🌍</span>
            <h2>Discover the weather</h2>
            <p>Search for a city to see its current weather and forecast.</p>
          </div>
        )}

        <footer>
          Weather data by{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>
        </footer>
      </section>
    </main>
  );
}

export default App;

