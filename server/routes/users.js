var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/login',(req, res, next)=>{
  res.render("auth/login", { title: "login" });
})

router.get('/register',(req, res, next)=>{
  res.render("auth/register", { title: "register" });
})

router.get('/logout',(req, res, next)=>{
  res.render("auth/logout", { title: "logout" });
})


module.exports = router;
