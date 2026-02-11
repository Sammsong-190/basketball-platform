#!/bin/bash

# 前后端分离项目启动脚本

echo "🚀 启动前后端分离项目..."

# 检查后端依赖
if [ ! -d "backend/node_modules" ]; then
  echo "📦 安装后端依赖..."
  cd backend
  npm install
  cd ..
fi

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 安装前端依赖..."
  cd frontend
  npm install
  cd ..
fi

# 检查后端环境变量
if [ ! -f "backend/.env" ]; then
  echo "⚠️  后端 .env 文件不存在，请从 .env.example 复制并配置"
  echo "   cp backend/.env.example backend/.env"
fi

# 检查前端环境变量
if [ ! -f "frontend/.env" ]; then
  echo "⚠️  前端 .env 文件不存在，请从 .env.example 复制并配置"
  echo "   cp frontend/.env.example frontend/.env"
fi

# 启动后端（后台运行）
echo "🔧 启动后端服务器..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 启动前端
echo "🎨 启动前端应用..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ 项目已启动！"
echo "   后端: http://localhost:3001"
echo "   前端: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
