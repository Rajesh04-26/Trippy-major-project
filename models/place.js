const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: String,
  country: String,
  lat: Number,
  lng: Number,
  category: String
});

module.exports = mongoose.model("Place", placeSchema);
