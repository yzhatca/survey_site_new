const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const DB = require('../config/db')


router.get("/login", (req, res) => {
    // 渲染登录页面
    res.render("auth/login", { messages: req.flash('error'), title: "Login" });
});

// 处理登录表单提交
router.post("/login", (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err || !user) {
            return res.status(400).json({
                message: info ? info.message : 'Login failed',
                user: user
            });
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
router.post("/register", async (req, res) => {
    const { username, password, email} = req.body;

    try {
        // 检查用户名是否已经存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
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

        res.status(201).json({ message: 'User registered successfully' });
        res.redirect("page/user/login"); // 注册成功后重定向到登录页面
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// // 处理注册表单提交
// router.post("/register", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     // 检查用户名是否已经存在
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(400).send("Username already exists");
//     }
//     // 创建新用户
//     const newUser = new User({ username, email, password });
//     await newUser.save();
//     res.redirect("page/user/login"); // 注册成功后重定向到登录页面
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/register", (req, res) => {
    // 渲染注册页面
    res.render("auth/register", { title: "Register" });
  });
  

module.exports = router;
