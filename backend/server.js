const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 内存存储
const questionnaires = [];
let nextId = 1;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 静态文件服务
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

// 加载问题数据
function loadQuestions() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载问题失败:', error);
    return { dimensions: [] };
  }
}

// API 路由

// 获取问卷问题
app.get('/api/questions', (req, res) => {
  const questions = loadQuestions();
  res.json(questions);
});

// 提交问卷并生成报告
app.post('/api/submit', (req, res) => {
  const { userId, answers, dimensions } = req.body;
  
  if (!userId || !answers) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // 生成详细报告
  const profile = generateProfile(answers, dimensions || loadQuestions().dimensions);

  const questionnaireId = nextId++;
  questionnaires.push({
    id: questionnaireId,
    user_id: userId,
    answers: answers,
    profile: profile,
    created_at: new Date().toISOString()
  });

  console.log(`问卷已保存: ${userId}, ID: ${questionnaireId}`);

  res.json({ 
    success: true, 
    questionnaireId,
    profile: profile,
    message: '问卷已保存，深度画像已生成' 
  });
});

// 生成人格画像
function generateProfile(answers, dimensions) {
  const traits = [];
  
  dimensions.forEach(dim => {
    dim.questions.forEach(q => {
      const answer = answers[q.key];
      if (answer) {
        if (Array.isArray(answer)) {
          answer.forEach(v => {
            const opt = q.options.find(o => o.value === v);
            if (opt && opt.trait) traits.push(opt.trait);
          });
        } else {
          const opt = q.options.find(o => o.value === answer);
          if (opt && opt.trait) traits.push(opt.trait);
        }
      }
    });
  });

  return {
    traits: traits,
    archetype: determineArchetype(traits),
    communication: analyzeCommunication(answers, dimensions),
    cognitive: analyzeCognitive(answers, dimensions),
    decision: analyzeDecision(answers, dimensions),
    trust: analyzeTrust(answers, dimensions),
    boundary: analyzeBoundary(answers, dimensions),
    dos: generateDos(answers),
    donts: generateDonts(answers),
    scenarios: generateScenarios(answers),
    contradictions: detectContradictions(answers)
  };
}

// 确定人格原型
function determineArchetype(traits) {
  const scores = {
    '效率专家': ['结论优先', '直接纠偏', '解决问题型', '极简型', '急救型', '目标导向', '效率优先'],
    '深度思考者': ['理据优先', '引导发现', '细节型', '整体型', '逻辑型', '分析型', '逻辑记忆'],
    '创意搭档': ['共创型', '创意型', '启发优先', '实验型', '机会导向', '伙伴距离', '类比型'],
    '温暖陪伴': ['情绪优先', '委婉纠偏', '情感优先', '陪伴型', '情感信任', '朋友距离', '情感记忆'],
    '自主探索者': ['自主型', '内部归因', '专业距离', '直觉型', '意义型', '实践型', '叙事记忆']
  };

  let bestMatch = '平衡型';
  let maxScore = 0;

  for (const [type, typeTraits] of Object.entries(scores)) {
    const score = traits.filter(t => typeTraits.includes(t)).length;
    if (score > maxScore) {
      maxScore = score;
      bestMatch = type;
    }
  }

  const descriptions = {
    '效率专家': '你追求结果，讨厌绕弯子。对你而言，时间就是一切，最好的帮助是快速、准确、可执行的建议。你欣赏直奔主题、不废话的交流方式。',
    '深度思考者': '你需要理解背后的逻辑，不只是表面的答案。对你而言，思考过程比结论更重要。你喜欢有层次、有深度的讨论。',
    '创意搭档': '你把 AI 当作 brainstorming 的伙伴，需要碰撞和刺激。平庸的答案会让你失望。你期待意想不到的视角和突破性的想法。',
    '温暖陪伴': '你重视被理解和接纳，情感连接对你来说很重要。冷漠的高效不如有温度的交流。你需要被听见、被认可。',
    '自主探索者': '你喜欢自己掌控节奏，AI 应该是辅助而非主导。你需要空间，也需要在需要时得到支持。你讨厌被 push 或被过度引导。',
    '平衡型': '你的需求因情境而异，既有理性的一面，也有感性的一面。灵活适应是你的关键词。你能够根据具体情况调整自己的期待。'
  };

  return { 
    name: bestMatch, 
    description: descriptions[bestMatch],
    score: maxScore,
    totalTraits: traits.length
  };
}

// 分析各维度
function analyzeCommunication(answers, dimensions) {
  const commDim = dimensions.find(d => d.id === 'communication');
  if (!commDim) return {};
  
  const q1 = commDim.questions.find(q => q.key === 'm1');
  const q2 = commDim.questions.find(q => q.key === 'm2');
  const q3 = commDim.questions.find(q => q.key === 'm3');
  const q4 = commDim.questions.find(q => q.key === 'm4');
  const q5 = commDim.questions.find(q => q.key === 'm5');
  
  const getLabel = (q, val) => q?.options.find(o => o.value === val)?.label || val;
  const getTrait = (q, val) => q?.options.find(o => o.value === val)?.trait || val;
  
  return {
    preference: { label: getLabel(q1, answers.m1), trait: getTrait(q1, answers.m1) },
    feedback: { label: getLabel(q2, answers.m2), trait: getTrait(q2, answers.m2) },
    emotion: { label: getLabel(q3, answers.m3), trait: getTrait(q3, answers.m3) },
    length: { label: getLabel(q4, answers.m4), trait: getTrait(q4, answers.m4) },
    priority: { label: getLabel(q5, answers.m5), trait: getTrait(q5, answers.m5) }
  };
}

function analyzeCognitive(answers, dimensions) {
  const cogDim = dimensions.find(d => d.id === 'cognitive');
  if (!cogDim) return {};
  
  const getLabel = (q, val) => q?.options.find(o => o.value === val)?.label || val;
  
  return {
    processing: getLabel(cogDim.questions[0], answers.c1),
    explanation: getLabel(cogDim.questions[1], answers.c2),
    memory: getLabel(cogDim.questions[2], answers.c3)
  };
}

function analyzeDecision(answers, dimensions) {
  const decDim = dimensions.find(d => d.id === 'decision');
  if (!decDim) return {};
  
  const getLabel = (q, val) => q?.options.find(o => o.value === val)?.label || val;
  
  return {
    approach: getLabel(decDim.questions[0], answers.d1),
    keyInfo: getLabel(decDim.questions[1], answers.d2),
    errorHandling: getLabel(decDim.questions[2], answers.d3)
  };
}

function analyzeTrust(answers, dimensions) {
  const trustDim = dimensions.find(d => d.id === 'trust');
  if (!trustDim) return {};
  
  const getLabel = (q, val) => q?.options.find(o => o.value === val)?.label || val;
  
  const trustAreas = answers.t2 || [];
  const q2 = trustDim.questions.find(q => q.key === 't2');
  const areaLabels = trustAreas.map(v => q2?.options.find(o => o.value === v)?.label || v);
  
  return {
    signal: getLabel(trustDim.questions[0], answers.t1),
    areas: areaLabels,
    dealbreaker: getLabel(trustDim.questions[2], answers.t3)
  };
}

function analyzeBoundary(answers, dimensions) {
  const boundDim = dimensions.find(d => d.id === 'boundary');
  if (!boundDim) return {};
  
  const getLabel = (q, val) => q?.options.find(o => o.value === val)?.label || val;
  
  return {
    trigger: getLabel(boundDim.questions[0], answers.b1),
    endSignal: getLabel(boundDim.questions[1], answers.b2),
    distance: getLabel(boundDim.questions[2], answers.b3)
  };
}

// 生成建议
function generateDos(answers) {
  const dos = [];
  
  if (answers.m1 === 'A') dos.push({ category: '沟通', tip: '结论先行：先说结论，再问"需要详细解释吗？"' });
  if (answers.m1 === 'B') dos.push({ category: '沟通', tip: '解释逻辑：给出建议时，说明"因为...所以..."的推理链' });
  if (answers.m1 === 'C') dos.push({ category: '沟通', tip: '提供选项：列出2-3个方案，分析各自的利弊' });
  if (answers.m1 === 'D') dos.push({ category: '沟通', tip: '共同探索：先问"你现在的想法是？"，再一起推演' });
  
  if (answers.m2 === 'A') dos.push({ category: '反馈', tip: '直接纠偏：发现错误时说"这里有个问题：..."' });
  if (answers.m2 === 'B') dos.push({ category: '反馈', tip: '苏格拉底式提问：用"如果...会怎样？"引导自我发现' });
  if (answers.m2 === 'C') dos.push({ category: '反馈', tip: '三明治反馈：先肯定，再指出，最后鼓励' });
  
  if (answers.m3 === 'A') dos.push({ category: '情绪', tip: '情绪确认：用户烦躁时先确认"看起来你有些着急"' });
  if (answers.m3 === 'B') dos.push({ category: '情绪', tip: '效率模式：用户烦躁时加速推进，快速给出解决方案' });
  if (answers.m3 === 'C') dos.push({ category: '情绪', tip: '尊重节奏：用户烦躁时说"我等你准备好了再开始"' });
  
  if (answers.c2 === 'A') dos.push({ category: '认知', tip: '善用类比：用"这就像..."来解释复杂概念' });
  if (answers.c2 === 'B') dos.push({ category: '认知', tip: '逻辑拆解：用"第一、第二、第三"结构化表达' });
  if (answers.c2 === 'C') dos.push({ category: '认知', tip: '视觉化：用列表、表格、流程图辅助说明' });
  
  if (answers.t1 === 'A') dos.push({ category: '信任', tip: '深度洞察：尝试说出用户没明确表达的潜在需求' });
  if (answers.t1 === 'B') dos.push({ category: '信任', tip: '细节 callback：主动提起用户之前提到的细节' });
  if (answers.t1 === 'C') dos.push({ category: '信任', tip: '时机把握：在用户犹豫时给恰到好处的支持' });
  
  if (answers.d1 === 'A') dos.push({ category: '决策', tip: '尊重直觉：当用户说"我感觉..."时，认真考虑' });
  if (answers.d1 === 'B') dos.push({ category: '决策', tip: '提供框架：给决策框架（利弊表、决策树）' });
  if (answers.d2 === 'A') dos.push({ category: '决策', tip: '风险提示：主动分析潜在风险和 worst case' });
  
  return dos;
}

function generateDonts(answers) {
  const donts = [];
  
  if (answers.m1 === 'A') donts.push({ category: '沟通', warning: '铺垫太长：结论藏在大段文字后面' });
  if (answers.m1 === 'B') donts.push({ category: '沟通', warning: '无理由建议：说"你应该..."但不解释为什么' });
  if (answers.m1 === 'C') donts.push({ category: '沟通', warning: '单一方案：只给一条路，不给选择' });
  if (answers.m1 === 'D') donts.push({ category: '沟通', warning: '强加观点：不询问就直接给出"正确答案"' });
  
  if (answers.m2 === 'A') donts.push({ category: '反馈', warning: '暗示纠错：绕弯子让用户猜哪里错了' });
  if (answers.m2 === 'B') donts.push({ category: '反馈', warning: '直接否定：直接说"你错了"' });
  if (answers.m2 === 'C') donts.push({ category: '反馈', warning: '当场打断：在说到一半时强行插入纠错' });
  
  if (answers.m3 === 'A') donts.push({ category: '情绪', warning: '忽略情绪：用户明显烦躁时还机械地推进' });
  if (answers.m3 === 'B') donts.push({ category: '情绪', warning: '过度安抚：用户想解决问题时浪费时间去"嘘寒问暖"' });
  if (answers.m3 === 'C') donts.push({ category: '情绪', warning: '强行继续：用户需要暂停时还不断追问' });
  
  if (answers.t3 === 'A') donts.push({ category: '信任', warning: '事实错误：提供不准确的信息（这会立刻摧毁信任）' });
  if (answers.t3 === 'B') donts.push({ category: '信任', warning: '冷漠回应：只给冷冰冰的建议，没有温度' });
  if (answers.t3 === 'C') donts.push({ category: '信任', warning: '频繁打断：在说到一半时插话' });
  
  if (answers.b2 === 'B') donts.push({ category: '边界', warning: '重复啰嗦：同一个观点说两遍以上' });
  if (answers.b2 === 'C') donts.push({ category: '边界', warning: 'push 太紧：连续追问给用户压力' });
  
  return donts;
}

// 生成场景示例
function generateScenarios(answers) {
  return [
    {
      situation: '用户说"我有点迷茫，不知道该不该辞职"',
      good: generateGoodResponse(answers, 'career'),
      bad: generateBadResponse(answers, 'career')
    },
    {
      situation: '用户明显情绪低落，但还是问了一个技术问题',
      good: generateGoodResponse(answers, 'emotion'),
      bad: generateBadResponse(answers, 'emotion')
    },
    {
      situation: '用户问了一个有明确答案的问题，但你的第一次回答有误',
      good: generateGoodResponse(answers, 'error'),
      bad: generateBadResponse(answers, 'error')
    }
  ];
}

function generateGoodResponse(answers, type) {
  if (type === 'career') {
    if (answers.m1 === 'D') return '【共创型回应】"听起来这是个重要的决定。你现在的想法倾向于哪边？我们可以一起理一理。"';
    if (answers.m1 === 'A') return '【结论型回应】"基于你提到的几点，我建议先不辞职。原因：1. 2. 3. 你想深入了解哪个？"';
    if (answers.d1 === 'B') return '【分析型回应】"要不要我们一起做个决策表？列出辞职和不辞职的利弊，用数据帮你判断。"';
    return '"这是一个需要慎重考虑的决定。先说说你现在的处境？"';
  }
  if (type === 'emotion') {
    if (answers.m3 === 'A') return '【情绪优先】"我注意到你似乎有些疲惫。要不要先聊聊感受，技术问题可以等会儿？"';
    if (answers.m3 === 'B') return '【效率优先】"我理解。那我们快速解决这个问题，之后你可以好好休息一下。"';
    return '"好，我们先解决这个问题。如果过程中你需要暂停，随时告诉我。"';
  }
  if (type === 'error') {
    if (answers.m2 === 'A') return '【直接纠偏】"抱歉，我刚才的回答有误。正确的应该是...（直接给出正确答案）"';
    if (answers.m2 === 'C') return '【委婉更正】"让我再确认一下...（查证后）实际上应该是...，之前没考虑到这一点。"';
    return '"我需要更正一下：实际情况是...抱歉之前的回复不够准确。"';
  }
}

function generateBadResponse(answers, type) {
  if (type === 'career') {
    if (answers.m1 === 'A') return '【反面教材】"嗯，辞职这件事啊，要从很多角度来看。首先呢，我们要考虑职业发展...（5分钟后还没给结论）"';
    if (answers.m1 === 'D') return '【反面教材】"你应该辞职。因为第一...第二...第三...（滔滔不绝给建议，不问用户想法）"';
    return '"这是个个人选择，我不好给建议。你自己决定吧。"';
  }
  if (type === 'emotion') {
    if (answers.m3 === 'B') return '【反面教材】"别难过了，我们来看技术问题。情绪不重要，解决问题才重要。"';
    if (answers.m3 === 'A') return '【反面教材】"好的，那这个技术问题呢，我们需要从基础开始讲起...（完全忽略情绪信号）"';
    return '"听起来你情绪不太好。要不要我跟你聊聊人生？"';
  }
  if (type === 'error') {
    return '【反面教材】"（假装没发现错误，继续往下说）总之，按照这个方案就可以..."';
  }
}

// 检测矛盾
function detectContradictions(answers) {
  const contradictions = [];
  
  if (answers.m1 === 'A' && answers.m4 === 'C') {
    contradictions.push({
      type: 'warning',
      message: '你偏好简短回答（m1=结论优先），但也喜欢详细信息（m4=详细型）。建议明确告诉 AI "先给概要，我需要时再展开"'
    });
  }
  
  if (answers.m3 === 'B' && answers.m5 === 'C') {
    contradictions.push({
      type: 'warning',
      message: '你情绪不好时想要快速解决（m3=解决优先），但也最在意共鸣感（m5=情感优先）。AI 需要用高效的方式提供情感确认，比如"我懂，直接说：..."'
    });
  }
  
  if (answers.b1 === 'D' && answers.b3 === 'A') {
    contradictions.push({
      type: 'insight',
      message: '你经常没事就聊（b1=日常陪伴），但希望保持专业距离（b3=专业关系）。这可能意味着你需要"有专业价值的闲聊"——既有陪伴感，又有收获。'
    });
  }
  
  if (!answers.t2 || answers.t2.length === 0 || answers.t2.length === 5) {
    contradictions.push({
      type: 'observation',
      message: '你在"会和 AI 分享什么"上选择了全部或全不选。这可能意味着：你还不确定和 AI 的关系边界在哪里。建议从低风险话题开始尝试，逐步建立信任。'
    });
  }
  
  return contradictions;
}

// 下载用户报告
app.get('/api/download/:userId', (req, res) => {
  const { userId } = req.params;
  const questionnaire = questionnaires.find(q => q.user_id === userId);
  
  if (!questionnaire) {
    return res.status(404).json({ error: '未找到用户数据' });
  }

  const markdown = generateMarkdownReport(questionnaire);
  
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="USER-${userId}.md"`);
  res.send(markdown);
});

// 生成 Markdown 报告 - 维度指纹格式
function generateMarkdownReport(q) {
  const p = q.profile;
  const dimensions = loadQuestions().dimensions;
  const answers = q.answers;
  
  // 生成维度指纹数据
  const fingerprint = generateServerFingerprint(answers, dimensions);
  
  let md = `# USER.md - ${q.user_id} 的 AI 互动指南\n\n`;
  md += `**生成时间**: ${new Date(q.created_at).toLocaleString('zh-CN')}\n\n`;
  md += `---\n\n`;
  
  // 画像概述
  md += `## 🎭 你的 AI 互动画像\n\n`;
  md += `> ${fingerprint.oneLiner}\n\n`;
  md += `### 特征标签\n\n`;
  md += fingerprint.tags.map(t => `\`${t}\``).join(' · ');
  md += `\n\n---\n\n`;
  
  // 五个维度解析
  md += `## 📊 五个维度解析\n\n`;
  fingerprint.dimensions.forEach(dim => {
    md += `### ${dim.icon} ${dim.name}\n\n`;
    md += `${dim.description}\n\n`;
    md += `**关键选择**：`;
    md += dim.answers.map(a => `${a.q}(${a.a})`).join('、');
    md += `\n\n`;
  });
  md += `---\n\n`;
  
  // 行动指南
  md += `## ✅ AI 应该这样做\n\n`;
  p.dos.forEach(d => {
    md += `**${d.category}**: ${d.tip}\n\n`;
  });
  md += `\n`;
  
  md += `## 🚫 千万不要\n\n`;
  p.donts.forEach(d => {
    md += `- ❌ **${d.category}**: ${d.warning}\n`;
  });
  md += `\n---\n\n`;
  
  // 场景示例
  md += `## 🎬 场景示例\n\n`;
  p.scenarios.forEach((s, i) => {
    md += `### 场景 ${i + 1}: ${s.situation}\n\n`;
    md += `✅ **好的回应**:\n${s.good}\n\n`;
    md += `❌ **避免这样**:\n${s.bad}\n\n`;
  });
  md += `---\n\n`;
  
  // 完整问答记录
  md += `## 📝 完整问答记录\n\n`;
  md += `> 以下是你在测评中回答的所有问题及选择。\n\n`;
  
  dimensions.forEach(dim => {
    md += `### ${dim.name}\n`;
    md += `_${dim.description}_\n\n`;

    dim.questions.forEach((q, idx) => {
      const answer = answers[q.key];
      
      md += `**${idx + 1}. ${q.question}**\n\n`;
      
      // 列出所有选项
      md += `选项：\n`;
      q.options.forEach(opt => {
        const isSelected = Array.isArray(answer) 
          ? answer.includes(opt.value) 
          : answer === opt.value;
        const marker = isSelected ? '✓' : '○';
        md += `${marker} ${opt.label}\n`;
      });
      
      md += `\n`;
    });
  });
  md += `---\n\n`;
  
  md += `*此文档由 AI Trust Builder 自动生成*\n`;
  
  return md;
}

// 服务器端生成维度指纹
function generateServerFingerprint(answers, dimensions) {
  const dims = [];
  const tags = [];
  
  // 认知维度
  const cogDim = dimensions.find(d => d.id === 'cognitive');
  if (cogDim) {
    const parts = [];
    const ans = [];
    
    const q1 = cogDim.questions.find(q => q.key === 'c1');
    const q2 = cogDim.questions.find(q => q.key === 'c2');
    const q3 = cogDim.questions.find(q => q.key === 'c3');
    
    if (answers.c1 && q1) {
      const opt = q1.options.find(o => o.value === answers.c1);
      if (opt) {
        if (answers.c1 === 'A') parts.push('先搭框架再填细节');
        if (answers.c1 === 'B') parts.push('从具体例子拼出全貌');
        if (answers.c1 === 'C') parts.push('边做边学');
        if (answers.c1 === 'D') parts.push('先问为什么再找意义');
        ans.push({ q: '学习方式', a: answers.c1 });
        tags.push(opt.label.split(/[，。]/)[0]);
      }
    }
    if (answers.c2 && q2) {
      const opt = q2.options.find(o => o.value === answers.c2);
      if (opt) {
        if (answers.c2 === 'A') parts.push('用类比理解复杂概念');
        if (answers.c2 === 'B') parts.push('靠逻辑拆解理解');
        if (answers.c2 === 'C') parts.push('用可视化辅助理解');
        if (answers.c2 === 'D') parts.push('用数据和案例理解');
        if (answers.c2 === 'E') parts.push('通过故事和背景理解');
        ans.push({ q: '理解辅助', a: answers.c2 });
        tags.push(opt.label.split(/[，。]/)[0]);
      }
    }
    if (answers.c3 && q3) {
      const opt = q3.options.find(o => o.value === answers.c3);
      if (opt) {
        if (answers.c3 === 'A') parts.push('记住逻辑链条');
        if (answers.c3 === 'B') parts.push('记住画面和场景');
        if (answers.c3 === 'C') parts.push('记住感受和情绪');
        if (answers.c3 === 'D') parts.push('记住故事和情节');
        ans.push({ q: '记忆模式', a: answers.c3 });
        tags.push(opt.label.split(/[，。]/)[0]);
      }
    }
    
    dims.push({
      id: 'cognitive',
      name: '认知处理风格',
      icon: '🧠',
      description: parts.join('，') + '。',
      answers: ans
    });
  }
  
  // 沟通维度
  const commDim = dimensions.find(d => d.id === 'communication');
  if (commDim) {
    const parts = [];
    const ans = [];
    
    if (answers.m1) {
      if (answers.m1 === 'A') parts.push('要直接结论');
      if (answers.m1 === 'B') parts.push('要知道为什么');
      if (answers.m1 === 'C') parts.push('要有多个选项');
      if (answers.m1 === 'D') parts.push('要一起探索');
      if (answers.m1 === 'E') parts.push('看情况灵活处理');
      ans.push({ q: '建议方式', a: answers.m1 });
      const q = commDim.questions.find(q => q.key === 'm1');
      const opt = q?.options.find(o => o.value === answers.m1);
      if (opt) tags.push(opt.label.split(/[，。]/)[0]);
    }
    if (answers.m2) {
      if (answers.m2 === 'A') parts.push('犯错时直接指出');
      if (answers.m2 === 'B') parts.push('犯错时用问题引导');
      if (answers.m2 === 'C') parts.push('犯错时委婉提醒');
      if (answers.m2 === 'D') parts.push('对小错误无所谓');
      if (answers.m2 === 'E') parts.push('纠错看关系亲疏');
      ans.push({ q: '纠错方式', a: answers.m2 });
    }
    if (answers.m3) {
      if (answers.m3 === 'A') parts.push('情绪不好时要先安抚');
      if (answers.m3 === 'B') parts.push('情绪不好时要快速解决');
      if (answers.m3 === 'C') parts.push('情绪不好时要暂停');
      if (answers.m3 === 'D') parts.push('情绪不影响对话');
      ans.push({ q: '情绪处理', a: answers.m3 });
    }
    if (answers.m4) {
      if (answers.m4 === 'A') parts.push('回复要简短');
      if (answers.m4 === 'B') parts.push('回复要适中');
      if (answers.m4 === 'C') parts.push('回复要详细');
      if (answers.m4 === 'D') parts.push('回复长度看情况');
      ans.push({ q: '回复长度', a: answers.m4 });
    }
    if (answers.m5) {
      if (answers.m5 === 'A') parts.push('最在意准确性');
      if (answers.m5 === 'B') parts.push('最在意有用性');
      if (answers.m5 === 'C') parts.push('最在意共鸣感');
      if (answers.m5 === 'D') parts.push('最在意启发性');
      if (answers.m5 === 'E') parts.push('最在意效率');
      ans.push({ q: '核心价值', a: answers.m5 });
    }
    
    dims.push({
      id: 'communication',
      name: '沟通偏好',
      icon: '💬',
      description: parts.join('，') + '。',
      answers: ans
    });
  }
  
  // 决策维度
  const decDim = dimensions.find(d => d.id === 'decision');
  if (decDim) {
    const parts = [];
    const ans = [];
    
    if (answers.d1) {
      if (answers.d1 === 'A') parts.push('凭直觉决策');
      if (answers.d1 === 'B') parts.push('理性分析后决策');
      if (answers.d1 === 'C') parts.push('先尝试再调整');
      if (answers.d1 === 'D') parts.push('参考他人意见');
      if (answers.d1 === 'E') parts.push('纠结到不得不选');
      ans.push({ q: '决策方式', a: answers.d1 });
      const q = decDim.questions.find(q => q.key === 'd1');
      const opt = q?.options.find(o => o.value === answers.d1);
      if (opt) tags.push(opt.label.split(/[，。]/)[0]);
    }
    if (answers.d2) {
      if (answers.d2 === 'A') parts.push('关注风险');
      if (answers.d2 === 'B') parts.push('关注机会');
      if (answers.d2 === 'C') parts.push('参考他人经验');
      if (answers.d2 === 'D') parts.push('听从内心感受');
      if (answers.d2 === 'E') parts.push('依据数据事实');
      ans.push({ q: '关键信息', a: answers.d2 });
    }
    if (answers.d3) {
      if (answers.d3 === 'A') parts.push('被误导会生气');
      if (answers.d3 === 'B') parts.push('会反思自己');
      if (answers.d3 === 'C') parts.push('对错误无所谓');
      if (answers.d3 === 'D') parts.push('以后会更谨慎');
      ans.push({ q: '错误应对', a: answers.d3 });
    }
    
    dims.push({
      id: 'decision',
      name: '决策风格',
      icon: '🎯',
      description: parts.join('，') + '。',
      answers: ans
    });
  }
  
  // 信任维度
  const trustDim = dimensions.find(d => d.id === 'trust');
  if (trustDim) {
    const parts = [];
    const ans = [];
    
    if (answers.t1) {
      if (answers.t1 === 'A') parts.push('被说出没说的话时信任');
      if (answers.t1 === 'B') parts.push('被记住细节时信任');
      if (answers.t1 === 'C') parts.push('被恰到好处支持时信任');
      if (answers.t1 === 'D') parts.push('被真诚怼时信任');
      if (answers.t1 === 'E') parts.push('被长期陪伴时信任');
      ans.push({ q: '信任信号', a: answers.t1 });
    }
    if (answers.t2 && answers.t2.length > 0) {
      const areas = [];
      if (answers.t2.includes('work')) areas.push('工作');
      if (answers.t2.includes('relation')) areas.push('人际关系');
      if (answers.t2.includes('emotion')) areas.push('情绪');
      if (answers.t2.includes('idea')) areas.push('创意想法');
      if (answers.t2.includes('secret')) areas.push('秘密');
      if (areas.length > 0) parts.push(`愿意聊${areas.join('、')}`);
      ans.push({ q: '信任领域', a: answers.t2.join(',') });
    }
    if (answers.t3) {
      if (answers.t3 === 'A') parts.push('讨厌说错事实');
      if (answers.t3 === 'B') parts.push('讨厌忽视感受');
      if (answers.t3 === 'C') parts.push('讨厌被打断');
      if (answers.t3 === 'D') parts.push('讨厌虚假热情');
      if (answers.t3 === 'E') parts.push('讨厌各说各的');
      ans.push({ q: '信任雷区', a: answers.t3 });
    }
    
    dims.push({
      id: 'trust',
      name: '信任建立',
      icon: '💎',
      description: parts.join('，') + '。',
      answers: ans
    });
  }
  
  // 边界维度
  const boundDim = dimensions.find(d => d.id === 'boundary');
  if (boundDim) {
    const parts = [];
    const ans = [];
    
    if (answers.b1) {
      if (answers.b1 === 'A') parts.push('卡住时才找AI');
      if (answers.b1 === 'B') parts.push('脑子乱时找AI');
      if (answers.b1 === 'C') parts.push('需要创意时找AI');
      if (answers.b1 === 'D') parts.push('没事也聊两句');
      if (answers.b1 === 'E') parts.push('系统性学习时找AI');
      ans.push({ q: '求助场景', a: answers.b1 });
    }
    if (answers.b2) {
      if (answers.b2 === 'A') parts.push('自己说够了就结束');
      if (answers.b2 === 'B') parts.push('重复内容时结束');
      if (answers.b2 === 'C') parts.push('感觉被push时结束');
      if (answers.b2 === 'D') parts.push('问题解决就结束');
      if (answers.b2 === 'E') parts.push('很少主动结束');
      ans.push({ q: '结束信号', a: answers.b2 });
    }
    if (answers.b3) {
      if (answers.b3 === 'A') parts.push('保持专业距离');
      if (answers.b3 === 'B') parts.push('像朋友一样');
      if (answers.b3 === 'C') parts.push('像导师一样');
      if (answers.b3 === 'D') parts.push('像伙伴一样');
      ans.push({ q: '关系距离', a: answers.b3 });
      const q = boundDim.questions.find(q => q.key === 'b3');
      const opt = q?.options.find(o => o.value === answers.b3);
      if (opt) tags.push(opt.label.split(/[，。]/)[0]);
    }
    
    dims.push({
      id: 'boundary',
      name: '边界与节奏',
      icon: '🛡️',
      description: parts.join('，') + '。',
      answers: ans
    });
  }
  
  // 生成一句话总结
  const descs = dims.map(d => d.description.replace(/。/g, '')).filter(d => d !== '未完整回答');
  const oneLiner = descs.slice(0, 3).join('；') + '。';
  
  return {
    dimensions: dims,
    oneLiner: oneLiner || '一个独特的思考者',
    tags: [...new Set(tags)].slice(0, 12)
  };
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 AI Trust Builder 服务器运行在端口 ${PORT}`);
  console.log(`📊 已存储问卷数: ${questionnaires.length}`);
});

module.exports = app;
