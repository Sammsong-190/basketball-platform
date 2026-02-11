#!/bin/bash

echo "🔧 数据库连接和初始化脚本"
echo "================================"
echo ""

# 检查 MySQL 是否运行
echo "1. 检查 MySQL 服务状态..."
if pgrep -x "mysqld" > /dev/null || brew services list | grep mysql | grep started > /dev/null 2>&1; then
    echo "✅ MySQL 服务正在运行"
else
    echo "⚠️  MySQL 服务未运行，尝试启动..."
    if command -v brew &> /dev/null; then
        brew services start mysql
        sleep 2
    else
        echo "❌ 请手动启动 MySQL 服务"
        exit 1
    fi
fi

echo ""
echo "2. 检查数据库是否存在..."
DB_EXISTS=$(mysql -u root -p$(echo $MYSQL_PASSWORD) -e "SHOW DATABASES LIKE 'basketball_platform';" 2>/dev/null | grep basketball_platform)

if [ -z "$DB_EXISTS" ]; then
    echo "📦 创建数据库..."
    mysql -u root -p$(echo $MYSQL_PASSWORD) << EOF
CREATE DATABASE IF NOT EXISTS basketball_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF
    echo "✅ 数据库创建成功"
else
    echo "✅ 数据库已存在"
fi

echo ""
echo "3. 生成 Prisma 客户端..."
npm run db:generate

echo ""
echo "4. 推送数据库模式..."
npm run db:push

echo ""
echo "✅ 数据库连接和初始化完成！"
