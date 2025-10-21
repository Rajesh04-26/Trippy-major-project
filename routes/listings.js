const express = require("express");
const router = express.Router();
const asyncWrap = require("../utils/asyncWrap.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const Booking = require("../models/booking.js");

const upload = multer({ storage });

// INDEX & CREATE 
router
  .route("/")
  .get(asyncWrap(listingController.index))
  .post(
    isLoggedIn,
    upload.fields([
      { name: "listing[image]", maxCount: 1 },
      { name: "listing[gallery]", maxCount: 6 },
    ]),
    validateListing,
    asyncWrap(listingController.createNewListing)
  );

// NEW FORM
router.get("/new", isLoggedIn, listingController.newForm);

// SEARCH 
router.post("/search", asyncWrap(listingController.searchListings));

// FILTER BY PLACE 
router.get("/place/:place", asyncWrap(listingController.filterByPlace));

// MY BOOKINGS & CANCEL BOOKING
router.get("/my-bookings", isLoggedIn, asyncWrap(listingController.myBookings));
router.post("/my-bookings/:id/cancel", isLoggedIn, asyncWrap(listingController.cancelBooking));

// SHOW / UPDATE / DELETE 
router
  .route("/:id")
  .get(asyncWrap(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.fields([
      { name: "listing[image]", maxCount: 1 },
      { name: "listing[gallery]", maxCount: 6 },
    ]),
    validateListing,
    asyncWrap(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, asyncWrap(listingController.deleteListing));

// EDIT FORM 
router.get("/:id/edit", isLoggedIn, isOwner, asyncWrap(listingController.editListing));

// BOOKING ROUTES 
router.get("/:id/book", isLoggedIn, asyncWrap(listingController.bookListing));

// CHECKOUT PROCESS 
router.post("/:id/checkout", isLoggedIn, asyncWrap(listingController.processBooking));
router.post("/:id/create-checkout-session", isLoggedIn, asyncWrap(listingController.createCheckoutSession));

// SUCCESS PAGE 
router.get("/checkout/success", asyncWrap(async (req, res) => {
  const { bookingId } = req.query;
  if (bookingId) {
    await Booking.findByIdAndUpdate(bookingId, { status: "paid" });
  }
  res.render("listings/success");
}));

// CANCEL PAGE 
router.get("/checkout/cancel", asyncWrap(async (req, res) => {
  const { bookingId } = req.query;
  if (bookingId) {
    await Booking.findByIdAndUpdate(bookingId, { status: "cancelled" });
  }
  res.render("listings/cancel");
}));

module.exports = router;
