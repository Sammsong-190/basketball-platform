#!/bin/bash

# 使用 MySQL 命令行更新用户为管理员
# 使用方法：./使用MySQL更新管理员.sh <用户名>

echo "🔧 使用 MySQL 更新用户为管理员"
echo ""

# 检查是否提供了用户名
if [ -z "$1" ]; then
    echo "❌ 请提供用户名！"
    echo "📝 使用方法：./使用MySQL更新管理员.sh <用户名>"
    echo "   例如：./使用MySQL更新管理员.sh admin"
    exit 1
fi

USERNAME=$1

# 从 .env 文件读取数据库配置
if [ ! -f .env ]; then
    echo "❌ 找不到 .env 文件！"
    exit 1
fi

# 提取数据库连接信息
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2 | tr -d '"')

# 解析数据库连接信息
# 格式：mysql://root:password@localhost:3306/database
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 数据库信息："
echo "   主机: $DB_HOST"
echo "   端口: $DB_PORT"
echo "   数据库: $DB_NAME"
echo "   用户: $DB_USER"
echo ""

# 执行 SQL 更新
echo "🔄 正在更新用户 '$USERNAME' 为管理员..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" <<EOF
UPDATE User SET role = 'ADMIN' WHERE username = '$USERNAME';
SELECT username, email, role FROM User WHERE username = '$USERNAME';
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 更新成功！"
    echo "🔄 请退出登录后重新登录以刷新权限！"
else
    echo ""
    echo "❌ 更新失败，请检查："
    echo "   1. MySQL 服务是否运行"
    echo "   2. 数据库连接信息是否正确"
    echo "   3. 用户名是否存在"
fi
