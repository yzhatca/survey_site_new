const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    qType: { type: String, enum: ['multiple_choice', 'short_answers'], required: true },
    qText: { type: String, required: true },
    options: [{ type: String }]
});

const answerSchema = new Schema({
    // userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true },
    answer: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

const surveySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: 'User' },
    createTime: { type: Date, default: Date.now },
    startTime: { type: Date },
    endTime: { type: Date },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }] // 关联问题
});

module.exports = {
    Question: mongoose.model('Question', questionSchema),
    Answer: mongoose.model('Answer', answerSchema),
    Survey: mongoose.model('Survey', surveySchema)
};