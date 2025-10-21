require("dotenv").config();
const mongoose = require("mongoose");
const Place = require("./models/place");

const dbURL = process.env.ATLASDB_URL;
const seedPlaces = [
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522, category: "romantic" },
  { name: "Tokyo", country: "Japan", lat: 35.6895, lng: 139.6917, category: "city" },
  { name: "Bali", country: "Indonesia", lat: -8.3405, lng: 115.0920, category: "beach" },
  { name: "New York City", country: "USA", lat: 40.7128, lng: -74.0060, category: "city" },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278, category: "city" },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, category: "beach" },
  { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964, category: "historic" },
  { name: "Barcelona", country: "Spain", lat: 41.3851, lng: 2.1734, category: "city" },
  { name: "Dubai", country: "UAE", lat: 25.276987, lng: 55.296249, category: "luxury" },
  { name: "Istanbul", country: "Turkey", lat: 41.0082, lng: 28.9784, category: "historic" },
  { name: "Santorini", country: "Greece", lat: 36.3932, lng: 25.4615, category: "island" },
  { name: "Bangkok", country: "Thailand", lat: 13.7563, lng: 100.5018, category: "city" },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198, category: "city" },
  { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437, category: "city" },
  { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194, category: "city" },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729, category: "beach" },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, category: "nature" },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694, category: "city" },
  { name: "Venice", country: "Italy", lat: 45.4408, lng: 12.3155, category: "romantic" },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173, category: "historic" },

  // --- INDIA ENTRIES ---
  { name: "Taj Mahal", country: "India", lat: 27.1751, lng: 78.0421, category: "historic" },
  { name: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873, category: "city" },
  { name: "Goa", country: "India", lat: 15.2993, lng: 74.1240, category: "beach" },
  { name: "Kerala Backwaters", country: "India", lat: 9.4981, lng: 76.3388, category: "nature" },
  { name: "Leh-Ladakh", country: "India", lat: 34.1526, lng: 77.5771, category: "mountain" },
  { name: "Varanasi", country: "India", lat: 25.3176, lng: 82.9739, category: "spiritual" },
  { name: "Mysore Palace", country: "India", lat: 12.3052, lng: 76.6552, category: "historic" },
  { name: "Rishikesh", country: "India", lat: 30.0869, lng: 78.2676, category: "spiritual" },
  { name: "Manali", country: "India", lat: 32.2396, lng: 77.1887, category: "mountain" },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777, category: "city" },
  { name: "Delhi", country: "India", lat: 28.6139, lng: 77.2090, category: "city" },
  { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639, category: "city" },
  { name: "Chennai", country: "India", lat: 13.0827, lng: 80.2707, category: "city" },
  { name: "Bengaluru", country: "India", lat: 12.9716, lng: 77.5946, category: "city" },
  { name: "Hyderabad", country: "India", lat: 17.3850, lng: 78.4867, category: "city" },
  { name: "Darjeeling", country: "India", lat: 27.0410, lng: 88.2663, category: "mountain" },
  { name: "Amritsar", country: "India", lat: 31.6340, lng: 74.8723, category: "spiritual" },
  { name: "Hampi", country: "India", lat: 15.3350, lng: 76.4600, category: "historic" },
  { name: "Andaman Islands", country: "India", lat: 11.7401, lng: 92.6586, category: "island" },
  { name: "Pondicherry", country: "India", lat: 11.9416, lng: 79.8083, category: "beach" },
   { name: "Puri", country: "India", lat: 11.9416, lng: 79.8083, category: "beach" },


  // --- EXPANDED WORLDWIDE LIST (Sample) ---
  { name: "Kyoto", country: "Japan", lat: 35.0116, lng: 135.7681, category: "historic" },
  { name: "Osaka", country: "Japan", lat: 34.6937, lng: 135.5023, category: "city" },
  { name: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.9780, category: "city" },
  { name: "Jeju Island", country: "South Korea", lat: 33.4996, lng: 126.5312, category: "island" },
  { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074, category: "historic" },
  { name: "Shanghai", country: "China", lat: 31.2304, lng: 121.4737, category: "city" },
  { name: "Great Wall of China", country: "China", lat: 40.4319, lng: 116.5704, category: "historic" },
  { name: "Machu Picchu", country: "Peru", lat: -13.1631, lng: -72.5450, category: "historic" },
  { name: "Cusco", country: "Peru", lat: -13.5319, lng: -71.9675, category: "historic" },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357, category: "historic" },
  { name: "Giza Pyramids", country: "Egypt", lat: 29.9792, lng: 31.1342, category: "historic" },
  { name: "Petra", country: "Jordan", lat: 30.3285, lng: 35.4444, category: "historic" },
  { name: "Jerusalem", country: "Israel", lat: 31.7683, lng: 35.2137, category: "spiritual" },
  { name: "Reykjavik", country: "Iceland", lat: 64.1355, lng: -21.8954, category: "nature" },
  { name: "Blue Lagoon", country: "Iceland", lat: 63.8804, lng: -22.4495, category: "nature" },
  { name: "Zurich", country: "Switzerland", lat: 47.3769, lng: 8.5417, category: "city" },
  { name: "Interlaken", country: "Switzerland", lat: 46.6863, lng: 7.8632, category: "mountain" },
  { name: "Lucerne", country: "Switzerland", lat: 47.0502, lng: 8.3093, category: "mountain" },
  { name: "Geneva", country: "Switzerland", lat: 46.2044, lng: 6.1432, category: "city" },
  { name: "Edinburgh", country: "Scotland", lat: 55.9533, lng: -3.1883, category: "historic" },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603, category: "city" },
  { name: "Havana", country: "Cuba", lat: 23.1136, lng: -82.3666, category: "historic" },
  { name: "Cancun", country: "Mexico", lat: 21.1619, lng: -86.8515, category: "beach" },
  { name: "Mexico City", country: "Mexico", lat: 19.4326, lng: -99.1332, category: "city" },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, category: "city" },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207, category: "city" },
  { name: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673, category: "city" },
  { name: "Banff National Park", country: "Canada", lat: 51.4968, lng: -115.9281, category: "nature" },
  { name: "Niagara Falls", country: "Canada", lat: 43.0962, lng: -79.0377, category: "nature" },

];


async function seedDB() {
  try {
    // connect to Atlas
    await mongoose.connect(dbURL);  // no need for extra options
    console.log("Connected to MongoDB Atlas");

    await Place.deleteMany({}); // Optional: clear existing entries
    await Place.insertMany(seedPlaces);
    console.log("Seeding complete");

    await mongoose.connection.close();
    console.log("Connection closed");
  } catch (err) {
    console.error("Error during seeding:", err);
  }
}


seedDB();