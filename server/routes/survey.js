// survey.js 控制 survey 相关的操作
const express = require("express");
const router = express.Router();
const { Survey, Question, Answer } = require("../models/survey");
const passport = require("passport");

// 登录验证中间件
function requireAuth(req, res, next)
{
    console.log(req.user)
    // check if the user is logged in
    if(!req.isAuthenticated())
    {
        return res.redirect('/users/login');
    }
    next();
}

router.get("/add",requireAuth, (req, res, next) => {
  // 跳转到 page 中的 addSurvey.ejs 页
  res.render("page/add", { title: "Add Survey" ,username: req.user ? req.user.username : "",});
});

router.post("/add",requireAuth, async (req, res) => {
  try {
    // 解析收到的数据
    const { title, description, startTime, endTime, questions } = req.body;
    
    const userId = req.user._id
    // 将字符串类型的 questions 解析为数组对象
    const parsedQuestions = JSON.parse(questions);

    // 创建问题对象数组
    //Promise.all()：这是一个静态方法，接收一个由 Promise 对象组成的可迭代对象（如数组），
    // 并返回一个新的 Promise，该 Promise 在可迭代对象中所有的 Promise 都成功时才会成功。
    // 它可以同时处理多个异步操作，并等待它们全部完成。
    //Promise.all()：这是一个静态方法，接收一个由 Promise 对象组成的可迭代对象（如数组），并返回一个新的 Promise，
    //该 Promise 在可迭代对象中所有的 Promise 都成功时才会成功。它可以同时处理多个异步操作，并等待它们全部完成。
    const questionIds = await Promise.all(parsedQuestions.map(async (q) => {
      const question = new Question({
        qType: q.qType,
        qText: q.qText,
        options: q.options || [], // 可能没有选项，需考虑兼容性
      });
      await question.save();
      return question._id; // 返回问题的 ObjectId
    }));

    // 创建调查问卷对象
    const survey = new Survey({
      creator:userId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      questions: questionIds, // 将问题的 ObjectId 数组存储在调查问卷中
    });

    // 将调查问卷对象保存到数据库
    await survey.save();

    // 返回成功消息
    res.redirect('/survey/manage')
  } catch (error) {
    // 如果发生错误，返回错误消息
    console.error("Error adding survey:", error);
    res.status(500).json({ error: "Failed to add survey" });
  }
});


router.get("/update/:id", requireAuth,async (req, res, next) => {
  try {
    const id = req.params.id;

    // 使用 populate 方法来获取与调查问卷关联的问题
    // .populate('questions') 是 Mongoose 中的一种方法，用于填充引用字段的关联文档。在这个上下文中，
    // 'questions' 是指 surveySchema 中的字段，它是一个数组，包含了与问题（questions）模式关联的对象ID。
    // 当你调用 .populate('questions') 时，Mongoose 将会替换调查问卷（Survey）记录中的问题ID（保存在 'questions' 字段中）为对应的问题对象。
    // 这样，你就可以在调查问卷对象中直接访问问题对象，而不仅仅是它们的ID。
    const survey = await Survey.findById(id).populate('questions').exec();
    if (!survey) {
      // 如果找不到相应ID的调查问卷
      return res.status(404).send("Survey not found");
    }
    
    res.render("page/edit", {
      title: "Edit Survey",
      survey: survey,
      username: req.user ? req.user.username : "",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// 编辑调查问卷
router.post("/update/:id", requireAuth, async (req, res) => {
  const surveyId = req.params.id;
  const { title, description, startTime, endTime, questions } = req.body;
  console.log(req.body)
  try {
      // 查找要更新的调查问卷
      const survey = await Survey.findById(surveyId);
      if (!survey) {
          return res.status(404).json({ error: "Survey not found" });
      }

      // 更新调查问卷信息
      survey.title = title;
      survey.description = description;
      survey.startTime = startTime;
      survey.endTime = endTime;
      const parsedQuestions = JSON.parse(questions);
      // 更新或创建问题
      const updatedQuestions = await Promise.all(parsedQuestions.map(async (q) => {
          let question;
          if (q._id) {
              // 如果问题存在，则更新它
              question = await Question.findByIdAndUpdate(q._id, q, { new: true });
          } else {
              // 如果问题不存在，则创建它
              question = await Question.create(q);
          }
          return question._id;
      }));

      // 更新调查问卷的问题数组
      survey.questions = updatedQuestions;

      // 保存更新后的调查问卷
      await survey.save();
      res.redirect('/survey/manage')
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// 获取调查问卷列表
router.get("/list", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // 每页显示的调查问卷数量
    const perPage = 3;
    // 从数据库中获取调查问卷列表
    const surveyList = await Survey.find().skip((page - 1) * perPage)
    .limit(perPage);
    const totalSurveys = await Survey.countDocuments();
    // 计算总页数
    const totalPages = Math.ceil(totalSurveys / perPage);
    // 渲染页面并将调查问卷列表传递给模板引擎
    res.render("page/list", {
      title: "Surveys",
      SurveyList:surveyList,
      username: req.user? req.user.username:"",
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    // 错误处理
    next(error);
  }
});

// 管理调查问卷
router.get("/manage", requireAuth, async (req, res, next) => {
  try {
    // 获取当前页码，默认为1
    const page = parseInt(req.query.page) || 1;
    // 每页显示的调查问卷数量
    const perPage = 10;

    // 查询数据库中当前用户创建的调查问卷，跳过前 (page - 1) * perPage 条，限制返回 perPage 条
    const surveyList = await Survey.find({ creator: req.user.id })
                                   .skip((page - 1) * perPage)
                                   .limit(perPage);
    // 获取总调查问卷数量
    const totalSurveys = await Survey.countDocuments({ creator: req.user.id });

    // 计算总页数
    const totalPages = Math.ceil(totalSurveys / perPage);

    // 渲染页面并将调查问卷列表和分页信息传递给模板引擎
    res.render("page/manageList", {
      title: "Surveys",
      username: req.user.username,
      SurveyList: surveyList,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    // 错误处理
    next(error);
  }
});

router.get("/result/:id", async (req, res, next) => {
});

// 获取单个调查问卷
router.get("/take/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    // 使用 populate 方法来获取与调查问卷关联的问题
    // .populate('questions') 是 Mongoose 中的一种方法，用于填充引用字段的关联文档。在这个上下文中，
    // 'questions' 是指 surveySchema 中的字段，它是一个数组，包含了与问题（questions）模式关联的对象ID。
    // 当你调用 .populate('questions') 时，Mongoose 将会替换调查问卷（Survey）记录中的问题ID（保存在 'questions' 字段中）为对应的问题对象。
    // 这样，你就可以在调查问卷对象中直接访问问题对象，而不仅仅是它们的ID。
    const survey = await Survey.findById(id).populate('questions').exec();
    if (!survey) {
      // 如果找不到相应ID的调查问卷
      return res.status(404).send("Survey not found");
    }
    
    // 显示编辑视图
    res.render("page/takeSurvey", {username: req.user ? req.user.username : "",
      title: "Take Survey",
      survey: survey,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

// 提交调查问卷答案
router.post('/take/:id', async (req, res) => {
  try {
      const userId = req.user ? req.user._id : null
      const surveyId = req.params.id;
      const responses = req.body;
      console.log(responses, typeof responses);

      // 创建新的答案对象数组
      const newAnswers = [];

      // 遍历每个问题的回答，并将其添加到新答案对象数组中
      for (const questionId in responses) {
        //将遍历到的questionID与response中的对应上
          if (questionId in responses) {
              const answer = responses[questionId];
              const newAnswer = new Answer({
                  userId,
                  questionId, // 使用问题的 ID
                  surveyId, // 使用调查问卷的 ID
                  answer,
              });
              newAnswers.push(newAnswer); // 添加新的答案对象到数组中
          }
      }

      // 将答案存储到数据库中
      await Answer.insertMany(newAnswers);
      res.redirect('/survey/list')
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 删除调查问卷
// 删除调查问卷以及关联的问题和答案
router.get('/delete/:id', requireAuth, async (req, res) => {
  try {
    const surveyId = req.params.id;

    // 查找并删除调查问卷
    const deletedSurvey = await Survey.findByIdAndDelete(surveyId);
    
    if (!deletedSurvey) {
      return res.status(404).json({ success: false, message: 'Survey not found' });
    }

    // 找到与调查问卷关联的问题并删除
    const deletedQuestions = await Question.deleteMany({ _id: { $in: deletedSurvey.questions } });

    // 删除与调查问卷关联的答案
    await Answer.deleteMany({ surveyId });

    res.redirect('/survey/manage');
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



module.exports = router;
