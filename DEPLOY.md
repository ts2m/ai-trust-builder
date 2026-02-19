# 🚀 部署指南 - AI Trust Builder

## 方案一：Render 免费部署（推荐）

### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称填：`ai-trust-builder`
3. 选择 "Public"（公开）
4. 点击 "Create repository"
5. 复制下方显示的推送命令，类似：
```bash
git remote add origin https://github.com/你的用户名/ai-trust-builder.git
git branch -M main
git push -u origin main
```

### 步骤 2：推送代码到 GitHub

在终端执行：
```bash
cd ~/Desktop/ai-trust-builder
git remote add origin https://github.com/你的用户名/ai-trust-builder.git
git branch -M main
git push -u origin main
```

### 步骤 3：部署到 Render

1. 访问 https://dashboard.render.com
2. 点击 "New +" → "Blueprint"
3. 连接你的 GitHub 账号
4. 选择 `ai-trust-builder` 仓库
5. 点击 "Apply"
6. 等待 3-5 分钟部署完成
7. 获得专属链接：`https://ai-trust-builder.onrender.com`

### 步骤 4：分享到小红书

复制链接，发布笔记！

---

## 方案二：阿里云/腾讯云（国内访问快）

如果你希望国内用户访问更快：

1. 购买轻量应用服务器（约 100元/年）
2. 安装 Node.js
3. 上传代码
4. 配置域名（需备案）

适合长期运营，前期推荐 Render。

---

## 📱 小红书发布清单

### 必备素材
- [ ] 3-5 张截图（首页、问卷过程、结果展示）
- [ ] 1 个简短录屏（15-30秒，展示使用过程）
- [ ] 部署好的链接
- [ ] 二维码（可用 https://cli.im 生成）

### 发布时间
- 最佳：工作日晚 20:00-22:00
- 次佳：周末下午 14:00-17:00

### 话题标签
```
#AI工具 #效率神器 #ChatGPT #人工智能 #自我认知 #人格测试 #MBTI #生产力工具 #数码科技 #宝藏APP
```

---

## 🆘 常见问题

**Q: Render 免费版能用多久？**
A: 每月 750 小时，足够个人项目使用。如果超过，需升级到 $7/月。

**Q: 数据安全吗？**
A: SQLite 数据存储在 Render 服务器上，只有你和管理员能访问。

**Q: 能自定义问题吗？**
A: 可以！修改 `backend/questions.json` 文件，重新部署即可。

---

祝你部署顺利！有问题随时问 🎉