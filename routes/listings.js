const express = require('express');
const router = express.Router();
const asyncWrap = require("../utils/asyncWrap.js");
const { isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const { storage } = require('../cloudConfig.js')
const upload = multer({ storage });


router.route("/")
//Index Route
.get(asyncWrap (listingController.index))

//Create Route
.post(isLoggedIn, 
    upload.single('listing[image]'), 
    validateListing,
    asyncWrap(listingController.createNewListing));


//New Route
router.get("/new",isLoggedIn , listingController.newForm);


router.route("/:id")
//Show Route
.get(asyncWrap(listingController.showListing))

//Update Route
.put(isLoggedIn, 
    isOwner, 
    upload.single('listing[image]'), 
    validateListing,
    asyncWrap(listingController.updateListing))

//Delete Route
.delete(isLoggedIn, 
    isOwner, 
    asyncWrap(listingController.deleteListing));


//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, asyncWrap(listingController.editListing));


module.exports = router;