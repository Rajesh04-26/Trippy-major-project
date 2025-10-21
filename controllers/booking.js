// controllers/booking.js
const Booking = require("../models/booking");

module.exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("bookings/dashboard", { bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).send("Error loading dashboard");
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/bookings");
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      req.flash("error", "You are not authorized to cancel this booking.");
      return res.redirect("/bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/bookings");
  } catch (err) {
    console.error("Error cancelling booking:", err);
    req.flash("error", "Something went wrong while cancelling.");
    res.redirect("/bookings");
  }
};