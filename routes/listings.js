const express = require('express');
const router = express.Router();
const asyncWrap = require("../utils/asyncWrap.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require('../cloudConfig.js');
const upload = multer({ storage });

// INDEX Route
router.route("/")
  .get(asyncWrap(listingController.index))

  // CREATE Route
  .post(
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    asyncWrap(listingController.createNewListing)
  );

// NEW Route
router.get("/new", isLoggedIn, listingController.newForm);

// SEARCH Route (NEW)
router.post("/search", asyncWrap(listingController.searchListings));

// Popular Places
router.get("/place/:place", asyncWrap(listingController.filterByPlace));

// LISTING SPECIFIC ROUTES
router.route("/:id")
  // SHOW Route
  .get(asyncWrap(listingController.showListing))

  // UPDATE Route
  .put(
    isLoggedIn,
    isOwner,
    upload.single('listing[image]'),
    validateListing,
    asyncWrap(listingController.updateListing)
  )

  // DELETE Route
  .delete(
    isLoggedIn,
    isOwner,
    asyncWrap(listingController.deleteListing)
  );

// EDIT Route
router.get("/:id/edit", isLoggedIn, isOwner, asyncWrap(listingController.editListing));

module.exports = router;
