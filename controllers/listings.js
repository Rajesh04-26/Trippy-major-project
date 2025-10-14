const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Helper to attach average rating
const attachAverageRatings = (listings) =>
  listings.map(listing => {
    const reviews = listing.reviews || [];
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    return { ...listing.toObject(), avgRating };
  });

// INDEX 
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).populate({ path: "reviews", select: "rating" });
  const listingsWithRatings = attachAverageRatings(allListings);
  res.render("listings/index.ejs", { allListings: listingsWithRatings });
};

// NEW 
module.exports.newForm = (req, res) => {
  res.render("listings/new.ejs");
};

// SHOW
module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// CREATE 
module.exports.createNewListing = async (req, res) => {
  const listingData = { ...req.body.listing };

  // Normalize overview
  listingData.overview = {
    inclusions: Array.isArray(listingData.overview?.inclusions)
      ? listingData.overview.inclusions
      : listingData.overview?.inclusions
      ? [listingData.overview.inclusions]
      : [],
    themes: Array.isArray(listingData.overview?.themes)
      ? listingData.overview.themes
      : listingData.overview?.themes
      ? [listingData.overview.themes]
      : [],
    description: listingData.overview?.description || ""
  };

  // Normalize itinerary (auto-assign day numbers)
  listingData.itinerary = Array.isArray(listingData.itinerary)
    ? listingData.itinerary.map((day, idx) => ({
        day: idx + 1,
        hotel: day.hotel || "",
        plan: day.plan || "",
        meal: day.meal || "not-included"
      }))
    : [];

  // Normalize inclusions/exclusions
  listingData.inclusions = listingData.inclusions
    ? listingData.inclusions.split("\n").map(i => i.trim()).filter(Boolean)
    : [];
  listingData.exclusions = listingData.exclusions
    ? listingData.exclusions.split("\n").map(i => i.trim()).filter(Boolean)
    : [];

  // Geocode location
  const geoData = await geocodingClient.forwardGeocode({
    query: listingData.location,
    limit: 1,
  }).send();

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;
  newListing.geometry = geoData.body.features[0]?.geometry || {
    type: "Point",
    coordinates: [0, 0],
  };

  // Main Image
  if (req.files['listing[image]']?.[0]) {
    const mainImage = req.files['listing[image]'][0];
    newListing.image = { url: mainImage.path, filename: mainImage.filename };
  }

  // Gallery Images
  if (req.files['listing[gallery]']?.length > 0) {
    newListing.gallery = req.files['listing[gallery]'].map(file => ({
      url: file.path,
      filename: file.filename,
    }));
  }

  await newListing.save();
  req.flash("success", "New Listing Created Successfully.");
  res.redirect("/listings");
};

// EDIT 
module.exports.editListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist.");
    return res.redirect("/listings");
  }
  res.render("listings/edit.ejs", { listing });
};

// UPDATE 
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listingData = { ...req.body.listing };

  // Normalize overview
  listingData.overview = {
    inclusions: Array.isArray(listingData.overview?.inclusions)
      ? listingData.overview.inclusions
      : listingData.overview?.inclusions
      ? [listingData.overview.inclusions]
      : [],
    themes: Array.isArray(listingData.overview?.themes)
      ? listingData.overview.themes
      : listingData.overview?.themes
      ? [listingData.overview.themes]
      : [],
    description: listingData.overview?.description || ""
  };

  // Normalize itinerary with day numbers
  listingData.itinerary = Array.isArray(listingData.itinerary)
    ? listingData.itinerary.map((day, idx) => ({
        day: idx + 1,
        hotel: day.hotel || "",
        plan: day.plan || "",
        meal: day.meal || "not-included"
      }))
    : [];

  // Normalize inclusions/exclusions
  listingData.inclusions = listingData.inclusions
    ? listingData.inclusions.split("\n").map(i => i.trim()).filter(Boolean)
    : [];
  listingData.exclusions = listingData.exclusions
    ? listingData.exclusions.split("\n").map(i => i.trim()).filter(Boolean)
    : [];

  const listing = await Listing.findByIdAndUpdate(id, listingData, { new: true });

  // Update Main Image
  if (req.files['listing[image]']?.[0]) {
    const mainImage = req.files['listing[image]'][0];
    listing.image = { url: mainImage.path, filename: mainImage.filename };
  }

  // Add Gallery Images
  if (req.files['listing[gallery]']?.length > 0) {
    const newGalleryImages = req.files['listing[gallery]'].map(file => ({
      url: file.path,
      filename: file.filename,
    }));
    listing.gallery.push(...newGalleryImages);
  }

  await listing.save();
  req.flash("success", "Listing Updated Successfully.");
  res.redirect(`/listings/${id}`);
};

// DELETE 
module.exports.deleteListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted Successfully.");
  res.redirect("/listings");
};

// SEARCH 
module.exports.searchListings = async (req, res) => {
  const { country, location } = req.body;
  const filter = {};
  if (country) filter.country = country;
  if (location?.trim()) filter.location = { $regex: location.trim(), $options: "i" };

  const filteredListings = await Listing.find(filter)
    .populate({ path: "reviews", select: "rating" });

  const listingsWithRatings = attachAverageRatings(filteredListings);
  res.render("listings/index.ejs", { allListings: listingsWithRatings });
};

// FILTER BY PLACE
module.exports.filterByPlace = async (req, res) => {
  const { place } = req.params;
  const listings = await Listing.find({
    location: { $regex: place, $options: "i" },
  }).populate({ path: "reviews", select: "rating" });

  if (!listings.length) {
    req.flash("error", `No listings found for ${place}`);
    return res.redirect("/listings");
  }

  const listingsWithRatings = attachAverageRatings(listings);
  res.render("listings/index.ejs", { allListings: listingsWithRatings });
};
