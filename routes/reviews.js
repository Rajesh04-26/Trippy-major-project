const express = require('express');
const router = express.Router({ mergeParams : true });
const asyncWrap = require("../utils/asyncWrap.js");
const { validateReview, isLoggedIn, isAuthor } = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");


//Review POST route
router.post("/", validateReview, isLoggedIn, asyncWrap(reviewController.postReview));

 //Review DELETE route
router.delete("/:reviewId", isLoggedIn, isAuthor, asyncWrap(reviewController.deleteReview));


module.exports = router;
