const User = require('../models/user.js');

// Render signup form
module.exports.renderSignup = (req, res) => {
    res.render('users/signup.ejs');
};

// Handle signup
module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ email, username });
        const registeredUser = await User.register(newUser, password);
        console.log("New user registered:", registeredUser);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to LuxeNest!");
            return res.redirect("/listings"); 
        });
    } catch (err) {
        req.flash("error", err.message);
        return res.redirect("/signup");
    }
};

// Render login form
module.exports.renderLogin = (req, res) => {
    res.render('users/login.ejs');
};

// Handle login
module.exports.login = (req, res) => {
    req.flash("success", "Welcome back to Trippy!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

// Handle logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You logged out successfully!");
        res.redirect("/listings");
    });
};
