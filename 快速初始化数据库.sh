#!/bin/bash

echo "🚀 快速数据库初始化脚本"
echo "========================"
echo ""

# 检查 MySQL 服务
echo "1. 检查 MySQL 服务状态..."
if lsof -i :3306 > /dev/null 2>&1; then
    echo "   ✅ MySQL 服务正在运行"
else
    echo "   ❌ MySQL 服务未运行"
    echo "   💡 请先启动 MySQL 服务"
    echo "   尝试: brew services start mysql 或 brew services start mariadb"
    exit 1
fi

# 检查 .env 文件
echo ""
echo "2. 检查 .env 配置..."
if [ -f .env ] && grep -q "DATABASE_URL" .env; then
    echo "   ✅ .env 文件已配置"
    DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    echo "   📋 连接: ${DB_URL:0:30}..."
else
    echo "   ❌ .env 文件未配置"
    echo "   💡 请配置 DATABASE_URL"
    exit 1
fi

# 测试连接
echo ""
echo "3. 测试数据库连接..."
timeout 5 node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('   ✅ 连接成功');
    prisma.\$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.log('   ❌ 连接失败:', err.message);
    process.exit(1);
  });
" 2>&1

if [ $? -ne 0 ]; then
    echo "   ⚠️  连接测试失败，但继续尝试初始化..."
fi

# 生成 Prisma 客户端
echo ""
echo "4. 生成 Prisma 客户端..."
npm run db:generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Prisma 客户端生成完成"
else
    echo "   ❌ 生成失败"
    exit 1
fi

# 推送数据库模式
echo ""
echo "5. 推送数据库模式到 MySQL..."
echo "   ⏳ 这可能需要一些时间（创建所有表）..."
START_TIME=$(date +%s)
npm run db:push 2>&1 | tee /tmp/db-push.log
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $? -eq 0 ]; then
    echo ""
    echo "   ✅ 数据库模式推送完成！"
    echo "   ⏱️  耗时: ${DURATION} 秒"
else
    echo ""
    echo "   ❌ 推送失败"
    echo "   📋 查看日志: cat /tmp/db-push.log"
    exit 1
fi

# 验证
echo ""
echo "6. 验证数据库..."
npm run db:test 2>&1 | head -3

echo ""
echo "🎉 数据库初始化完成！"
