//survey.js控制survey相关的操作
var express = require("express");
var router = express.Router();
const Survey = require('../models/survey');

router.get("/add", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
    res.render("page/add", { title: "AddSurvey" });
});

router.post('/add', async (req, res) => {
  try {
      // 解析收到的数据
      const { title, description, startTime, endTime, questions } = req.body;

      // 将字符串类型的 questions 转换为数组对象
      const parsedQuestions = JSON.parse(questions);
      console.log(parsedQuestions)
      // 创建调查对象
      const survey = new Survey({
          title,
          description,
          startTime: new Date(startTime), // 转换为日期对象
          endTime: new Date(endTime), // 转换为日期对象
          questions: parsedQuestions
      });
      console.log(survey)
      // 将调查对象保存到数据库
      await survey.save();

      // 返回成功消息
      res.status(200).json({ message: 'Survey added successfully' });
  } catch (error) {
      // 如果发生错误，返回错误消息
      console.error('Error adding survey:', error);
      res.status(500).json({ error: 'Failed to add survey' });
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