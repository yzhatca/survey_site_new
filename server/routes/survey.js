// survey.js controls operations related to surveys
const express = require("express");
const router = express.Router();
const { Survey, Question, Answer } = require("../models/survey");
const passport = require("passport");

// Middleware for login authentication
function requireAuth(req, res, next) {
  // Check if the user is logged in
  if (!req.isAuthenticated()) {
    return res.redirect("/users/login");
  }
  next();
}

// Route to add a new survey
router.get("/add", requireAuth, (req, res, next) => {
  // Redirect to the addSurvey.ejs page in the page directory
  res.render("page/add", {
    title: "Add Survey",
    username: req.user ? req.user.username : "",
  });
});

// Route to handle adding a new survey
router.post("/add", requireAuth, async (req, res) => {
  try {
    // Parse received data
    const { title, description, endTime, questions } = req.body;

    const userId = req.user._id;

    // Parse the string-type questions into an array of objects
    const parsedQuestions = JSON.parse(questions);

    // Create an array of question objects
    const questionIds = await Promise.all(
      parsedQuestions.map(async (q) => {
        const question = new Question({
          qType: q.qType,
          qText: q.qText,
          options: q.options || [],
        });
        await question.save();
        return question._id;
      })
    );

    // Create a survey object
    const survey = new Survey({
      creator: userId,
      title,
      description,
      endTime: new Date(endTime),
      questions: questionIds,
    });

    // Save the survey object to the database
    await survey.save();

    // Redirect with success message
    res.redirect("/survey/manage");
  } catch (err) {
    // Return error message if an error occurs
    console.error("Error adding survey:", err);
    next(err);
  }
});

// Route to update a survey
router.get("/update/:id", requireAuth, async (req, res, next) => {
  try {
    const id = req.params.id;

    // Use populate method to get associated questions with the survey
    const survey = await Survey.findById(id).populate("questions").exec();
    if (!survey) {
      return res.status(404).send("Survey not found");
    }

    res.render("page/edit", {
      title: "Edit Survey",
      survey: survey,
      username: req.user ? req.user.username : "",
    });
  } catch (err) {
    console.error("Updating survey, getting survey list error", err);
    next(err);
  }
});

// Route to edit a survey
router.post("/update/:id", requireAuth, async (req, res, next) => {
  const surveyId = req.params.id;
  const { title, description, endTime, questions } = req.body;
  try {
    // Find the survey to update
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: "Survey not found" });
    }

    // Update survey information
    survey.title = title;
    survey.description = description;
    survey.endTime = endTime;

    // Parse the questions array in the request into objects array
    const parsedQuestions = JSON.parse(questions);

    // Update or create questions
    await Promise.all(
      parsedQuestions.map(async (q) => {
        if (!q.qid) {
          const newQuestion = await Question.create(q);
          survey.questions.push(newQuestion._id);
        } else {
          let existingQuestion = survey.questions.find(
            (questionId) => questionId.toString() === q.qid.toString()
          );

          if (!existingQuestion) {
            const newQuestion = await Question.create(q);
            survey.questions.push(newQuestion._id);
          } else {
            await Question.findByIdAndUpdate(existingQuestion, q);
          }
        }
      })
    );

    // Save the updated survey
    await survey.save();
    res.redirect("/survey/manage");
  } catch (err) {
    console.error("Updating survey error", err);
    next(err);
  }
});

// Route to get the list of surveys
router.get("/list", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;
    const surveyList = await Survey.find()
      .skip((page - 1) * perPage)
      .limit(perPage);
    const totalSurveys = await Survey.countDocuments();
    const totalPages = Math.ceil(totalSurveys / perPage);
    res.render("page/list", {
      title: "Surveys",
      SurveyList: surveyList,
      username: req.user ? req.user.username : "",
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (err) {
    console.error("Getting survey list error", err);
    next(err);
  }
});

// Route to view survey results
router.get("/result/:id", requireAuth, (req, res) => {
  req.session.surveyId = req.params.id;
  res.render("page/results", { username: req.user ? req.user.username : "" });
});

// Route to get answers via API
router.get("/api/answers", requireAuth, async (req, res, next) => {
  try {
    const surveyId = req.session.surveyId;
    if (!surveyId) {
      return res.status(400).json({ message: "Survey ID not provided" });
    }
    const survey = await Survey.findById(surveyId).populate("questions");
    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }
    const multipleChoiceQuestions = survey.questions.filter(
      (question) => question.qType === "multiple_choice"
    );
    const questionAnswers = {};
    for (const question of multipleChoiceQuestions) {
      const answers = await Answer.find({
        surveyId: surveyId,
        questionId: question._id,
      });
      questionAnswers[question._id] = answers.map((answer) => answer.answer);
    }
    const filteredQuestions = multipleChoiceQuestions.map((question) => ({
      _id: question._id,
      text: question.qText,
      options: question.options,
    }));
    res.json({
      questionAnswers: questionAnswers,
      questions: filteredQuestions,
      username: req.user ? req.user.username : "",
      id: surveyId,
    });
  } catch (err) {
    console.error("API Getting survey list error", err);
    next(err);
  }
});

// Route to manage surveys
router.get("/manage", requireAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 3;
    const surveyList = await Survey.find({ creator: req.user.id })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("questions");
    const totalSurveys = await Survey.countDocuments({ creator: req.user.id });
    const totalPages = Math.ceil(totalSurveys / perPage);
    res.render("page/managelist", {
      title: "Surveys",
      username: req.user.username,
      SurveyList: surveyList,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (err) {
    console.log("managing survey list error", err);
    next(err);
  }
});

// Route to take a survey
router.get("/take/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const survey = await Survey.findById(id).populate("questions").exec();
    if (!survey) {
      return res.status(404).send("Survey not found");
    }
    res.render("page/takeSurvey", {
      username: req.user ? req.user.username : "",
      title: "Take Survey",
      survey: survey,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Route to submit survey answers
router.post("/take/:id", async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const surveyId = req.params.id;
    const responses = req.body;
    const newAnswers = [];
    for (const questionId in responses) {
      if (questionId in responses) {
        const answer = responses[questionId];
        const newAnswer = new Answer({
          userId,
          questionId,
          surveyId,
          answer,
        });
        newAnswers.push(newAnswer);
      }
    }
    await Answer.insertMany(newAnswers);
    res.redirect("/survey/list");
  } catch (err) {
    console.error("Updating survey, getting survey list error", err);
    next(err);
  }
});

// Route to delete a survey along with its associated questions and answers
router.get("/delete/:id", requireAuth, async (req, res, next) => {
  try {
    const surveyId = req.params.id;
    const deletedSurvey = await Survey.findByIdAndDelete(surveyId);
    if (!deletedSurvey) {
      return res
        .status(404)
        .json({ success: false, message: "Survey not found" });
    }
    await Question.deleteMany({ _id: { $in: deletedSurvey.questions } });
    await Answer.deleteMany({ surveyId });
    res.redirect("/survey/manage");
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.render("error", { message: err });
});

// 404 error handling middleware
router.use((req, res) => {
  res.render("error", { message: "Not Found" });
});

module.exports = router;
