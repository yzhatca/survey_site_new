// 引入所需的模块
let mongoose = require("mongoose");
// let passportLocalMongoose = require("passport-local-mongoose");

// 定义用户模式
let userSchema = new mongoose.Schema({
    username: { type: String, required: true }, // 用户名
    password: { type: String, required: true }, // 密码
    email: { type: String, required: true }, // 邮箱
    displayName: { type: String }, // 显示名
    userType: { type: String }, // 用户类型
    created: { type: Date, default: Date.now } // 创建时间
});

// 通过 passport-local-mongoose 插件来处理用户认证相关功能
// userSchema.plugin(passportLocalMongoose);

// 创建用户模型
module.exports = mongoose.model('User', userSchema);
