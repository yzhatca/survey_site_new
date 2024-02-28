// index.js router控制页面的跳转

var express = require('express');
var router = express.Router();

/* GET home page. */
//req请求第一位，res第二位
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



module.exports = router;
