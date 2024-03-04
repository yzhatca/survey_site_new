const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const DB = require('../config/db')


router.get("/login", (req, res) => {
    // 渲染登录页面，并传递闪存消息
    res.render("auth/login", { messages: req.flash('loginMessage'), title: "Login", username: req.user ? req.user.username : "" });
});

// 处理登录表单提交
router.post("/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        //server errr?
        if (err) {
            return next(err);
        }
        //if there a user login error?
        if (!user) {
            req.flash('loginMessage', 'Incorrect Username or Password');
            return res.redirect('login');
        }
        //在调用 req.login() 后，Express 将在会话中持久化用户信息，并且 req.isAuthenticated() 将会返回 true，表明用户已经通过身份验证。
        req.login(user, (err) => {
            if (err) {
                res.send(err);
            }
            console.log(user)
            // User found and password matched, now create and sign JWT
            const token = jwt.sign({ id: user.id }, DB.Secret,{
                expiresIn: '1h'
            });
            console.log(token)
            // Redirect to list page with JWT token in query parameter
            return res.redirect('/survey/list');
        });
    })(req, res, next);
});


// 注册页面
// 注册页面
router.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // 检查用户名和邮箱是否已经存在
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            let errorMessage = '';
            if (existingUser.email === email) {
                errorMessage = 'Email already exists';
            } else if(existingUser.username === username) {
                errorMessage = 'username already exists'
            }
            return res.render("auth/register", {
                title: "Register",
                username: req.user ? req.username : "",
                messages: errorMessage
            });
        }

        // 生成密码哈希
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
        });

        // 保存用户到数据库
        await newUser.save();
        res.redirect("login"); // 注册成功后重定向到登录页面
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get("/register", (req, res) => {
    // 渲染注册页面
    res.render("auth/register", { title: "Register", username: req.user ? req.user.username : "",});
});
router.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('index');// 重定向到登录页面
    }); // 注销用户会话
});



module.exports = router;
