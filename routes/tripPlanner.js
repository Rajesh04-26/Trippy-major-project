require('dotenv').config();
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const Place = require('../models/place');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.API_KEY);
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const WEATHER_KEY = process.env.WEATHER_API_KEY;

// Fetch photo URL from Unsplash or fallback to Wikipedia
async function getPhotoUrl(query) {
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: 1 },
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
    });
    if (res.data.results.length > 0) return res.data.results[0].urls.small;
  } catch (err) {
    console.error("Unsplash error:", err.response?.status, err.message);
  }

  try {
    const wikiRes = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if (wikiRes.data.thumbnail?.source) return wikiRes.data.thumbnail.source;
  } catch (err) {
    if (err.response?.status !== 404) console.error("Wikipedia error:", err.response?.status, err.message);
  }

  return null;
}

// Fetch 5-day weather forecast
async function getWeather(city) {
  if (!city || city.trim() === "") return { error: "City not provided." };

  try {
    const res = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: { q: city, units: "metric", appid: WEATHER_KEY }
    });

    const list = res.data.list;
    const grouped = {};
    list.forEach(item => {
      const date = item.dt_txt.split(" ")[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    });

    const forecast = Object.keys(grouped).slice(0, 5).map((date, idx) => {
      const dayData = grouped[date];
      const temps = dayData.map(d => d.main.temp);
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
      const main = dayData[Math.floor(dayData.length / 2)].weather[0];
      const humidity = Math.round(dayData.reduce((a, b) => a + b.main.humidity, 0) / dayData.length);
      const wind = Math.round(dayData.reduce((a, b) => a + b.wind.speed, 0) / dayData.length);

      return {
        date,
        temp: avgTemp,
        desc: main.description,
        icon: main.icon,
        humidity,
        wind,
        hourly: idx === 0
          ? dayData.slice(0, 8).map(h => ({
              time: new Date(h.dt_txt).toLocaleTimeString([], { hour: 'numeric' }),
              temp: h.main.temp,
              icon: h.weather[0].icon,
              desc: h.weather[0].description
            }))
          : []
      };
    });

    return { city, forecast };
  } catch (err) {
    return { error: "Unable to fetch weather data. Please check city name or API key." };
  }
}

// Extract JSON from Gemini response
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in Gemini response");
  return JSON.parse(match[0]);
}

// Add photos to array of items in parallel
async function addPhotos(items, placeName) {
  await Promise.all(items.map(async item => {
    item.photo = await getPhotoUrl(`${item.name} ${placeName}`);
  }));
}

// Routes
router.get('/', (req, res) => {
  res.render('trip-planner.ejs');
});

router.post('/generate-trip', async (req, res) => {
  const { destination, budget, days, category } = req.body;

  if (!destination || !days || !category || !budget) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/ai');
  }

  try {
    const place = await Place.findOne({ name: new RegExp(`^${destination}$`, 'i') });
    if (!place) {
      req.flash('error', `Sorry, we don't have data for "${destination}".`);
      return res.redirect('/ai');
    }

    const cleanCity = place.name.split(',')[0].trim();
    const weatherData = await getWeather(cleanCity);
    if (weatherData.error) {
      req.flash('error', weatherData.error);
      return res.redirect('/ai');
    }

    const prompt = `Plan a ${days}-day ${category} trip to ${place.name}, ${place.country} with a ${budget} budget.
The 5-day weather forecast is: ${JSON.stringify(weatherData.forecast)}.
Return ONLY valid JSON (no explanations). Format:
{
  "tripName": "Trip to ${place.name}",
  "overview": "A short overview of the trip.",
  "weatherSummary": "Brief weather overview (1-2 lines).",
  "days": [
    {
      "dayNumber": 1,
      "theme": "Day theme",
      "activities": [
        { "name": "Activity", "description": "Short desc" }
      ],
      "foodSuggestions": [
        { "name": "Food/Restaurant", "description": "Short desc" }
      ],
      "hotelSuggestion": {
        "name": "Hotel Name",
        "description": "Short desc"
      }
    }
  ]
}`;

    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const geminiResponseText = result.response.text().trim();

    let itineraryData;
    try {
      itineraryData = extractJSON(geminiResponseText);
    } catch {
      req.flash('error', 'Gemini returned invalid JSON. Please try again.');
      return res.redirect('/ai');
    }

    // Add photos in parallel
    for (const day of itineraryData.days) {
      await addPhotos(day.activities, place.name);
      await addPhotos(day.foodSuggestions, place.name);
      if (day.hotelSuggestion?.name) {
        day.hotelSuggestion.photo = await getPhotoUrl(`${day.hotelSuggestion.name} ${place.name}`);
      }
    }

    res.render('trip-result', { place, itineraryData, weatherData });

  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to generate trip plan. Please try again.');
    res.redirect('/ai');
  }
});

router.get('/weather', async (req, res) => {
  const city = req.query.city;
  const cleanCity = city?.split(',')[0].trim();
  const data = await getWeather(cleanCity);

  if (data.error) return res.status(400).json({ error: data.error });
  res.json({ forecast: data.forecast });
});

module.exports = router;
