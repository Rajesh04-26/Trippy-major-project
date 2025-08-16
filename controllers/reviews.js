const Listing = require("../models/listing.js");
const Reviews = require('../models/review.js');

module.exports.postReview = async (req, res) => {
  let listing = await Listing.findById(req.params.id);
  let newReview = new Reviews(req.body.review);
  newReview.author = req.user._id;
  listing.reviews.push(newReview);
  
   await newReview.save();
   await listing.save();

   req.flash("success", "Review is Added.");
   res.redirect(`/listings/${listing._id}`);
};


module.exports.deleteReview = async (req, res) => {
  let { id , reviewId } = req.params;

  await Listing.findByIdAndUpdate(id, { $pull : { reviews : reviewId }});
  await Reviews.findByIdAndDelete(reviewId);

  req.flash("success", "Review is Deleted.");
  res.redirect(`/listings/${id}`);
};