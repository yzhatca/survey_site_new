const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const User = require("../models/user"); // Update the path accordingly
const questionSchema = new Schema({
  qType: {
    type: String,
    enum: ["multiple_choice", "short_answers"],
    required: true,
  }, // Type of question: multiple choice or short answers
  qText: { type: String, required: true }, // Question text
  options: [{ type: String }], // Array of options for multiple-choice questions
});

const answerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null }, // User who answered the question
  questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true }, // Question ID
  surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true }, // Survey ID
  answer: { type: Schema.Types.Mixed }, // Answer provided by the user
  createdAt: { type: Date, default: Date.now }, // Timestamp of when the answer was created
});

const surveySchema = new Schema({
  title: { type: String, required: true }, // Survey title
  description: { type: String, required: true }, // Survey description
  creator: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Creator of the survey
  createTime: { type: Date, default: Date.now }, // Timestamp of when the survey was created
  endTime: { type: Date }, // End time of the survey
  questions: [{ type: Schema.Types.ObjectId, ref: "Question" }], // Array of question IDs associated with the survey
});

module.exports = {
  Question: mongoose.model("Question", questionSchema), // Export Question model
  Answer: mongoose.model("Answer", answerSchema), // Export Answer model
  Survey: mongoose.model("Survey", surveySchema), // Export Survey model
};
