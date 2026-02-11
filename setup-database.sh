#!/bin/bash

echo "🚀 开始数据库设置..."
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cat > .env << 'EOFENV'
DATABASE_URL="mysql://root:@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-2024"
EOFENV
    echo "✅ .env 文件已创建（请根据实际情况修改密码）"
    echo ""
fi

# 读取 DATABASE_URL
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"')
echo "📋 当前 DATABASE_URL: $DB_URL"
echo ""

# 提取密码（如果有）
if [[ $DB_URL == *":"*"@"* ]]; then
    echo "⚠️  检测到需要密码，请确保 MySQL root 密码已配置在 .env 文件中"
    echo ""
fi

# 生成 Prisma 客户端
echo "1️⃣ 生成 Prisma 客户端..."
npm run db:generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma 客户端生成成功"
else
    echo "❌ Prisma 客户端生成失败"
    exit 1
fi

echo ""
echo "2️⃣ 推送数据库模式到 MySQL..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ 数据库模式推送成功"
else
    echo "❌ 数据库模式推送失败"
    echo "💡 请检查："
    echo "   1. MySQL 服务是否运行"
    echo "   2. .env 文件中的 DATABASE_URL 是否正确"
    echo "   3. 数据库是否已创建"
    exit 1
fi

echo ""
echo "3️⃣ 测试数据库连接..."
npm run db:test

echo ""
echo "🎉 数据库设置完成！"
