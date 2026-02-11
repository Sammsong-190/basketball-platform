#!/bin/bash

echo "🚀 立即初始化数据库"
echo "===================="
echo ""

# 配置 .env 文件
echo "1. 配置 .env 文件..."
cat > .env << 'EOFENV'
DATABASE_URL="mysql://root:522471614s@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="basketball-nextauth-secret-change-in-production"
EOFENV
echo "   ✅ .env 文件已配置"

# 创建数据库
echo ""
echo "2. 创建数据库..."
mysql -u root -p522471614s << 'EOFSQL' 2>/dev/null
CREATE DATABASE IF NOT EXISTS basketball_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES LIKE 'basketball_platform';
EOFSQL

if [ $? -eq 0 ]; then
    echo "   ✅ 数据库已准备就绪"
else
    echo "   ⚠️  数据库创建可能已存在或需要手动创建"
fi

# 生成 Prisma 客户端
echo ""
echo "3. 生成 Prisma 客户端..."
echo "   ⏳ 这通常需要 3-10 秒..."
START_GEN=$(date +%s)
npm run db:generate > /dev/null 2>&1
END_GEN=$(date +%s)
GEN_TIME=$((END_GEN - START_GEN))

if [ $? -eq 0 ]; then
    echo "   ✅ Prisma 客户端生成完成 (${GEN_TIME} 秒)"
else
    echo "   ❌ 生成失败"
    exit 1
fi

# 推送数据库模式
echo ""
echo "4. 推送数据库模式到 MySQL..."
echo "   ⏳ 正在创建 21 个数据表，这可能需要 10-30 秒..."
echo "   💡 请耐心等待，这是正常速度"
START_PUSH=$(date +%s)
npm run db:push
PUSH_EXIT=$?
END_PUSH=$(date +%s)
PUSH_TIME=$((END_PUSH - START_PUSH))

if [ $PUSH_EXIT -eq 0 ]; then
    echo ""
    echo "   ✅ 数据库模式推送完成！"
    echo "   ⏱️  耗时: ${PUSH_TIME} 秒"
else
    echo ""
    echo "   ❌ 推送失败，请检查错误信息"
    exit 1
fi

# 测试连接
echo ""
echo "5. 测试数据库连接..."
npm run db:test 2>&1 | head -5

TOTAL_TIME=$((GEN_TIME + PUSH_TIME))
echo ""
echo "🎉 数据库初始化完成！"
echo "⏱️  总耗时: ${TOTAL_TIME} 秒"
echo ""
echo "📊 性能分析："
if [ $TOTAL_TIME -lt 20 ]; then
    echo "   ✅ 速度很快！"
elif [ $TOTAL_TIME -lt 40 ]; then
    echo "   ✅ 速度正常"
elif [ $TOTAL_TIME -lt 60 ]; then
    echo "   ⚠️  稍慢，但可接受"
else
    echo "   ⚠️  较慢，可能的原因："
    echo "      - MySQL 服务响应慢"
    echo "      - 磁盘 I/O 慢"
    echo "      - 网络延迟"
fi
