const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const DB = require("../config/db");

// Route to render the login page
router.get("/login", (req, res) => {
  // Render the login page and pass flash messages
  res.render("auth/login", {
    messages: req.flash("loginMessage"),
    title: "Login",
    username: req.user ? req.user.username : "",
  });
});

// Route to handle login form submission
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    // Server error?
    if (err) {
      return next(err);
    }
    // If there's a user login error
    if (!user) {
      req.flash("loginMessage", "Incorrect Username or Password");
      return res.redirect("login");
    }
    // After calling req.login(), Express will persist user information in the session, and req.isAuthenticated() will return true, indicating the user has been authenticated.
    req.login(user, (err) => {
      if (err) {
        res.send(err);
      }
      // User found and password matched, now create and sign JWT
      const token = jwt.sign({ id: user.id }, DB.Secret, {
        expiresIn: "1h",
      });
      // Redirect to list page with JWT token in query parameter
      return res.redirect("/survey/list");
    });
  })(req, res, next);
});

// Route for registration page
router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    // Check if username and email already exist
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      let errorMessage = "";
      if (existingUser.email === email) {
        errorMessage = "Email already exists";
      } else if (existingUser.username === username) {
        errorMessage = "Username already exists";
      }
      return res.render("auth/register", {
        title: "Register",
        username: req.user ? req.username : "",
        messages: errorMessage,
      });
    }

    // Generate password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
    });

    // Save user to the database
    await newUser.save();
    res.redirect("login"); // Redirect to login page after successful registration
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to render the registration page
router.get("/register", (req, res) => {
  // Render the registration page
  res.render("auth/register", {
    title: "Register",
    username: req.user ? req.user.username : "",
  });
});

// Route to handle user logout
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/"); // Redirect to the login page
  }); // Log out the user session
});

module.exports = router;
