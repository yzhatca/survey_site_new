//Just logic - no routing
let express = require('express');
let router = express.Router();
let mongoose = require('mongoose');
let passport = require('passport');

//enable jwt
let jwt = require('jsonwebtoken');
let DB = require('../config/db');

//define user model instance
let userModel = require('../models/user');
let User = userModel.User;

module.exports.displayHomePage = (req, res, next) => {
    res.render("index", {
      title: "Home",
      messages: req.flash("VerificationMessage"),
      displayName: req.user ? req.user.displayName : "",
    });
  };


module.exports.displayLoginPage = (req, res, next) => {
    //check if user is already logged in
    if (!req.user) {
        res.render('auth/login', {
            title: "Login",
            messages: req.flash('loginMessage'),
            displayName: req.user ? req.user.displayName : ''
        })
    } else {
        return res.redirect('/');
    }
}

module.exports.processLoginPage = (req, res, next) => {
    passport.authenticate('local',
        (err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                req.flash('loginMessage', 'Username or Password Incorrect');
                return res.redirect('/login');
            }
            req.login(user, (err) => {
                //server error
                if (err) {
                    return next(err);
                }

                const payload = {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }

                const authToken = jwt.sign(payload, DB.Secret, {
                    expiresIn: '1h'
                });

                return res.redirect('/survey-list');
            });
        })(req, res, next);
}

module.exports.displayRegisterPage = (req, res, next) => {
    //check if the user is not logged in
    if (!req.user) {
        res.render('auth/register', {
            title: 'Register',
            messages: req.flash('registerMessages'),
            displayName: req.user ? req.user.displayName : ''
        });
    } else {
        return res.redirect('/');
    }
}

module.exports.processRegisterPage = (req, res, next) => {
    //define a user object
    let newUser = new User({
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        displayName: req.body.displayName,
        userType: req.body.optUserType
    });

    User.register(newUser, req.body.password, (err) => {
        if (err) {
            console.log("Error: Inserting New User");
            if (err.name == "UserExistsError") {
                req.flash(
                    'registerMessage',
                    'Registration Error: User Already Exists!'
                );
                console.log("Error: User Already Exists!");
            }
            return res.render('auth/register', {
                title: 'Register',
                messages: req.flash('registerMessage'),
                displayName: req.user ? req.user.displayName : ''
            });
        } else {
            return passport.authenticate('local')(req, res, () => {
                res.redirect('/survey-list')
            });
        }
    });
}

module.exports.performLogout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
}