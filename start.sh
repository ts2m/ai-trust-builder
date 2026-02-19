#!/bin/bash

echo "🚀 启动 AI Trust Builder..."
echo ""

# 检查是否在正确的目录
if [ ! -f "backend/server.js" ]; then
    echo "❌ 错误: 请在 ai-trust-builder 目录下运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 启动服务器
echo "🌐 启动服务器..."
echo ""
echo "服务将在以下地址可用:"
echo "  - 网页界面: http://localhost:3000"
echo "  - API 接口: http://localhost:3000/api"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd backend && npm start
