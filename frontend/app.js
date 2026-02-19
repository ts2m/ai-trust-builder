// AI Trust Builder - 前端应用
const API_URL = 'http://localhost:3000/api';

// 状态管理
let currentState = {
    userId: '',
    questions: [],
    currentIndex: 0,
    answers: {}
};

// DOM 元素（延迟初始化）
let screens = {};

// 关卡名称映射
const levelNames = {
    'communication': '🗣️ 沟通偏好',
    'rhythm': '⚡ 节奏与边界',
    'trust': '💎 信任信号'
};

// 初始化
async function init() {
    console.log('init 开始执行');
    
    // 初始化 DOM 元素引用
    screens = {
        home: document.getElementById('home-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen')
    };
    console.log('screens 对象:', screens);

    // 加载问题
    try {
        const response = await fetch(`${API_URL}/questions`);
        currentState.questions = await response.json();
        console.log('从服务器加载问题:', currentState.questions.length);
    } catch (error) {
        console.error('加载问题失败:', error);
        // 使用默认问题
        currentState.questions = getDefaultQuestions();
        console.log('使用默认问题:', currentState.questions.length);
    }

    // 绑定事件
    bindEvents();
    
    console.log('init 执行完成');
}

// 默认问题（备用）
function getDefaultQuestions() {
    return [
        {
            "key": "q1",
            "level": "communication",
            "question": "当我给出建议时，你更希望：",
            "options": [
                { "value": "A", "label": "直说结论，不废话" },
                { "value": "B", "label": "告诉用户原因，让我自己判断" },
                { "value": "C", "label": "先问我想怎么选，陪我推演" }
            ]
        },
        {
            "key": "q2",
            "level": "communication",
            "question": "如果我看出你在想错方向：",
            "options": [
                { "value": "A", "label": "直接打断：你这里错了" },
                { "value": "B", "label": "旁敲侧击让你自己发现" },
                { "value": "C", "label": "顺着你说完，最后再提" },
                { "value": "D", "label": "看心情 / 看事" }
            ]
        },
        {
            "key": "q3",
            "level": "rhythm",
            "question": "你一般在什么状态下会来找我？",
            "options": [
                { "value": "A", "label": "卡住了，需要救命" },
                { "value": "B", "label": "脑子里乱，需要理清楚" },
                { "value": "C", "label": "想搞点新东西，找人碰撞" },
                { "value": "D", "label": "没事就聊两句" }
            ]
        },
        {
            "key": "q4",
            "level": "rhythm",
            "question": "什么时候该喊停？",
            "options": [
                { "value": "A", "label": "我自己说够了" },
                { "value": "B", "label": "你开始重复同一个点时" },
                { "value": "C", "label": "我感觉你在push我时" },
                { "value": "D", "label": "你不需要管，我不会累" }
            ]
        },
        {
            "key": "q5",
            "level": "trust",
            "question": "你觉得这人懂我的瞬间通常是因为：",
            "options": [
                { "value": "A", "label": "说出了我没说出口的话" },
                { "value": "B", "label": "记住了我之前随口提的小事" },
                { "value": "C", "label": "在我犹豫时给了恰到好处的支持" },
                { "value": "D", "label": "敢怼我，且怼得对" }
            ]
        },
        {
            "key": "q6",
            "level": "trust",
            "question": "什么样的事你只会跟熟人说？",
            "options": [
                { "value": "A", "label": "具体的困难 / 糗事" },
                { "value": "B", "label": "真正的动机（不只是表面理由）" },
                { "value": "C", "label": "对别人的负面看法" },
                { "value": "D", "label": "几乎不说，包括熟人" }
            ]
        }
    ];
}

// 绑定事件
function bindEvents() {
    console.log('正在绑定事件...');
    
    // 开始按钮
    const startBtn = document.getElementById('start-btn');
    console.log('开始按钮:', startBtn);
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            console.log('开始按钮被点击');
            e.preventDefault();
            startQuiz();
        });
    }
    
    // 输入框回车
    const userIdInput = document.getElementById('user-id');
    if (userIdInput) {
        userIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                startQuiz();
            }
        });
    }

    // 上一题
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.addEventListener('click', prevQuestion);
    }

    // 下载按钮
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadMarkdown);
    }

    // 重新开始
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
        restartBtn.addEventListener('click', restartQuiz);
    }
    
    console.log('事件绑定完成');
}

// 开始问卷
function startQuiz() {
    const userId = document.getElementById('user-id').value.trim();
    
    if (!userId) {
        shakeInput();
        return;
    }

    currentState.userId = userId;
    currentState.currentIndex = 0;
    currentState.answers = {};

    showScreen('quiz');
    renderQuestion();
}

// 抖动输入框
function shakeInput() {
    const input = document.getElementById('user-id');
    input.style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        input.style.animation = '';
    }, 500);
}

// 渲染问题
function renderQuestion() {
    const question = currentState.questions[currentState.currentIndex];
    
    // 更新进度
    updateProgress();

    // 更新关卡标签
    document.getElementById('level-badge').textContent = levelNames[question.level];

    // 更新问题文本
    document.getElementById('question-text').textContent = question.question;

    // 渲染选项
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (currentState.answers[question.key] === option.value) {
            btn.classList.add('selected');
        }
        btn.textContent = option.label;
        btn.addEventListener('click', function() { selectOption(question.key, option.value, this); });
        optionsContainer.appendChild(btn);
    });

    // 更新上一题按钮
    document.getElementById('prev-btn').disabled = currentState.currentIndex === 0;
}

// 更新进度
function updateProgress() {
    const total = currentState.questions.length;
    const current = currentState.currentIndex + 1;
    const progress = (current / total) * 100;

    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('question-counter').textContent = `${current}/${total}`;

    // 更新关卡名称
    const question = currentState.questions[currentState.currentIndex];
    document.getElementById('current-level').textContent = levelNames[question.level];
}

// 选择选项
function selectOption(questionKey, value, clickedBtn) {
    currentState.answers[questionKey] = value;

    // 更新选中状态
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.classList.remove('selected'));
    clickedBtn.classList.add('selected');

    // 延迟后进入下一题
    setTimeout(() => {
        if (currentState.currentIndex < currentState.questions.length - 1) {
            currentState.currentIndex++;
            renderQuestion();
        } else {
            submitQuiz();
        }
    }, 300);
}

// 上一题
function prevQuestion() {
    if (currentState.currentIndex > 0) {
        currentState.currentIndex--;
        renderQuestion();
    }
}

// 提交问卷
async function submitQuiz() {
    try {
        const response = await fetch(`${API_URL}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentState.userId,
                answers: currentState.answers
            })
        });

        const result = await response.json();

        if (result.success) {
            showResult();
        } else {
            alert('提交失败，请重试');
        }
    } catch (error) {
        console.error('提交失败:', error);
        // 即使后端失败也显示结果（离线模式）
        showResult();
    }
}

// 显示结果
function showResult() {
    showScreen('result');

    // 生成结果摘要
    const summaryContainer = document.getElementById('result-summary');
    summaryContainer.innerHTML = '';

    const resultItems = [
        { key: 'q1', label: '沟通偏好' },
        { key: 'q3', label: '求助场景' },
        { key: 'q5', label: '信任信号' },
        { key: 'q6', label: '个人边界' }
    ];

    resultItems.forEach(item => {
        const question = currentState.questions.find(q => q.key === item.key);
        const answer = question.options.find(o => o.value === currentState.answers[item.key]);

        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="label">${item.label}</div>
            <div class="value">${answer ? answer.label : '未回答'}</div>
        `;
        summaryContainer.appendChild(div);
    });
}

// 下载 Markdown
async function downloadMarkdown() {
    try {
        const response = await fetch(`${API_URL}/download/${currentState.userId}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `USER-${currentState.userId}.md`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            // 如果没有后端，生成本地 Markdown
            generateLocalMarkdown();
        }
    } catch (error) {
        // 离线模式：生成本地 Markdown
        generateLocalMarkdown();
    }
}

// 生成本地 Markdown（离线模式）
function generateLocalMarkdown() {
    const a = currentState.answers;
    const userId = currentState.userId;
    
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
    
    // 原始答案（放在最后，需要时可以查看）
    lines.push(`## 📝 原始答案记录`);
    lines.push('');

    const levelNamesCn = {
        'communication': '🗣️ 沟通偏好',
        'rhythm': '⚡ 节奏与边界',
        'trust': '💎 信任信号'
    };

    ['communication', 'rhythm', 'trust'].forEach(level => {
        lines.push(`### ${levelNamesCn[level]}`);
        lines.push('');
        
        const levelQuestions = currentState.questions.filter(q => q.level === level);
        levelQuestions.forEach(q => {
            const answerValue = currentState.answers[q.key];
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

    // 下载
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `USER-${userId}.md`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(downloadLink);
}

// 重新开始
function restartQuiz() {
    currentState.currentIndex = 0;
    currentState.answers = {};
    document.getElementById('user-id').value = '';
    showScreen('home');
}

// 切换屏幕
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

// 启动应用
document.addEventListener('DOMContentLoaded', init);