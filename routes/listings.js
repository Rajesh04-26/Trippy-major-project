const express = require("express");
const router = express.Router();
const asyncWrap = require("../utils/asyncWrap.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");

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
  .delete(
    isLoggedIn,
    isOwner,
    asyncWrap(listingController.deleteListing) 
  );

// EDIT FORM 
router.get("/:id/edit", isLoggedIn, isOwner, asyncWrap(listingController.editListing));

module.exports = router;
