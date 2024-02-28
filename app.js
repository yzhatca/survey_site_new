// 引入需要的模块
var createError = require('http-errors'); // 用于创建 HTTP 错误对象的模块
var express = require('express'); // Express 框架
var path = require('path'); // Node.js 提供的路径处理模块
var cookieParser = require('cookie-parser'); // 解析 Cookie 的中间件
var logger = require('morgan'); // 日志记录中间件

// 引入路由模块
var indexRouter = require('./server/routes/index'); // 主页路由
var usersRouter = require('./server/routes/users'); // 用户路由
var surveyRouter = require('./server/routes/survey'); // 调查路由
var app = express(); // 创建 Express 应用程序实例

// 设置视图引擎和视图文件夹路径
app.set('views', path.join(__dirname, 'server', 'views')); // 设置视图文件夹路径为当前目录下server下的 views 文件夹

app.set('view engine', 'ejs'); // 设置视图引擎为 EJS

app.use(logger('dev')); // 使用开发环境的日志记录中间件     日志example：GET / 200 7.231 ms - 42 GET /stylesheets/style.css 304 2.419 ms - -

app.use(express.json()); // 解析 JSON 格式的请求体
app.use(express.urlencoded({ extended: false })); // 解析 URL 编码的请求体
app.use(cookieParser()); // 使用 Cookie 解析中间件
app.use(express.static(path.join(__dirname, 'public'))); // 设置静态文件目录为当前目录下的 public 文件夹

// 使用各个路由模块
app.use('/', indexRouter); // 使用主页路由
app.use('/users', usersRouter); // 使用用户路由
app.use('/survey', surveyRouter); // 使用调查路由

// 数据库设置
let mongoose = require('mongoose'); // 引入 Mongoose 模块
let DB = require('./server/config/db'); // 引入数据库配置文件

// 将 Mongoose 指向数据库 URI
// 通过 Mongoose 连接到本地 MongoDB 数据库
mongoose.connect(DB.URI)
    .then(() => {
        console.log('MongoDB 连接成功');
    })
    .catch((error) => {
        console.error('MongoDB 连接失败:', error);
    });


// 捕获 404 错误并转发至错误处理器
app.use(function(req, res, next) {
  next(createError(404)); // 创建 404 错误并传递给下一个中间件
});

// 错误处理器
app.use(function(err, req, res, next) {
  // 设置本地变量，只在开发环境中提供错误信息
  res.locals.message = err.message; // 错误消息
  res.locals.error = req.app.get('env') === 'development' ? err : {}; // 开发环境下提供详细的错误信息

  // 渲染错误页面
  res.status(err.status || 500); // 设置响应状态码为错误状态码或默认的 500
  res.render('error'); // 渲染 error.ejs 视图
});

module.exports = app; // 导出 Express 应用程序实例
