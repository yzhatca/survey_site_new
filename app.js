// Import required modules
var createError = require("http-errors"); // Module for creating HTTP error objects
var express = require("express"); // Express framework
var path = require("path"); // Path handling module provided by Node.js
var cookieParser = require("cookie-parser"); // Middleware for parsing cookies
var logger = require("morgan"); // Logging middleware
const bodyParser = require("body-parser");
let DB = require("./server/config/db"); // Import database configuration file
var app = express(); // Create an Express application instance
const cors = require("cors");

// Import Passport and JWT
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");

// Import user model
const User = require("./server/models/user");

// Import router modules
var indexRouter = require("./server/routes/index"); // Index route
var usersRouter = require("./server/routes/users"); // User route
var surveyRouter = require("./server/routes/survey"); // Survey route

// Set view engine and view folder path
app.set("views", path.join(__dirname, "server", "views")); // Set view folder path to the views folder under the server directory
app.set("view engine", "ejs"); // Set view engine to EJS

app.use(logger("dev")); // Use logging middleware for development environment
app.use(express.json()); // Parse JSON format request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies
app.use(cookieParser()); // Use cookie parsing middleware
app.use(express.static(path.join(__dirname, "public"))); // Set static file directory to the public folder under the current directory
app.use(express.static(path.join(__dirname, "node_modules")));
app.use("/server", express.static("server"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// Use express-session middleware for session management
app.use(
  session({
    secret: "SomeSecret", // Key used to encrypt session data, can be any string
    resave: false, // Whether to re-save session data for each request, default is true
    saveUninitialized: false, // Whether to automatically save uninitialized session data, default is true
  })
);
app.use(flash());
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        // Find user
        const user = await User.findOne({ email: email });
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          return done(null, user, { message: "Logged in Successfully" });
        } else {
          return done(null, false, { message: "Invalid email or password" });
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id); // Use the id field of the user document as the unique identifier
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Use router modules
app.use("/", indexRouter); // Use index route
app.use("/users", usersRouter); // Use user route
app.use("/survey", surveyRouter); // Use survey route

// Database setup
let mongoose = require("mongoose"); // Import Mongoose module

// Connect Mongoose to the database URI
// Connect to the local MongoDB database using Mongoose
mongoose
  .connect(DB.URI)
  .then(() => {
    console.log("MongoDB connection success");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// Capture 404 errors and forward to error handler
app.use(function (req, res, next) {
  next(createError(404)); // Create 404 error and pass it to the next middleware
});

// Error handler
app.use(function (err, req, res, next) {
  // Set local variables, provide error information only in the development environment
  res.locals.message = err.message; // Error message
  res.locals.error = req.app.get("env") === "development" ? err : {}; // Provide detailed error information in the development environment

  // Render error page
  res.status(err.status || 500); // Set response status code to the error status code or default 500
  res.render("error"); // Render the error.ejs view
});

module.exports = app; // Export the Express application instance
