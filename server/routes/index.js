// index.js router controls page navigation

var express = require("express");
var router = express.Router();

/* GET home page. */
// req is the request object, res is the response object, next is the next middleware function in the stack
router.get("/", function (req, res, next) {
  // Render the index view with title 'Express' and username if available in the request user object
  res.render("index", {
    title: "Express",
    username: req.user ? req.user.username : "",
  });
});

module.exports = router;
