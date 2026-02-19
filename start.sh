#!/bin/bash

# AI Trust Builder 启动脚本

echo "🚀 启动 AI Trust Builder..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装"
    exit 1
fi

# 进入后端目录
cd "$(dirname "$0")/backend"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动服务器
echo "🌐 启动服务器..."
echo "应用将在 http://localhost:3000 运行"
echo "按 Ctrl+C 停止服务器"
echo ""

npm start