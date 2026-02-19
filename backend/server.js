const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 内存存储（Render 免费版兼容）
const questionnaires = [];
let nextId = 1;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 静态文件服务 - 显式设置 MIME 类型
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// API 路由

// 获取问卷问题
app.get('/api/questions', (req, res) => {
  const questions = require('./questions.json');
  res.json(questions);
});

// 提交问卷
app.post('/api/submit', (req, res) => {
  const { userId, answers } = req.body;
  
  if (!userId || !answers) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const questionnaireId = nextId++;
  questionnaires.push({
    id: questionnaireId,
    user_id: userId,
    answers: answers,
    created_at: new Date().toISOString()
  });

  console.log(`问卷已保存: ${userId}, ID: ${questionnaireId}`);

  res.json({ 
    success: true, 
    questionnaireId,
    message: '问卷已保存，User Profile 已生成' 
  });
});

// 获取用户的所有问卷
app.get('/api/questionnaires/:userId', (req, res) => {
  const { userId } = req.params;
  const userQuestionnaires = questionnaires.filter(q => q.user_id === userId);
  
  // 转换成和原来一样的格式
  const result = [];
  userQuestionnaires.forEach(q => {
    Object.entries(q.answers).forEach(([key, value]) => {
      result.push({
        id: q.id,
        created_at: q.created_at,
        question_key: key,
        answer: value
      });
    });
  });
  
  res.json(result);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI Trust Builder 服务器运行在端口 ${PORT}`);
  console.log(`📊 已存储问卷数: ${questionnaires.length}`);
});

module.exports = app;