const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review");

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  image: {
    url: { type: String, default: "" },
    filename: { type: String, default: "" }
  },
  gallery: {
    type: [{ url: String, filename: String }],
    default: []
  },
  price: { type: Number, default: 0 },
  location: { type: String, default: "" },
  country: { type: String, default: "" },
  overview: {
    inclusions: {
      type: [String],
      default: [],
      set: v => Array.isArray(v) ? v : v ? [v] : []
    },
    themes: {
      type: [String],
      default: [],
      set: v => Array.isArray(v) ? v : v ? [v] : []
    },
    description: { type: String, default: "" }
  },
  itinerary: {
    type: [{
      day: Number,
      hotel: { type: String, default: "" },
      plan: { type: String, default: "" },
      meal: { type: String, enum: ["included", "not-included"], default: "not-included" }
    }],
    default: []
  },
  inclusions: {
    type: [String],
    default: [],
    set: v => Array.isArray(v) ? v.filter(x => x && x.trim()) : v ? v.split("\n").map(x => x.trim()).filter(Boolean) : []
  },
  exclusions: {
    type: [String],
    default: [],
    set: v => Array.isArray(v) ? v.filter(x => x && x.trim()) : v ? v.split("\n").map(x => x.trim()).filter(Boolean) : []
  },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  geometry: {
    type: { type: String, enum: ["Point"], required: true, default: "Point" },
    coordinates: { type: [Number], required: true, default: [0, 0] }
  },
  bookings: {
    type: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      guests: { type: Number, required: true }
    }],
    default: []
  }
});

// Middleware to delete associated reviews when a listing is deleted
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
