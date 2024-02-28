//survey.js控制survey相关的操作
var express = require("express");
var router = express.Router();
const Survey = require('../models/survey');

router.get("/add", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
    res.render("page/add", { title: "AddSurvey" });
});

router.post('/add', async (req, res, next) => {
  try {
      const { title, description, startTime, endTime, questions } = req.body;
      
      // 构造问题列表
      const questionObjects = questions.map(question => {
          const { type, questionText, options } = question;
          return {
              type,
              questionText,
              options
          };
      });

      // 创建新的调查问卷对象
      const newSurvey = new Survey({
          title,
          description,
          startTime,
          endTime,
          questions: questionObjects
      });

      // 保存调查问卷到数据库
      const savedSurvey = await newSurvey.save();

      res.redirect('/survey/add'); // 添加成功后重定向到调查问卷列表页面
  } catch (error) {
      next(error); // 将错误传递给错误处理中间件
  }
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