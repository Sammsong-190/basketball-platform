#!/bin/bash

echo "🔍 数据库状态检查"
echo "=================="
echo ""

# 检查 MySQL 服务
echo "1. 检查 MySQL 服务..."
if pgrep -x "mysqld" > /dev/null 2>&1; then
    echo "   ✅ MySQL 服务正在运行"
else
    echo "   ❌ MySQL 服务未运行"
    echo "   💡 请运行: brew services start mysql"
fi

# 检查 .env 文件
echo ""
echo "2. 检查 .env 文件..."
if [ -f .env ]; then
    echo "   ✅ .env 文件存在"
    if grep -q "DATABASE_URL" .env; then
        DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        echo "   📋 DATABASE_URL: $DB_URL"
        
        # 检查是否是 MySQL
        if [[ $DB_URL == mysql://* ]]; then
            echo "   ✅ 使用 MySQL 数据库"
        else
            echo "   ⚠️  不是 MySQL 连接字符串"
        fi
    else
        echo "   ❌ DATABASE_URL 未配置"
    fi
else
    echo "   ❌ .env 文件不存在"
fi

# 检查 Prisma 客户端
echo ""
echo "3. 检查 Prisma 客户端..."
if [ -d "node_modules/@prisma/client" ]; then
    echo "   ✅ Prisma 客户端已生成"
else
    echo "   ❌ Prisma 客户端未生成"
    echo "   💡 请运行: npm run db:generate"
fi

# 尝试连接数据库
echo ""
echo "4. 测试数据库连接..."
if [ -f "test-db-connection.js" ]; then
    node test-db-connection.js 2>&1 | head -3
else
    echo "   ⚠️  测试脚本不存在"
fi

echo ""
echo "检查完成！"
