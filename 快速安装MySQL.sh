#!/bin/bash

echo "🚀 MySQL/MariaDB 快速安装脚本"
echo "================================"
echo ""

# 检查是否已安装
if command -v mysql &> /dev/null; then
    echo "✅ MySQL/MariaDB 已安装"
    mysql --version
    echo ""
    echo "启动服务..."
    if brew services list | grep -E "(mysql|mariadb)" | grep started > /dev/null 2>&1; then
        echo "✅ 服务已在运行"
    else
        echo "正在启动服务..."
        brew services start mysql 2>/dev/null || brew services start mariadb
    fi
    exit 0
fi

echo "选择安装方式："
echo "1. MariaDB (推荐，轻量且兼容 MySQL)"
echo "2. MySQL (官方版本)"
echo ""
read -p "请选择 (1/2): " choice

case $choice in
    1)
        echo "📦 安装 MariaDB..."
        brew install mariadb
        echo "🚀 启动 MariaDB 服务..."
        brew services start mariadb
        echo "✅ MariaDB 安装并启动完成！"
        echo ""
        echo "💡 使用相同的 MySQL 连接字符串即可"
        ;;
    2)
        echo "📦 安装 MySQL..."
        brew install mysql
        echo "🚀 启动 MySQL 服务..."
        brew services start mysql
        echo "✅ MySQL 安装并启动完成！"
        echo ""
        echo "💡 首次安装后建议运行: mysql_secure_installation"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📋 下一步："
echo "1. 创建数据库: mysql -u root -p"
echo "2. 配置 .env 文件"
echo "3. 运行: npm run db:push"
