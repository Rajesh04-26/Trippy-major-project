const Listing = require('./models/listing.js');
const Review = require('./models/review.js');
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js")

 
 //Login authentication middleware
module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to create or edit a new listing.");
        return res.redirect("/listings");
    }
    next();
};

 //SignUp --> login middleware
module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};
 
 //Owner authorization middleware 
module.exports.isOwner = async(req, res, next) => {
    let { id } = req.params;
  let listing = await Listing.findById(id);
  if(!listing.owner._id.equals(res.locals.currUser._id)) {
     req.flash("error", "You are not the owner of this page.");
     return res.redirect(`/listings/${id}`);
  }
  next();
};

 //ReviewAuthor authorization middleware 
module.exports.isAuthor = async(req, res, next) => {
    let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if(!review.author._id.equals(res.locals.currUser._id)) {
     req.flash("error", "You are not the author of this review.");
     return res.redirect(`/listings/${id}`);
  }
  next();
};
 
 //Listing validation middleware
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};

 //Review validation middleware
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, msg);
  } else {
    next();
  }
};