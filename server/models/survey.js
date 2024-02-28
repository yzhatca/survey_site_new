const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const questionSchema = new Schema({
    type: { type: String, enum: ['multiple_choice', 'text'], required: true }, // 题目类型：单选、文字回答
    questionText: { type: String, required: true }, // 题目内容
    options: [{ type: String }] // 选项（仅适用于单选题）
});

const answerSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // 用户ID
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true }, // 调查问卷ID
    responses: [{
        questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true }, // 问题ID
        answer: { type: Schema.Types.Mixed } // 用户的回答，可以是字符串、数组等类型
    }],
    createdAt: { type: Date, default: Date.now } // 回答创建时间
});

const surveySchema = new Schema({
    title: { type: String, required: true }, // 调查问卷标题
    description: { type: String }, // 调查问卷描述
    questions: [questionSchema], // 题目列表
    creator: { type: Schema.Types.ObjectId, ref: 'User' }, // 创建人（用户 ID）
    createTime: { type: Date, default: Date.now }, // 调查问卷创建时间
    startTime: { type: Date }, // 调查问卷开始时间
    endTime: { type: Date }, // 调查问卷结束时间
    answers: [answerSchema] // 存储答案的字段，每个调查问卷可以包含多个答案
});

module.exports = mongoose.model('Survey', surveySchema);
