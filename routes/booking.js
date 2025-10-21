// routes/bookings.js
const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

// View all my bookings
router.get("/", isLoggedIn, bookingController.myBookings);

// Cancel a booking
router.post("/:id/cancel", isLoggedIn, bookingController.cancelBooking);

module.exports = router;