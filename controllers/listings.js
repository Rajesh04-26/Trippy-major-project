const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// Attach average ratings to listings
const attachAverageRatings = (listings) =>
  listings.map((listing) => {
    const reviews = listing.reviews || [];
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    return { ...listing.toObject(), avgRating };
  });

// INDEX
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).populate({
    path: "reviews",
    select: "rating",
  });
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
    description: listingData.overview?.description || "",
  };

  // Normalize itinerary
  listingData.itinerary = Array.isArray(listingData.itinerary)
    ? listingData.itinerary.map((day, idx) => ({
        day: idx + 1,
        hotel: day.hotel || "",
        plan: day.plan || "",
        meal: day.meal || "not-included",
      }))
    : [];

  // Normalize inclusions/exclusions
  listingData.inclusions = listingData.inclusions
    ? listingData.inclusions.split("\n").map((i) => i.trim()).filter(Boolean)
    : [];
  listingData.exclusions = listingData.exclusions
    ? listingData.exclusions.split("\n").map((i) => i.trim()).filter(Boolean)
    : [];

  // Geocode location
  const geoData = await geocodingClient
    .forwardGeocode({
      query: listingData.location,
      limit: 1,
    })
    .send();

  const newListing = new Listing(listingData);
  newListing.owner = req.user._id;
  newListing.geometry = geoData.body.features[0]?.geometry || {
    type: "Point",
    coordinates: [0, 0],
  };

  // Handle images
  if (req.files["listing[image]"]?.[0]) {
    const mainImage = req.files["listing[image]"][0];
    newListing.image = { url: mainImage.path, filename: mainImage.filename };
  }

  if (req.files["listing[gallery]"]?.length > 0) {
    newListing.gallery = req.files["listing[gallery]"].map((file) => ({
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
    description: listingData.overview?.description || "",
  };

  listingData.itinerary = Array.isArray(listingData.itinerary)
    ? listingData.itinerary.map((day, idx) => ({
        day: idx + 1,
        hotel: day.hotel || "",
        plan: day.plan || "",
        meal: day.meal || "not-included",
      }))
    : [];

  listingData.inclusions = listingData.inclusions
    ? listingData.inclusions.split("\n").map((i) => i.trim()).filter(Boolean)
    : [];
  listingData.exclusions = listingData.exclusions
    ? listingData.exclusions.split("\n").map((i) => i.trim()).filter(Boolean)
    : [];

  const listing = await Listing.findByIdAndUpdate(id, listingData, { new: true });

  if (req.files["listing[image]"]?.[0]) {
    const mainImage = req.files["listing[image]"][0];
    listing.image = { url: mainImage.path, filename: mainImage.filename };
  }

  if (req.files["listing[gallery]"]?.length > 0) {
    const newGalleryImages = req.files["listing[gallery]"].map((file) => ({
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
  if (location?.trim())
    filter.location = { $regex: location.trim(), $options: "i" };

  const filteredListings = await Listing.find(filter).populate({
    path: "reviews",
    select: "rating",
  });

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

// BOOK FORM
module.exports.bookListing = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  res.render("listings/booking.ejs", { listing });
};

// PROCESS BOOKING
module.exports.processBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    const adults = parseInt(req.body.adults) || 0;
    const kids = parseInt(req.body.kids) || 0;

    const adultsTotal = adults * listing.price;
    const kidsTotal = kids * (listing.price * 0.9);
    const total = adultsTotal + kidsTotal;

    res.render("listings/checkout.ejs", { listing, adults, kids, total });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).send("Booking failed");
  }
};

// STRIPE CHECKOUT SESSION
module.exports.createCheckoutSession = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    const adults = parseInt(req.body.adults) || 0;
    const kids = parseInt(req.body.kids) || 0;

    const adultsTotal = adults * listing.price;
    const kidsTotal = kids * (listing.price * 0.9);
    const totalAmount = adultsTotal + kidsTotal;

    if (totalAmount <= 0) {
      return res.status(400).send("Invalid booking amount");
    }

    const booking = new Booking({
      listing: listing._id,
      user: req.user._id,
      adults,
      kids,
      totalAmount,
      status: "pending",
    });
    await booking.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: listing.title },
            unit_amount: Math.round(totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.protocol}://${req.get("host")}/listings/checkout/success?bookingId=${booking._id}`,
      cancel_url: `${req.protocol}://${req.get("host")}/listings/checkout/cancel?bookingId=${booking._id}`,
    });

    res.redirect(303, session.url);
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).send("Stripe payment failed");
  }
};

// USER DASHBOARD
module.exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("bookings/dashboard.ejs", { bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).send("Error loading dashboard");
  }
};

// CANCEL BOOKING
module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/my-bookings");
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to cancel this booking.");
      return res.redirect("/my-bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/my-bookings");
  } catch (err) {
    console.error("Error cancelling booking:", err);
    req.flash("error", "Something went wrong while cancelling.");
    res.redirect("/my-bookings");
  }
};
