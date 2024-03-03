let express = require("express");
let passport = require("passport");



//Create a reference to the model
let Survey = require("../models/survey");

module.exports.displaySurveyList = (req, res, next) => {
  Survey.find((err, surveyList) => {
    if (err) {
      return console.error(err);
    } else {
      //res.render survey/list and send to it title, SurveyList, displayName, userType, and username
      res.render("survey/list", {
        title: "Surveys",
        SurveyList: surveyList,
        displayName: req.user ? req.user.displayName : "",
        userType: req.user ? req.user.userType : "",
        username: req.user ? req.user.username : "",
      });
    }
  }).sort({
    name: 1,
  });
};

module.exports.displayAddPage = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
      return res.render("survey/add", {
        title: "Add Survey",
        displayName: req.user ? req.user.displayName : "",
      })});
};

module.exports.processAddPage = (req, res, next) => {
  //MongoDB stores dates and times in ISO format, for example, 2022-12-07T05:00:00.000+00:00
  //Breakdown of the format: yyyy-mm-ddThh:mm:ss.sss+00:00
  //T is a time delimiter
  //sss is for milliseconds
  //+00:00 denotes the time zone as UTC
  //MongoDB by default stores dates and times in UTC and will output dates and times relative to UTC
  //For the example given above, the output will look like the following: Wed Dec 07 2022 00:00:00 GMT-0500 (Eastern Standard Time)

  //date variable stores the survey's expiration date in a new Date object (which have built-in methods for time and date manipulations)
  date = new Date(req.body.endDate);

  //.getTime() returns the survey's expiration date in number of milliseconds since January 1, 1970 UTC
  //.getTimezoneOffset() returns the difference between UTC and the local time in minutes (positive for for those behind UTC, negative for those ahead of UTC)
  //240 mintes (4 hours) during daylight saving time
  //300 minutes (5 hours) during standard time (i.e., not daylight saving time)
  //.getTimezoneOffset() * 60 seconds * 1000 milliseconds to convert UTC to EDT or EST (in milliseconds since January 1, 1970 UTC)
  date = date.getTime() + date.getTimezoneOffset() * 60 * 1000;

  //Create newSurvey object
  let newSurvey = Survey({
    surveyType: req.body.optSurveyType,
    surveyCreator: req.user.displayName,
    title: req.body.title,
    description: req.body.description,
    endDate: date, //Write the converted time and date to the MongoDB cloud
    q1: req.body.q1,
    q1Opt1: req.body.q1Opt1,
    q1Opt2: req.body.q1Opt2,
    q1Opt3: req.body.q1Opt3,
    q1Opt4: req.body.q1Opt4,
  });

  Survey.create(newSurvey, (err, Survey) => {
    if (err) {
      console.log(err);
      res.end(err);
    } else {
      //Refresh the survey list
      res.redirect("/survey-list");
    }
  });
};

module.exports.displayAddShortAnswersPage = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (req.user.userType == "Survey Taker") {
      req.flash(
        "VerificationMessage",
        "Verification Error, This user cannot create a survey!"
      );
      return res.redirect("/");
    }
    if (req.user.userType == "Survey Creator") {
      res.render("survey/addShortAnswers", {
        title: "Add Survey",
        displayName: req.user ? req.user.displayName : "",
      });
    }
  })(req, res, next);
};

module.exports.processAddShortAnswersPage = (req, res, next) => {
  date = new Date(req.body.endDate);

  date = date.getTime() + date.getTimezoneOffset() * 60 * 1000;

  //Create newShortAnswerSurvey object
  let newShortAnswerSurvey = ShortAnswerSurvey({
    surveyType: req.body.optSurveyType,
    surveyCreator: req.user.displayName,
    title: req.body.title,
    description: req.body.description,
    endDate: date,
    q1: req.body.q1,
  });

  ShortAnswerSurvey.create(newShortAnswerSurvey, (err, ShortAnswerSurvey) => {
    if (err) {
      console.log(err);
      res.end(err);
    } else {
      //Refresh the survey list
      res.redirect("/survey-list");
    }
  });
};

module.exports.displayEditSurveyPage = (req, res, next) => {
  let id = req.params.id;

  Survey.findById(id, (err, surveyToEdit) => {
    if (err) {
      console.log(err);
      res.end(err);
    } else {
      //Show the edit view
      res.render("survey/edit", {
        title: "Edit Survey",
        survey: surveyToEdit,
        displayName: req.user ? req.user.displayName : "",
        surveyType: surveyToEdit.surveyType,
      });
    }
  });
};

module.exports.processEditSurveyPage = (req, res, next) => {
  let id = req.params.id;

  date = new Date(req.body.endDate);
  date = date.getTime() + date.getTimezoneOffset() * 60 * 1000;

  let updatedSurvey = Survey({
    _id: id,
    title: req.body.title,
    description: req.body.description,
    endDate: date,
    q1: req.body.q1,
    q1Opt1: req.body.q1Opt1,
    q1Opt2: req.body.q1Opt2,
    q1Opt3: req.body.q1Opt3,
    q1Opt4: req.body.q1Opt4,
  });

  //Search for _id
  Survey.updateOne(
    {
      _id: id,
    },
    updatedSurvey,
    (err) => {
      if (err) {
        console.log(err);
        res.end(err);
      } else {
        res.redirect("/survey-list");
      }
    }
  );
};

module.exports.performDelete = (req, res, next) => {
  let id = req.params.id;

  Survey.remove(
    {
      _id: id,
    },
    (err) => {
      if (err) {
        console.log(err);
        res.end(err);
      } else {
        res.redirect("/survey-list");
      }
    }
  );
};

module.exports.displayTakeSurveyPage = (req, res, next) => {
  let id = req.params.id;

  Survey.findById(id, (err, surveyToTake) => {
    if (err) {
      console.log(err);
      res.end(err);
    } else {
      //Show the edit view
      res.render("survey/takeSurvey", {
        title: "Take Survey",
        survey: surveyToTake,
        displayName: req.user ? req.user.displayName : "",
      });
    }
  });
};

module.exports.processTakeSurveyPage = (req, res, next) => {
  let newCompletedSurvey = CompletedSurvey({});

  if (req.body.surveyType == "Multiple Choice") {
    newCompletedSurvey = CompletedSurvey({
      surveyType: req.body.surveyType,
      title: req.body.surveyTitle,
      userName: req.body.userName,
      q1: req.body.question,
      answer: req.body.optQ1,
    });
  } else if (req.body.surveyType == "Short Answers") {
    newCompletedSurvey = CompletedSurvey({
      surveyType: req.body.surveyType,
      title: req.body.surveyTitle,
      userName: req.body.userName,
      q1: req.body.question,
      answer: req.body.txtResponse,
    });
  }

  CompletedSurvey.create(newCompletedSurvey, (err, CompletedSurvey) => {
    if (err) {
      console.log(err);
      res.end(err);
    } else {
      //Refresh the survey list
      res.redirect("/survey-list");
    }
  });
};

//display survey results page
module.exports.displaySurveyResultsPage = (req, res, next) => {
  let id = req.params.id;
  let title = req.params.title;

  Survey.find({ title: title }, (err, optionList) => {
    if (err) {
      console.log(err);
      res.end(err);
    } else {
      if (optionList[0].surveyType == "Multiple Choice") {
        CompletedSurvey.find({ title: title }, (err, completedSurveyList) => {
          if (err) {
            console.log(err);
            res.end(err);
          } else {
            let op1List = 0;
            let op2List = 0;
            let op3List = 0;
            let op4List = 0;
            let sum = 0;

            for (let j = 0; j < completedSurveyList.length; j++) {
              if (optionList[0].q1Opt1 == completedSurveyList[j].answer) {
                console.log(completedSurveyList[j].answer);
                op1List++;
              } else if (
                optionList[0].q1Opt2 == completedSurveyList[j].answer
              ) {
                op2List++;
              } else if (
                optionList[0].q1Opt3 == completedSurveyList[j].answer
              ) {
                op3List++;
              } else if (
                optionList[0].q1Opt4 == completedSurveyList[j].answer
              ) {
                op4List++;
              }
            }
            sum = op1List + op2List + op3List + op4List;
            let per1,per2,per3,per4 =0;
            per1 = op1List/sum;
            per1 = Math.round(per1 * 100);
            console.log(per1)
            per2 = op2List/sum;
            per2 = Math.round(per2 * 100);
            per3 = op3List/sum;
            per3 = Math.round(per3 * 100);
            per4 = op4List/sum;
            per4 = Math.round(per4 * 100);
            res.render("survey/results", {
              title: "Multipe Choice Results",
              CompletedSurveyList: completedSurveyList,
              optionList: optionList,
              per1: per1,
              per2: per2,
              per3: per3,
              per4: per4,
              sum: sum,
            });
          }
        });
      } else {
        CompletedSurvey.find({ title: title }, (err, completedSurveyList) => {
          //CompletedSurvey.find({"userName" : req.user.username}, (err, completedSurveyList) => {
          if (err) {
            console.log(err);
            res.end(err);
          } else {
            //Show the results page
            //console.log(completedSurveyList);
            res.render("survey/results", {
              title: "Short Answers Results",
              CompletedSurveyList: completedSurveyList,
            });
          }
        });
      }
    }
  });
};
