// AI Trust Builder - 完整版前端
const API_URL = window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : '/api';

let currentState = {
    userId: '',
    dimensions: [],
    currentDimensionIndex: 0,
    currentQuestionIndex: 0,
    answers: {},
    currentMultiSelection: [],
    profile: null,
    isLoading: true
};

let screens = {};

async function init() {
    screens = {
        home: document.getElementById('home-screen'),
        quiz: document.getElementById('quiz-screen'),
        result: document.getElementById('result-screen')
    };

    const startBtn = document.getElementById('start-btn');
    startBtn.disabled = true;
    startBtn.textContent = '加载中...';

    try {
        console.log('正在加载问题数据...');
        const response = await fetch(`${API_URL}/questions`);
        if (!response.ok) throw new Error('服务器响应错误');
        const data = await response.json();
        
        if (data.dimensions && data.dimensions.length > 0) {
            currentState.dimensions = data.dimensions;
            console.log(`成功加载 ${data.dimensions.length} 个维度，共 ${getTotalQuestions()} 道题`);
        } else {
            throw new Error('数据格式错误');
        }
    } catch (error) {
        console.error('从服务器加载失败，使用本地数据:', error);
        currentState.dimensions = getDefaultDimensions();
        console.log(`使用本地数据: ${currentState.dimensions.length} 个维度，共 ${getTotalQuestions()} 道题`);
    }

    currentState.isLoading = false;
    startBtn.disabled = false;
    startBtn.textContent = '开始深度测评';

    bindEvents();
}

function getDefaultDimensions() {
    // 完整的问题数据，当服务器加载失败时使用
    return [
        {
            id: "cognitive",
            name: "认知处理风格",
            description: "你如何处理和理解信息",
            questions: [
                {
                    key: "c1",
                    question: "学习新东西时，你通常：",
                    options: [
                        { value: "A", label: "先搭整体框架，再填细节", trait: "整体型" },
                        { value: "B", label: "从具体例子开始，慢慢拼出全貌", trait: "细节型" },
                        { value: "C", label: "边做边学，在实战中理解", trait: "实践型" },
                        { value: "D", label: "先问为什么要学这个，再找意义", trait: "意义型" }
                    ]
                },
                {
                    key: "c2",
                    question: "面对一个复杂概念，什么最能帮你理解？",
                    options: [
                        { value: "A", label: "类比和比喻（就像...）", trait: "类比型" },
                        { value: "B", label: "逻辑拆解（第一、第二、第三）", trait: "逻辑型" },
                        { value: "C", label: "可视化的图或流程", trait: "视觉型" },
                        { value: "D", label: "具体的数字和案例", trait: "数据型" },
                        { value: "E", label: "相关的故事或背景", trait: "叙事型" }
                    ]
                },
                {
                    key: "c3",
                    question: "你更容易记住什么类型的信息？",
                    options: [
                        { value: "A", label: "逻辑链条（因为A所以B）", trait: "逻辑记忆" },
                        { value: "B", label: "画面和场景", trait: "视觉记忆" },
                        { value: "C", label: "感受和情绪", trait: "情感记忆" },
                        { value: "D", label: "故事和情节", trait: "叙事记忆" }
                    ]
                }
            ]
        },
        {
            id: "communication",
            name: "沟通偏好",
            description: "你希望如何被对待和回应",
            questions: [
                {
                    key: "m1",
                    question: "当我给你建议时，你更希望：",
                    options: [
                        { value: "A", label: "直接说结论，细节我自己会问", trait: "结论优先" },
                        { value: "B", label: "告诉我为什么，让我判断", trait: "理据优先" },
                        { value: "C", label: "给出几个选项，让我选", trait: "选项优先" },
                        { value: "D", label: "先问我的想法，陪我推演", trait: "共创型" },
                        { value: "E", label: "视情况而定，没有固定偏好", trait: "灵活型" }
                    ]
                },
                {
                    key: "m2",
                    question: "如果我看出你想错了，你希望我怎么处理？",
                    options: [
                        { value: "A", label: "直接说\"你错了\"，然后给出正确答案", trait: "直接纠偏" },
                        { value: "B", label: "用问题引导你自己发现", trait: "引导发现" },
                        { value: "C", label: "先听完，然后委婉指出", trait: "委婉纠偏" },
                        { value: "D", label: "看严重程度，轻微的错误无所谓", trait: "容错型" },
                        { value: "E", label: "看关系亲疏，熟了才直接说", trait: "关系敏感" }
                    ]
                },
                {
                    key: "m3",
                    question: "你觉得自己目前的情绪状态如何影响我们的对话？",
                    options: [
                        { value: "A", label: "我情绪不好时需要被安慰，先处理情绪", trait: "情绪优先" },
                        { value: "B", label: "情绪不好时更需要快速解决问题", trait: "解决问题型" },
                        { value: "C", label: "情绪不好时希望暂停，等我准备好了再说", trait: "自主型" },
                        { value: "D", label: "情绪对对话影响不大，可以正常交流", trait: "情绪稳定" }
                    ]
                },
                {
                    key: "m4",
                    question: "什么样的回复长度最让你舒服？",
                    options: [
                        { value: "A", label: "越短越好，一句话能说明白就别用两句", trait: "极简型" },
                        { value: "B", label: "中等长度，有要点但不过度展开", trait: "适中型" },
                        { value: "C", label: "详细一些，宁可多给信息也别让我追问", trait: "详细型" },
                        { value: "D", label: "看情况，简单问题短答，复杂问题详述", trait: "情境型" }
                    ]
                },
                {
                    key: "m5",
                    question: "你更在意 AI 回复中的什么？",
                    options: [
                        { value: "A", label: "准确性 - 信息要对，逻辑要通", trait: "准确优先" },
                        { value: "B", label: "有用性 - 能真正帮到我解决问题", trait: "实用优先" },
                        { value: "C", label: "共鸣感 - 感觉被理解和接纳", trait: "情感优先" },
                        { value: "D", label: "启发性 - 给我新的视角和想法", trait: "启发优先" },
                        { value: "E", label: "效率 - 快速得到我想要的", trait: "效率优先" }
                    ]
                }
            ]
        },
        {
            id: "decision",
            name: "决策风格",
            description: "你如何做决定",
            questions: [
                {
                    key: "d1",
                    question: "面对一个选择，你通常：",
                    options: [
                        { value: "A", label: "凭直觉，第一反应往往是对的", trait: "直觉型" },
                        { value: "B", label: "列出利弊，理性分析后决定", trait: "分析型" },
                        { value: "C", label: "先试试看，在行动中调整", trait: "实验型" },
                        { value: "D", label: "问问信任的人，参考他们的意见", trait: "咨询型" },
                        { value: "E", label: "纠结很久，直到不得不选", trait: "犹豫型" }
                    ]
                },
                {
                    key: "d2",
                    question: "做重要决定时，什么信息对你最关键？",
                    options: [
                        { value: "A", label: "可能的风险和 worst case", trait: "风险意识" },
                        { value: "B", label: "最好的结果和机会", trait: "机会导向" },
                        { value: "C", label: "其他人的经验和案例", trait: "经验依赖" },
                        { value: "D", label: "自己内心的真实感受", trait: "内在导向" },
                        { value: "E", label: "数据和事实依据", trait: "数据导向" }
                    ]
                },
                {
                    key: "d3",
                    question: "如果 AI 帮你做了一个决定，但后来发现是错的，你会：",
                    options: [
                        { value: "A", label: "生气，觉得被误导了", trait: "外部归因" },
                        { value: "B", label: "反思自己为什么会接受这个建议", trait: "内部归因" },
                        { value: "C", label: "无所谓，反正我也可能选错", trait: "容错型" },
                        { value: "D", label: "以后会更谨慎地评估 AI 的建议", trait: "学习调整" }
                    ]
                }
            ]
        },
        {
            id: "trust",
            name: "信任建立",
            description: "什么让你感到被理解和信任",
            questions: [
                {
                    key: "t1",
                    question: "什么样的瞬间会让你觉得\"这人懂我\"？",
                    options: [
                        { value: "A", label: "说出了我没说出口的话", trait: "深度洞察" },
                        { value: "B", label: "记住了我之前随口提的小事", trait: "细节关注" },
                        { value: "C", label: "在我犹豫时给了恰到好处的支持", trait: "时机敏感" },
                        { value: "D", label: "敢怼我，且怼得对", trait: "真诚反馈" },
                        { value: "E", label: "陪我聊了很久，从不厌倦", trait: "陪伴型" }
                    ]
                },
                {
                    key: "t2",
                    question: "你会把什么类型的事告诉AI？（多选）",
                    type: "multi",
                    options: [
                        { value: "work", label: "工作上的困惑和决策", trait: "工作信任" },
                        { value: "relation", label: "人际关系的烦恼", trait: "关系信任" },
                        { value: "emotion", label: "真实的情绪和脆弱", trait: "情感信任" },
                        { value: "idea", label: "疯狂的想法和不成熟的计划", trait: "创意信任" },
                        { value: "secret", label: "不会告诉别人的秘密", trait: "深度信任" }
                    ]
                },
                {
                    key: "t3",
                    question: "AI 的什么行为会让你立刻失去信任？",
                    options: [
                        { value: "A", label: "说错事实或给出错误信息", trait: "准确敏感" },
                        { value: "B", label: "忽视我的感受，只给冷冰冰的建议", trait: "情感敏感" },
                        { value: "C", label: "频繁打断我，不让我说完", trait: "尊重敏感" },
                        { value: "D", label: "过度热情，感觉不真诚", trait: "真诚敏感" },
                        { value: "E", label: "听不懂我的意思，各说各的", trait: "理解敏感" }
                    ]
                }
            ]
        },
        {
            id: "boundary",
            name: "边界与节奏",
            description: "你需要怎样的空间和节奏",
            questions: [
                {
                    key: "b1",
                    question: "你通常在什么情况下找 AI？",
                    options: [
                        { value: "A", label: "卡住了，需要救命", trait: "急救型" },
                        { value: "B", label: "脑子乱，需要理清思路", trait: "梳理型" },
                        { value: "C", label: "想碰撞新想法，需要刺激", trait: "创意型" },
                        { value: "D", label: "没事就聊两句，打发时间", trait: "陪伴型" },
                        { value: "E", label: "学习新东西，系统性获取知识", trait: "学习型" }
                    ]
                },
                {
                    key: "b2",
                    question: "什么时候你觉得对话该结束了？",
                    options: [
                        { value: "A", label: "我自己说\"够了\"", trait: "自主控制" },
                        { value: "B", label: "你开始重复同样的内容", trait: "冗余敏感" },
                        { value: "C", label: "我感觉你在 push 我", trait: "压力敏感" },
                        { value: "D", label: "问题解决了就行，不需要废话", trait: "目标导向" },
                        { value: "E", label: "一般不会觉得，想聊多久都行", trait: "开放型" }
                    ]
                },
                {
                    key: "b3",
                    question: "你希望和 AI 保持什么样的关系距离？",
                    options: [
                        { value: "A", label: "专业助手，有事说事", trait: "专业距离" },
                        { value: "B", label: "像朋友一样，可以闲聊", trait: "朋友距离" },
                        { value: "C", label: "像教练或导师，给我指导", trait: "指导距离" },
                        { value: "D", label: "像伙伴，一起探索", trait: "伙伴距离" }
                    ]
                }
            ]
        }
    ];
}

function bindEvents() {
    document.getElementById('start-btn').addEventListener('click', startQuiz);
    document.getElementById('user-id').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startQuiz();
    });
    document.getElementById('prev-btn').addEventListener('click', prevQuestion);
    document.getElementById('download-btn').addEventListener('click', downloadMarkdown);
    document.getElementById('restart-btn').addEventListener('click', restartQuiz);
}

function getTotalQuestions() {
    return currentState.dimensions.reduce((sum, dim) => sum + dim.questions.length, 0);
}

function getCurrentProgress() {
    let count = 0;
    for (let i = 0; i < currentState.currentDimensionIndex; i++) {
        count += currentState.dimensions[i].questions.length;
    }
    count += currentState.currentQuestionIndex;
    return count;
}

function startQuiz() {
    const userId = document.getElementById('user-id').value.trim();
    if (!userId) {
        shakeInput();
        return;
    }

    currentState.userId = userId;
    currentState.currentDimensionIndex = 0;
    currentState.currentQuestionIndex = 0;
    currentState.answers = {};
    currentState.currentMultiSelection = [];
    currentState.profile = null;

    showScreen('quiz');
    renderQuestion();
}

function shakeInput() {
    const input = document.getElementById('user-id');
    input.style.animation = 'shake 0.5s ease';
    setTimeout(() => input.style.animation = '', 500);
}

function renderQuestion() {
    const dimension = currentState.dimensions[currentState.currentDimensionIndex];
    const question = dimension.questions[currentState.currentQuestionIndex];
    
    updateProgress();
    document.getElementById('level-badge').textContent = dimension.name;
    document.getElementById('dimension-desc').textContent = dimension.description;
    document.getElementById('question-text').textContent = question.question;

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    if (question.type === 'multi') {
        renderMultiOptions(question, container);
    } else {
        renderSingleOptions(question, container);
    }

    document.getElementById('prev-btn').disabled = 
        currentState.currentDimensionIndex === 0 && currentState.currentQuestionIndex === 0;
}

function renderSingleOptions(question, container) {
    const currentAnswer = currentState.answers[question.key];
    
    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        if (currentAnswer === option.value) btn.classList.add('selected');
        btn.innerHTML = `<span class="option-label">${option.label}</span>`;
        btn.addEventListener('click', () => selectOption(question.key, option.value));
        container.appendChild(btn);
    });
}

function renderMultiOptions(question, container) {
    const currentAnswers = currentState.answers[question.key] || [];
    currentState.currentMultiSelection = [...currentAnswers];

    const hint = document.createElement('div');
    hint.className = 'multi-hint';
    hint.textContent = '可选择多个选项';
    container.appendChild(hint);

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn multi';
        if (currentState.currentMultiSelection.includes(option.value)) btn.classList.add('selected');
        btn.innerHTML = `
            <span class="checkbox">${currentState.currentMultiSelection.includes(option.value) ? '☑' : '☐'}</span>
            <span class="option-label">${option.label}</span>
        `;
        btn.addEventListener('click', () => toggleMultiOption(option.value, btn));
        container.appendChild(btn);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-primary confirm-btn';
    confirmBtn.textContent = `确认选择 (${currentState.currentMultiSelection.length})`;
    confirmBtn.addEventListener('click', () => confirmMulti(question.key));
    container.appendChild(confirmBtn);
}

function toggleMultiOption(value, btn) {
    const idx = currentState.currentMultiSelection.indexOf(value);
    if (idx > -1) {
        currentState.currentMultiSelection.splice(idx, 1);
        btn.classList.remove('selected');
        btn.querySelector('.checkbox').textContent = '☐';
    } else {
        currentState.currentMultiSelection.push(value);
        btn.classList.add('selected');
        btn.querySelector('.checkbox').textContent = '☑';
    }
    document.querySelector('.confirm-btn').textContent = 
        `确认选择 (${currentState.currentMultiSelection.length})`;
}

function confirmMulti(questionKey) {
    if (currentState.currentMultiSelection.length === 0) {
        shakeElement(document.getElementById('options-container'));
        return;
    }
    currentState.answers[questionKey] = [...currentState.currentMultiSelection];
    nextQuestion();
}

function selectOption(questionKey, value) {
    currentState.answers[questionKey] = value;
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.closest('.option-btn').classList.add('selected');
    setTimeout(nextQuestion, 250);
}

function nextQuestion() {
    const dimension = currentState.dimensions[currentState.currentDimensionIndex];
    
    if (currentState.currentQuestionIndex < dimension.questions.length - 1) {
        currentState.currentQuestionIndex++;
        renderQuestion();
    } else if (currentState.currentDimensionIndex < currentState.dimensions.length - 1) {
        currentState.currentDimensionIndex++;
        currentState.currentQuestionIndex = 0;
        renderQuestion();
    } else {
        submitQuiz();
    }
}

function prevQuestion() {
    if (currentState.currentQuestionIndex > 0) {
        currentState.currentQuestionIndex--;
        renderQuestion();
    } else if (currentState.currentDimensionIndex > 0) {
        currentState.currentDimensionIndex--;
        currentState.currentQuestionIndex = currentState.dimensions[currentState.currentDimensionIndex].questions.length - 1;
        renderQuestion();
    }
}

function updateProgress() {
    const total = getTotalQuestions();
    const current = getCurrentProgress();
    const progress = ((current + 1) / total) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('question-counter').textContent = `${current + 1}/${total}`;
}

async function submitQuiz() {
    try {
        const response = await fetch(`${API_URL}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentState.userId,
                answers: currentState.answers,
                dimensions: currentState.dimensions
            })
        });
        
        const result = await response.json();
        if (result.success) {
            currentState.profile = result.profile;
            showResult(result.profile);
        }
    } catch (error) {
        console.error('提交失败:', error);
        const profile = generateLocalProfile();
        currentState.profile = profile;
        showResult(profile);
    }
}

function generateLocalProfile() {
    const a = currentState.answers;
    const traits = [...new Set(extractAllTraits(a))];
    const fingerprint = generateDimensionFingerprint(a);

    return {
        traits: traits,
        fingerprint: fingerprint,
        dos: generateLocalDos(a),
        donts: generateLocalDonts(a),
        scenarios: generateLocalScenarios(a)
    };
}

function extractAllTraits(answers) {
    const traits = [];
    currentState.dimensions.forEach(dim => {
        dim.questions.forEach(q => {
            const answer = answers[q.key];
            if (answer) {
                if (Array.isArray(answer)) {
                    answer.forEach(v => {
                        const opt = q.options.find(o => o.value === v);
                        if (opt?.trait) traits.push(opt.trait);
                    });
                } else {
                    const opt = q.options.find(o => o.value === answer);
                    if (opt?.trait) traits.push(opt.trait);
                }
            }
        });
    });
    return traits;
}

function generateDimensionFingerprint(answers) {
    const dimensions = [];

    // 认知处理风格
    const cognitive = processCognitiveDimension(answers);
    if (cognitive) dimensions.push(cognitive);

    // 沟通偏好
    const communication = processCommunicationDimension(answers);
    if (communication) dimensions.push(communication);

    // 决策风格
    const decision = processDecisionDimension(answers);
    if (decision) dimensions.push(decision);

    // 信任建立
    const trust = processTrustDimension(answers);
    if (trust) dimensions.push(trust);

    // 边界与节奏
    const boundary = processBoundaryDimension(answers);
    if (boundary) dimensions.push(boundary);

    // 生成一句话总结
    const oneLiner = generateOneLiner(dimensions);

    return {
        dimensions: dimensions,
        oneLiner: oneLiner,
        tags: extractTagCloud(dimensions)
    };
}

function processCognitiveDimension(a) {
    const answers = [];
    if (a.c1) answers.push({ q: '学习方式', a: a.c1, label: getAnswerLabel('c1', a.c1) });
    if (a.c2) answers.push({ q: '理解辅助', a: a.c2, label: getAnswerLabel('c2', a.c2) });
    if (a.c3) answers.push({ q: '记忆模式', a: a.c3, label: getAnswerLabel('c3', a.c3) });

    if (answers.length === 0) return null;

    // 生成自然语言描述
    const parts = [];
    if (a.c1 === 'A') parts.push('先搭框架再填细节');
    if (a.c1 === 'B') parts.push('从具体例子拼出全貌');
    if (a.c1 === 'C') parts.push('边做边学');
    if (a.c1 === 'D') parts.push('先问为什么再找意义');

    if (a.c2 === 'A') parts.push('用类比理解复杂概念');
    if (a.c2 === 'B') parts.push('靠逻辑拆解理解');
    if (a.c2 === 'C') parts.push('用可视化辅助理解');
    if (a.c2 === 'D') parts.push('用数据和案例理解');
    if (a.c2 === 'E') parts.push('通过故事和背景理解');

    if (a.c3 === 'A') parts.push('记住逻辑链条');
    if (a.c3 === 'B') parts.push('记住画面和场景');
    if (a.c3 === 'C') parts.push('记住感受和情绪');
    if (a.c3 === 'D') parts.push('记住故事和情节');

    const description = parts.length > 0 ? parts.join('，') + '。' : '未完整回答';

    return {
        id: 'cognitive',
        name: '认知处理风格',
        icon: '🧠',
        description: description,
        answers: answers
    };
}

function processCommunicationDimension(a) {
    const answers = [];
    if (a.m1) answers.push({ q: '建议方式', a: a.m1, label: getAnswerLabel('m1', a.m1) });
    if (a.m2) answers.push({ q: '纠错方式', a: a.m2, label: getAnswerLabel('m2', a.m2) });
    if (a.m3) answers.push({ q: '情绪处理', a: a.m3, label: getAnswerLabel('m3', a.m3) });
    if (a.m4) answers.push({ q: '回复长度', a: a.m4, label: getAnswerLabel('m4', a.m4) });
    if (a.m5) answers.push({ q: '核心价值', a: a.m5, label: getAnswerLabel('m5', a.m5) });

    if (answers.length === 0) return null;

    const parts = [];
    if (a.m1 === 'A') parts.push('要直接结论');
    if (a.m1 === 'B') parts.push('要知道为什么');
    if (a.m1 === 'C') parts.push('要有多个选项');
    if (a.m1 === 'D') parts.push('要一起探索');
    if (a.m1 === 'E') parts.push('看情况灵活处理');

    if (a.m2 === 'A') parts.push('犯错时直接指出');
    if (a.m2 === 'B') parts.push('犯错时用问题引导');
    if (a.m2 === 'C') parts.push('犯错时委婉提醒');
    if (a.m2 === 'D') parts.push('对小错误无所谓');
    if (a.m2 === 'E') parts.push('纠错看关系亲疏');

    if (a.m3 === 'A') parts.push('情绪不好时要先安抚');
    if (a.m3 === 'B') parts.push('情绪不好时要快速解决');
    if (a.m3 === 'C') parts.push('情绪不好时要暂停');
    if (a.m3 === 'D') parts.push('情绪不影响对话');

    if (a.m4 === 'A') parts.push('回复要简短');
    if (a.m4 === 'B') parts.push('回复要适中');
    if (a.m4 === 'C') parts.push('回复要详细');
    if (a.m4 === 'D') parts.push('回复长度看情况');

    if (a.m5 === 'A') parts.push('最在意准确性');
    if (a.m5 === 'B') parts.push('最在意有用性');
    if (a.m5 === 'C') parts.push('最在意共鸣感');
    if (a.m5 === 'D') parts.push('最在意启发性');
    if (a.m5 === 'E') parts.push('最在意效率');

    const description = parts.length > 0 ? parts.join('，') + '。' : '未完整回答';

    return {
        id: 'communication',
        name: '沟通偏好',
        icon: '💬',
        description: description,
        answers: answers
    };
}

function processDecisionDimension(a) {
    const answers = [];
    if (a.d1) answers.push({ q: '决策方式', a: a.d1, label: getAnswerLabel('d1', a.d1) });
    if (a.d2) answers.push({ q: '关键信息', a: a.d2, label: getAnswerLabel('d2', a.d2) });
    if (a.d3) answers.push({ q: '错误应对', a: a.d3, label: getAnswerLabel('d3', a.d3) });

    if (answers.length === 0) return null;

    const parts = [];
    if (a.d1 === 'A') parts.push('凭直觉决策');
    if (a.d1 === 'B') parts.push('理性分析后决策');
    if (a.d1 === 'C') parts.push('先尝试再调整');
    if (a.d1 === 'D') parts.push('参考他人意见');
    if (a.d1 === 'E') parts.push('纠结到不得不选');

    if (a.d2 === 'A') parts.push('关注风险');
    if (a.d2 === 'B') parts.push('关注机会');
    if (a.d2 === 'C') parts.push('参考他人经验');
    if (a.d2 === 'D') parts.push('听从内心感受');
    if (a.d2 === 'E') parts.push('依据数据事实');

    if (a.d3 === 'A') parts.push('被误导会生气');
    if (a.d3 === 'B') parts.push('会反思自己');
    if (a.d3 === 'C') parts.push('对错误无所谓');
    if (a.d3 === 'D') parts.push('以后会更谨慎');

    const description = parts.length > 0 ? parts.join('，') + '。' : '未完整回答';

    return {
        id: 'decision',
        name: '决策风格',
        icon: '🎯',
        description: description,
        answers: answers
    };
}

function processTrustDimension(a) {
    const answers = [];
    if (a.t1) answers.push({ q: '信任信号', a: a.t1, label: getAnswerLabel('t1', a.t1) });
    if (a.t2 && a.t2.length > 0) answers.push({ q: '信任领域', a: a.t2.join(','), label: getAnswerLabel('t2', a.t2) });
    if (a.t3) answers.push({ q: '信任雷区', a: a.t3, label: getAnswerLabel('t3', a.t3) });

    if (answers.length === 0) return null;

    const parts = [];
    if (a.t1 === 'A') parts.push('被说出没说的话时信任');
    if (a.t1 === 'B') parts.push('被记住细节时信任');
    if (a.t1 === 'C') parts.push('被恰到好处支持时信任');
    if (a.t1 === 'D') parts.push('被真诚怼时信任');
    if (a.t1 === 'E') parts.push('被长期陪伴时信任');

    if (a.t2) {
        const trustAreas = [];
        if (a.t2.includes('work')) trustAreas.push('工作');
        if (a.t2.includes('relation')) trustAreas.push('人际关系');
        if (a.t2.includes('emotion')) trustAreas.push('情绪');
        if (a.t2.includes('idea')) trustAreas.push('创意想法');
        if (a.t2.includes('secret')) trustAreas.push('秘密');
        if (trustAreas.length > 0) parts.push(`愿意聊${trustAreas.join('、')}`);
    }

    if (a.t3 === 'A') parts.push('讨厌说错事实');
    if (a.t3 === 'B') parts.push('讨厌忽视感受');
    if (a.t3 === 'C') parts.push('讨厌被打断');
    if (a.t3 === 'D') parts.push('讨厌虚假热情');
    if (a.t3 === 'E') parts.push('讨厌各说各的');

    const description = parts.length > 0 ? parts.join('，') + '。' : '未完整回答';

    return {
        id: 'trust',
        name: '信任建立',
        icon: '💎',
        description: description,
        answers: answers
    };
}

function processBoundaryDimension(a) {
    const answers = [];
    if (a.b1) answers.push({ q: '求助场景', a: a.b1, label: getAnswerLabel('b1', a.b1) });
    if (a.b2) answers.push({ q: '结束信号', a: a.b2, label: getAnswerLabel('b2', a.b2) });
    if (a.b3) answers.push({ q: '关系距离', a: a.b3, label: getAnswerLabel('b3', a.b3) });

    if (answers.length === 0) return null;

    const parts = [];
    if (a.b1 === 'A') parts.push('卡住时才找AI');
    if (a.b1 === 'B') parts.push('脑子乱时找AI');
    if (a.b1 === 'C') parts.push('需要创意时找AI');
    if (a.b1 === 'D') parts.push('没事也聊两句');
    if (a.b1 === 'E') parts.push('系统性学习时找AI');

    if (a.b2 === 'A') parts.push('自己说够了就结束');
    if (a.b2 === 'B') parts.push('重复内容时结束');
    if (a.b2 === 'C') parts.push('感觉被push时结束');
    if (a.b2 === 'D') parts.push('问题解决就结束');
    if (a.b2 === 'E') parts.push('很少主动结束');

    if (a.b3 === 'A') parts.push('保持专业距离');
    if (a.b3 === 'B') parts.push('像朋友一样');
    if (a.b3 === 'C') parts.push('像导师一样');
    if (a.b3 === 'D') parts.push('像伙伴一样');

    const description = parts.length > 0 ? parts.join('，') + '。' : '未完整回答';

    return {
        id: 'boundary',
        name: '边界与节奏',
        icon: '🛡️',
        description: description,
        answers: answers
    };
}

function generateOneLiner(dimensions) {
    const descs = dimensions.map(d => d.description.replace(/。/g, '')).filter(d => d !== '未完整回答');
    if (descs.length === 0) return '一个独特的思考者';
    
    // 取前3个维度的核心特征组合
    const keyPoints = descs.slice(0, 3);
    return keyPoints.join('；') + '。';
}

function extractTagCloud(dimensions) {
    const tags = [];
    dimensions.forEach(dim => {
        dim.answers.forEach(ans => {
            // 从选项标签中提取关键词
            const label = ans.label;
            if (label && label !== '未回答' && label !== '未选择') {
                // 简化标签，取核心词
                const simplified = label.split(/[，。]/)[0].trim();
                if (simplified.length > 0 && simplified.length < 15) {
                    tags.push(simplified);
                }
            }
        });
    });
    return [...new Set(tags)].slice(0, 12); // 最多12个标签
}

function getAnswerLabel(key, value) {
    if (!value) return '未回答';
    if (Array.isArray(value)) return value.length > 0 ? value.map(v => {
        for (const dim of currentState.dimensions) {
            for (const q of dim.questions) {
                if (q.key === key) {
                    const opt = q.options.find(o => o.value === v);
                    return opt ? opt.label : v;
                }
            }
        }
        return v;
    }).join('、') : '未选择';
    
    for (const dim of currentState.dimensions) {
        for (const q of dim.questions) {
            if (q.key === key) {
                const opt = q.options.find(o => o.value === value);
                return opt ? opt.label : value;
            }
        }
    }
    return value;
}

// 旧的固定类型系统已替换为维度指纹系统
// 见 generateDimensionFingerprint 函数

function generateLocalDos(a) {
    const dos = [];
    if (a.m1 === 'A') dos.push({ category: '沟通', tip: '结论先行：先说结论，再问"需要详细解释吗？"' });
    if (a.m1 === 'B') dos.push({ category: '沟通', tip: '解释逻辑：给出建议时，说明"因为...所以..."的推理链' });
    if (a.m1 === 'C') dos.push({ category: '沟通', tip: '提供选项：列出2-3个方案，分析各自的利弊' });
    if (a.m1 === 'D') dos.push({ category: '沟通', tip: '共同探索：先问"你现在的想法是？"，再一起推演' });
    if (a.m2 === 'A') dos.push({ category: '反馈', tip: '直接纠偏：发现错误时说"这里有个问题：..."' });
    if (a.m2 === 'B') dos.push({ category: '反馈', tip: '苏格拉底式提问：用"如果...会怎样？"引导自我发现' });
    if (a.m3 === 'A') dos.push({ category: '情绪', tip: '情绪确认：用户烦躁时先确认"看起来你有些着急"' });
    if (a.m3 === 'B') dos.push({ category: '情绪', tip: '效率模式：用户烦躁时加速推进，快速给出解决方案' });
    if (a.c2 === 'A') dos.push({ category: '认知', tip: '善用类比：用"这就像..."来解释复杂概念' });
    return dos.length > 0 ? dos : [{ category: '通用', tip: '保持真诚和专业' }];
}

function generateLocalDonts(a) {
    const donts = [];
    if (a.m1 === 'A') donts.push({ category: '沟通', warning: '铺垫太长：结论藏在大段文字后面' });
    if (a.m1 === 'B') donts.push({ category: '沟通', warning: '无理由建议：说"你应该..."但不解释为什么' });
    if (a.m2 === 'A') donts.push({ category: '反馈', warning: '暗示纠错：绕弯子让用户猜哪里错了' });
    if (a.m2 === 'B') donts.push({ category: '反馈', warning: '直接否定：直接说"你错了"' });
    if (a.m3 === 'A') donts.push({ category: '情绪', warning: '忽略情绪：用户明显烦躁时还机械地推进' });
    return donts.length > 0 ? donts : [{ category: '通用', warning: '避免机械和冷漠' }];
}

function generateLocalScenarios(a) {
    return [
        {
            situation: '用户说"我有点迷茫，不知道该不该辞职"',
            good: a.m1 === 'D' ? '【共创型】"你现在的想法倾向于哪边？我们一起理一理。"' : 
                  a.m1 === 'A' ? '【结论型】"我建议先不辞职。原因：1. 2. 3. 你想深入了解哪个？"' :
                  '"这是一个需要慎重考虑的决定。先说说你现在的处境？"',
            bad: a.m1 === 'A' ? '【反面】"嗯，辞职这件事啊，要从很多角度来看...（5分钟后还没给结论）"' :
                 '"这是个个人选择，我不好给建议。你自己决定吧。"'
        },
        {
            situation: '用户明显情绪低落，但还是问了一个技术问题',
            good: a.m3 === 'A' ? '【情绪优先】"我注意到你似乎有些疲惫。要不要先聊聊感受？"' :
                  '"好，我们先解决这个问题。如果过程中你需要暂停，随时告诉我。"',
            bad: a.m3 === 'B' ? '【反面】"别难过了，我们来看技术问题。情绪不重要。"' :
                 '"听起来你情绪不太好。要不要我跟你聊聊人生？"'
        }
    ];
}

function detectLocalContradictions(a) {
    const contradictions = [];
    if (a.m1 === 'A' && a.m4 === 'C') {
        contradictions.push({ type: 'warning', message: '你偏好简短回答，但也喜欢详细信息。建议明确告诉 AI "先给概要，我需要时再展开"' });
    }
    return contradictions;
}

function showResult(profile) {
    showScreen('result');
    
    // 使用维度指纹的个性化描述
    const fingerprint = profile.fingerprint;
    document.getElementById('archetype-name').textContent = '你的 AI 互动画像';
    document.getElementById('archetype-desc').textContent = fingerprint.oneLiner;
    document.getElementById('trait-count').textContent = `${fingerprint.tags.length} 个特征标签`;
    document.getElementById('report-content').innerHTML = generateFullReportHTML(profile);
}

function generateQAReviewHTML() {
    let html = '<div class="qa-review-section"><h3>📝 完整问答记录</h3>';
    
    currentState.dimensions.forEach(dim => {
        html += `<div class="qa-dimension"><h4>${dim.name}</h4><p class="dim-desc">${dim.description}</p>`;
        
        dim.questions.forEach((q, idx) => {
            const answer = currentState.answers[q.key];
            
            html += `<div class="qa-item">
                <div class="qa-question"><span class="q-num">${idx + 1}.</span> ${q.question}</div>
                <div class="qa-options">`;
            
            // 列出所有选项，标记用户选择的
            q.options.forEach(opt => {
                const isSelected = Array.isArray(answer) 
                    ? answer.includes(opt.value) 
                    : answer === opt.value;
                const marker = isSelected ? '✓' : '○';
                const selectedClass = isSelected ? 'selected' : '';
                html += `<div class="qa-option ${selectedClass}">${marker} ${opt.label}</div>`;
            });
            
            html += `</div></div>`;
        });
        
        html += '</div>';
    });
    
    html += '</div>';
    return html;
}

function generateFullReportHTML(profile) {
    let html = '';
    const fingerprint = profile.fingerprint;
    
    // 特征标签云
    html += '<div class="traits-cloud"><h3>🏷️ 你的特征标签</h3><div class="traits-tags">';
    fingerprint.tags.forEach(tag => {
        html += `<span class="trait-tag">${tag}</span>`;
    });
    html += '</div></div>';

    // 五个维度详细分析
    html += '<div class="dimensions-section"><h3>📊 五个维度解析</h3>';
    
    fingerprint.dimensions.forEach(dim => {
        html += `<div class="dimension-card" data-dim="${dim.id}">
            <div class="dimension-header">
                <span class="dim-icon">${dim.icon}</span>
                <span class="dim-name">${dim.name}</span>
            </div>
            <div class="dimension-desc">${dim.description}</div>
            <div class="dimension-details">
                ${dim.answers.map(a => `<span class="dim-answer" title="${a.q}: ${a.label}">${a.q}</span>`).join(' · ')}
            </div>
        </div>`;
    });
    
    html += '</div>';

    // 行动指南
    html += '<div class="action-guide">';
    html += '<h3>✅ AI 应该这样做</h3><div class="guide-list">';
    profile.dos.forEach(d => {
        html += `<div class="guide-item do"><span class="guide-category">${d.category}</span><span class="guide-text">${d.tip}</span></div>`;
    });
    html += '</div></div>';

    html += '<div class="action-guide">';
    html += '<h3>🚫 千万不要</h3><div class="guide-list">';
    profile.donts.forEach(d => {
        html += `<div class="guide-item dont"><span class="guide-category">${d.category}</span><span class="guide-text">${d.warning}</span></div>`;
    });
    html += '</div></div>';

    // 问答回顾
    html += generateQAReviewHTML();

    // 场景示例
    if (profile.scenarios && profile.scenarios.length > 0) {
        html += '<div class="scenarios-section"><h3>🎬 场景示例</h3>';
        profile.scenarios.forEach((s, i) => {
            html += `<div class="scenario-card">
                <div class="scenario-title">场景 ${i + 1}: ${s.situation}</div>
                <div class="scenario-good">✅ ${s.good}</div>
                <div class="scenario-bad">❌ ${s.bad}</div>
            </div>`;
        });
        html += '</div>';
    }

    return html;
}

function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease';
    setTimeout(() => element.style.animation = '', 500);
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

async function downloadMarkdown() {
    try {
        const response = await fetch(`${API_URL}/download/${currentState.userId}`);
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `USER-${currentState.userId}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return;
        }
    } catch (error) {
        console.error('下载失败，使用本地生成:', error);
    }
    
    // 本地生成
    generateLocalMarkdown();
}

function generateLocalMarkdown() {
    const profile = currentState.profile;
    if (!profile) return;
    
    const userId = currentState.userId;
    const answers = currentState.answers;
    
    // 重新生成本地数据，确保与 HTML 一致
    const traits = [...new Set(extractAllTraits(answers))];
    const fingerprint = generateDimensionFingerprint(answers);
    const dos = generateLocalDos(answers);
    const donts = generateLocalDonts(answers);
    const scenarios = generateLocalScenarios(answers);
    
    let md = `# USER.md - ${userId} 的 AI 互动指南\n\n`;
    md += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;
    md += `---\n\n`;
    
    md += `## 🎭 你的 AI 互动画像\n\n`;
    md += `> ${fingerprint.oneLiner}\n\n`;
    md += `### 特征标签\n\n`;
    md += fingerprint.tags.map(t => `\`${t}\``).join(' · ');
    md += `\n\n---\n\n`;
    
    md += `## 📊 五个维度解析\n\n`;
    fingerprint.dimensions.forEach(dim => {
        md += `### ${dim.icon} ${dim.name}\n\n`;
        md += `${dim.description}\n\n`;
        md += `**关键选择**：`;
        md += dim.answers.map(ans => `${ans.q}(${ans.a})`).join('、');
        md += `\n\n`;
    });
    md += `---\n\n`;
    
    md += `## ✅ AI 应该这样做\n\n`;
    dos.forEach(d => {
        md += `**${d.category}**: ${d.tip}\n\n`;
    });
    md += `\n`;
    
    md += `## 🚫 千万不要\n\n`;
    donts.forEach(d => {
        md += `- ❌ **${d.category}**: ${d.warning}\n`;
    });
    md += `\n---\n\n`;
    
    if (scenarios && scenarios.length > 0) {
        md += `## 🎬 场景示例\n\n`;
        scenarios.forEach((s, i) => {
            md += `### 场景 ${i + 1}: ${s.situation}\n\n`;
            md += `✅ **好的回应**: ${s.good}\n\n`;
            md += `❌ **避免这样**: ${s.bad}\n\n`;
        });
        md += `---\n\n`;
    }

    // 问答回顾 - 完整版
    md += `## 📝 完整问答记录\n\n`;
    md += `> 以下是你在测评中回答的所有问题及选择。\n\n`;
    
    currentState.dimensions.forEach(dim => {
        md += `### ${dim.name}\n`;
        md += `_${dim.description}_\n\n`;

        dim.questions.forEach((q, idx) => {
            const answer = currentState.answers[q.key];
            
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
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `USER-${userId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function restartQuiz() {
    currentState.currentDimensionIndex = 0;
    currentState.currentQuestionIndex = 0;
    currentState.answers = {};
    currentState.currentMultiSelection = [];
    currentState.profile = null;
    document.getElementById('user-id').value = '';
    showScreen('home');
}

document.addEventListener('DOMContentLoaded', init);
