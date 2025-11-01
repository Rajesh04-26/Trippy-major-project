require("dotenv").config({ path: process.env.NODE_ENV !== "production" ? ".env" : undefined });

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

// Models
const User = require("./models/user");
const Listing = require("./models/listing");

// Routes
const listingRouter = require("./routes/listings");
const reviewRouter = require("./routes/reviews");
const userRouter = require("./routes/users");
const bookingRouter = require("./routes/booking");
const tripPlannerRoutes = require("./routes/tripPlanner");

// Stripe setup
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const stripePublicKey = process.env.STRIPE_PUBLISHABLE_KEY;

// MongoDB connection
const dbUrl = process.env.ATLASDB_URL;

(async function connectDB() {
  try {
    await mongoose.connect(dbUrl, { autoIndex: true });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
})();

const app = express();

// App & view engine setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Session store configuration
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600, 
});

store.on("error", (err) => console.error("Mongo Session Store Error:", err));

const sessionConfig = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
};

app.use(session(sessionConfig));
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global middleware for flash messages and user
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  res.locals.stripePublicKey = stripePublicKey;
  next();
});

// Home route
app.get("/", async (req, res) => {
  try {
    const allListings = await Listing.find({});
    res.render("listings/home", { allListings });
  } catch (err) {
    console.error(err);
    req.flash("error", "Cannot load listings");
    res.render("listings/home", { allListings: [] });
  }
});

// About page
app.get("/about", (req, res) => {
  res.render("about.ejs");
});

// Contact page
app.get("/contact", (req, res) => {
  res.render("contact.ejs");
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);
app.use("/bookings", bookingRouter);
app.use("/ai", tripPlannerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  const { status = 500, message = "Something went wrong" } = err;
  console.error(err);
  res.status(status).render("error", { message });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
