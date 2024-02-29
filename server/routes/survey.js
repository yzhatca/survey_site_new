//survey.js控制survey相关的操作
var express = require("express");
var router = express.Router();
const Survey = require('../models/survey');

router.get("/add", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
    res.render("page/add", { title: "AddSurvey" });
});

router.post('/add', async (req, res) => {

      const surveyData = req.body;
      console.log(surveyData)
      res.send('200')
});


router.get('/test', (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
    res.render("page/test", { title: "AddSurvey" });
})

router.post('/test', (req, res) => {
  const items = req.body['items[]']; // 获取名为 'items[]' 的表单数据

  // 打印接收到的表单数据
  items.forEach(item => {
      console.log(item);
  });
    res.send('表单已提交');
});


router.get("/edit", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
    res.render("page/edit", { title: "AddSurvey" });
});

router.get("/display", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
    res.render("page/display", { title: "AddSurvey" });
});




module.exports = router;