//survey.js控制survey相关的操作
var express = require("express");
var router = express.Router();
const Survey = require("../models/survey");

router.get("/add", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
  res.render("page/add", { title: "AddSurvey" });
});

router.post("/add", async (req, res) => {
  try {
    // 解析收到的数据
    const { title, description, startTime, endTime, questions } = req.body;

    // 将字符串类型的 questions 转换为数组对象
    const parsedQuestions = JSON.parse(questions);
    console.log(parsedQuestions);
    // 创建调查对象
    const survey = new Survey({
      title,
      description,
      startTime: new Date(startTime), // 转换为日期对象
      endTime: new Date(endTime), // 转换为日期对象
      questions: parsedQuestions,
    });
    console.log(survey);
    // 将调查对象保存到数据库
    await survey.save();

    // 返回成功消息
    res.status(200).json({ message: "Survey added successfully" });
  } catch (error) {
    // 如果发生错误，返回错误消息
    console.error("Error adding survey:", error);
    res.status(500).json({ error: "Failed to add survey" });
  }
});

router.get("/edit", (req, res, next) => {
  // 跳转到page中的addSurvey.ejs页
  res.render("page/edit", { title: "AddSurvey" });
});

router.get("/list", async (req, res, next) => {
  try {
    // 从数据库中获取调查列表
    const surveyList = await Survey.find();

    // 渲染页面并将调查列表传递给模板引擎
    res.render("page/list", {
      title: "Surveys",
      SurveyList: surveyList,
    });
  } catch (error) {
    // 错误处理
    next(error);
  }
});

router.get("/take/:id", async (req, res, next) => {
  try {
    let id = req.params.id;
    //findById不接受回调函数
    let survey = await Survey.findById(id).exec();
    if (!survey) {
      // 如果找不到相应ID的调查
      return res.status(404).send("Survey not found");
    }
    // 显示编辑视图
    res.render("page/takeSurvey", {
      title: "Take Survey",
      survey: survey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// {
//   "65e005a6c54f5932da1210ba": 'qsqqq',
//   "65e005a6c54f5932da1210bb": 'aaaa'
// }

router.post('/take/:id', async (req, res) => {
  try {
      const surveyId = req.params.id;
      const responses = req.body;

      // 创建新的答案对象
      const newAnswer = {
          surveyId: surveyId,
          responses: []
      };

      // 将每个问题的回答添加到新答案对象中
      for (const questionId in responses) {
          if (questionId in responses) { // 使用 in 操作符检查属性是否存在
              const answer = responses[questionId];

              newAnswer.responses.push({
                  questionId: questionId,
                  answer: answer
              });
          }
      }

      // 将答案存储到数据库中
      const survey = await Survey.findByIdAndUpdate(
          surveyId,
          { $push: { answers: newAnswer } },
          { new: true }
      );

      res.status(200).json({ success: true, message: 'Answer submitted successfully', survey: survey });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


module.exports = router;
