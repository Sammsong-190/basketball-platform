#!/bin/bash
echo "🚀 启动篮球用品电商社交平台 (Monorepo)..."
echo ""
echo "步骤 1: 安装依赖"
npm install
echo ""
echo "步骤 2: 生成 Prisma 客户端"
npm run db:generate
echo ""
echo "步骤 3: 初始化数据库"
npm run db:push
echo ""
echo "步骤 4: 启动主站开发服务器 (apps/web)"
npm run dev
