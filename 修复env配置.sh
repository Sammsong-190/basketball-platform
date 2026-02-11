#!/bin/bash

echo "🔧 修复 .env 配置"
echo "=================="
echo ""

# 创建正确的 .env 文件
cat > .env << 'EOFENV'
DATABASE_URL="mysql://root:522471614s@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="basketball-nextauth-secret-change-in-production"
EOFENV

echo "✅ .env 文件已修复"
echo ""
echo "📋 配置内容："
cat .env
echo ""

# 验证格式
echo "🔍 验证配置..."
if grep -q 'mysql://' .env; then
    echo "✅ DATABASE_URL 格式正确"
else
    echo "❌ DATABASE_URL 格式错误"
    exit 1
fi

echo ""
echo "🚀 现在可以运行："
echo "   npm run db:push"
echo "   npm run db:test"
