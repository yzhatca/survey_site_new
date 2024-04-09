/* This code snippet is a JavaScript file that defines a user schema using Mongoose, a popular Node.js
library for MongoDB. Here's a breakdown of what each part of the code does: */

// Import required modules
let mongoose = require("mongoose");

// Define user schema
let userSchema = new mongoose.Schema({
  // Username, allowed to be repeated
  password: { type: String, required: true }, // Password
  email: { type: String, required: true, unique: true }, // Email
  username: { type: String }, // Username
  displayName: { type: String }, // Display name
  userType: { type: String }, // User type
  created: { type: Date, default: Date.now }, // Creation time
});

// Create user model
module.exports = mongoose.model("User", userSchema);
