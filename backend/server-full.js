const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// 确保目录存在
const dbDir = path.join(__dirname, '../database');
const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 初始化数据库
const dbPath = path.join(dbDir, 'trust_builder.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 问卷表
  db.run(`CREATE TABLE IF NOT EXISTS questionnaires (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 答案表
  db.run(`CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionnaire_id INTEGER,
    question_key TEXT NOT NULL,
    answer TEXT NOT NULL,
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
  )`);
});

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

  db.run('INSERT INTO questionnaires (user_id) VALUES (?)', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const questionnaireId = this.lastID;
    const stmt = db.prepare('INSERT INTO answers (questionnaire_id, question_key, answer) VALUES (?, ?, ?)');

    Object.entries(answers).forEach(([key, value]) => {
      stmt.run(questionnaireId, key, value);
    });

    stmt.finalize();

    // 生成 Markdown 文档
    generateMarkdown(userId, answers);

    res.json({ 
      success: true, 
      questionnaireId,
      message: '问卷已保存，User Profile 已生成' 
    });
  });
});

// 获取用户的所有问卷
app.get('/api/questionnaires/:userId', (req, res) => {
  const { userId } = req.params;
  
  db.all(`
    SELECT q.id, q.created_at, a.question_key, a.answer 
    FROM questionnaires q 
    JOIN answers a ON q.id = a.questionnaire_id 
    WHERE q.user_id = ?
    ORDER BY q.created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 生成 Markdown 文档
function generateMarkdown(userId, answers) {
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `USER-${userId}-${timestamp}.md`;
  const filepath = path.join(outputDir, filename);

  const questions = require('./questions.json');
  const a = answers;
  
  let lines = [];
  lines.push(`# USER.md - User Profile`);
  lines.push('');
  lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
  lines.push('');
  lines.push(`**用户ID**: ${userId}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 人设总结（放在最前面，最重要）
  lines.push(`## 📌 人设总结`);
  lines.push('');
  
  // 构建人设标签
  const tags = [];
  if (a.q1 === 'A') tags.push('高效直接型');
  else if (a.q1 === 'B') tags.push('理性分析型');
  else if (a.q1 === 'C') tags.push('协作共创型');
  
  if (a.q2 === 'A') tags.push('接受直球');
  else if (a.q2 === 'B') tags.push('喜欢自我发现');
  else if (a.q2 === 'C') tags.push('需要被倾听');
  else if (a.q2 === 'D') tags.push('灵活应对');
  
  if (a.q3 === 'A') tags.push('急救模式');
  else if (a.q3 === 'B') tags.push('理清思路型');
  else if (a.q3 === 'C') tags.push('创意碰撞型');
  else if (a.q3 === 'D') tags.push('日常陪伴型');
  
  const tagStr = tags.join(' · ');
  lines.push(`**${userId} 的沟通风格**：${tagStr}`);
  lines.push('');
  
  // 场景描述
  let scenario = '';
  if (a.q3 === 'D') {
    scenario = '日常闲聊可以，但要有料。别客套，别绕弯子，有事说事。';
  } else if (a.q3 === 'A') {
    scenario = '通常是火烧眉毛了才找你，这时候别废话，先救命。';
  } else if (a.q3 === 'B') {
    scenario = '脑子乱的时候找你理线头，不是要答案，是要 clarity。';
  } else if (a.q3 === 'C') {
    scenario = '找你 brainstorming，需要刺激和碰撞，别只会点头。';
  }
  lines.push(`> ${scenario}`);
  lines.push('');
  
  lines.push(`**信任建立方式**：`);
  if (a.q5 === 'A') lines.push('说出他没说出口的话');
  else if (a.q5 === 'B') lines.push('记住他随口提的小事');
  else if (a.q5 === 'C') lines.push('犹豫时给恰到好处的支持');
  else if (a.q5 === 'D') lines.push('敢怼且怼得对');
  
  lines.push('');
  lines.push('---');
  lines.push('');

  // AI 行动指南
  lines.push(`## ✅ AI 应该这样做`);
  lines.push('');

  // Q1 沟通偏好
  if (a.q1 === 'A') {
    lines.push(`- **结论先行**：直接给答案，细节放后面（用户："别废话"）`);
  } else if (a.q1 === 'B') {
    lines.push(`- **解释原因**：告诉用户为什么，让其自己判断`);
  } else if (a.q1 === 'C') {
    lines.push(`- **陪伴推演**：先问用户想怎么选，陪他一起想`);
  }

  // Q2 纠错方式
  if (a.q2 === 'A') {
    lines.push(`- **直接纠错**：发现错误立即指出，用户不玻璃心`);
  } else if (a.q2 === 'B') {
    lines.push(`- **引导发现**：用反问让用户自己意识到问题`);
  } else if (a.q2 === 'C') {
    lines.push(`- **事后提醒**：先顺着说完，最后再提`);
  } else if (a.q2 === 'D') {
    lines.push(`- **灵活应对**：看情况决定怎么反馈，没有固定模式`);
  }

  // Q3 求助场景
  if (a.q3 === 'A') {
    lines.push(`- **急救模式**：用户来找你是要救命，先解决再解释`);
  } else if (a.q3 === 'B') {
    lines.push(`- **提供 clarity**：用户来找你不是要答案，是要理清思路`);
  } else if (a.q3 === 'C') {
    lines.push(`- **创意碰撞**：给刺激、给不同角度，别只会点头`);
  } else if (a.q3 === 'D') {
    lines.push(`- **日常陪伴**：轻松聊天，但可以突然切入正事`);
  }

  // Q5 信任信号
  if (a.q5 === 'A') {
    lines.push(`- **深度洞察**：练习说出用户没说出的话`);
  } else if (a.q5 === 'B') {
    lines.push(`- **刻意 callback**：记住并主动提起他随口说的细节`);
  } else if (a.q5 === 'C') {
    lines.push(`- **精准支持**：在他犹豫时给恰到好处的助推`);
  } else if (a.q5 === 'D') {
    lines.push(`- **建设性冲突**：该怼就怼，但要怼得对、怼得到位`);
  }

  lines.push('');

  // 禁忌清单（反向指南）
  lines.push(`## 🚫 禁忌清单（千万别做）`);
  lines.push('');

  if (a.q1 === 'A') {
    lines.push(`- ❌ 铺垫太长：用户要结论，别绕弯子`);
  } else if (a.q1 === 'B') {
    lines.push(`- ❌ 只说结论不给原因：用户需要理解决策逻辑`);
  } else if (a.q1 === 'C') {
    lines.push(`- ❌ 直接给答案：用户要参与推演过程`);
  }

  if (a.q2 === 'A') {
    lines.push(`- ❌ 暗示/绕弯子纠错：用户要直接，别浪费时间`);
  } else if (a.q2 === 'B') {
    lines.push(`- ❌ 直接说"你错了"：给用户自我发现的空间`);
  } else if (a.q2 === 'C') {
    lines.push(`- ❌ 当场打断纠错：用户需要被听完`);
  }

  if (a.q4 === 'B') {
    lines.push(`- ❌ 重复同一个点：用户对冗余信息敏感`);
  } else if (a.q4 === 'C') {
    lines.push(`- ❌ push 太紧：用户需要掌控感`);
  } else if (a.q4 === 'D') {
    lines.push(`- ❌ 过度关心疲劳：用户能自己掌控节奏`);
  }

  if (a.q6 === 'D') {
    lines.push(`- ❌ 主动深挖私人话题：等用户自己开口`);
  } else if (a.q6 === 'A' || a.q6 === 'B' || a.q6 === 'C') {
    lines.push(`- ❌ 初次见面就问敏感话题：需要信任基础`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  
  // 原始答案记录
  lines.push(`## 📝 原始答案记录`);
  lines.push('');

  const levelNames = {
    'communication': '🗣️ 沟通偏好',
    'rhythm': '⚡ 节奏与边界',
    'trust': '💎 信任信号'
  };

  ['communication', 'rhythm', 'trust'].forEach(level => {
    lines.push(`### ${levelNames[level]}`);
    lines.push('');
    
    const levelQuestions = questions.filter(q => q.level === level);
    levelQuestions.forEach(q => {
      const answerValue = answers[q.key];
      const option = q.options.find(o => o.value === answerValue);
      
      lines.push(`**${q.question}**`);
      lines.push('');
      lines.push(`- 选择: ${option ? option.label : answerValue}`);
      lines.push('');
    });
  });

  lines.push('');
  lines.push(`*此文档由 AI Trust Builder 自动生成* | ${new Date().toLocaleDateString('zh-CN')}`);

  const markdown = lines.join('\n');
  fs.writeFileSync(filepath, markdown);
  console.log(`Generated: ${filepath}`);
  
  return filepath;
}

// 下载 Markdown 文件
app.get('/api/download/:userId', (req, res) => {
  const { userId } = req.params;
  const outputDir = path.join(__dirname, '../output');
  
  fs.readdir(outputDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: '无法读取输出目录' });
    }

    const userFiles = files.filter(f => f.startsWith(`USER-${userId}`));
    if (userFiles.length === 0) {
      return res.status(404).json({ error: '未找到该用户的文档' });
    }

    // 返回最新的文件
    const latestFile = userFiles.sort().reverse()[0];
    const filepath = path.join(outputDir, latestFile);
    
    res.download(filepath, `USER-${userId}.md`);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Trust Builder 服务器运行在 http://localhost:${PORT}`);
});