# MySQL 安装指南

## 当前状态
MySQL 未通过 Homebrew 安装。以下是安装方法：

## 方法一：使用 Homebrew 安装（推荐）

### 安装 MySQL

```bash
# 安装 MySQL
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 验证安装
mysql --version
```

### 初始化 MySQL（首次安装后）

```bash
# 运行安全设置（设置 root 密码等）
mysql_secure_installation
```

## 方法二：使用 MySQL 官方安装包

1. 访问 MySQL 官网：https://dev.mysql.com/downloads/mysql/
2. 下载 macOS 安装包（.dmg 文件）
3. 运行安装程序
4. 按照向导完成安装

## 方法三：使用 MariaDB（MySQL 兼容）

```bash
# 安装 MariaDB（MySQL 的替代品，完全兼容）
brew install mariadb

# 启动服务
brew services start mariadb
```

MariaDB 与 MySQL 完全兼容，可以使用相同的连接字符串。

## 安装后配置

### 1. 启动 MySQL 服务

```bash
# Homebrew 安装的 MySQL
brew services start mysql

# 或 MariaDB
brew services start mariadb
```

### 2. 创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE basketball_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. 配置 .env 文件

```env
DATABASE_URL="mysql://root:你的密码@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-2024"
```

## 验证安装

```bash
# 检查 MySQL 版本
mysql --version

# 检查服务状态
brew services list | grep mysql

# 测试连接
mysql -u root -p -e "SHOW DATABASES;"
```

## 常见问题

### 问题 1: 安装失败
**解决**: 确保 Homebrew 已更新
```bash
brew update
brew install mysql
```

### 问题 2: 服务无法启动
**解决**: 检查端口是否被占用
```bash
lsof -i :3306
```

### 问题 3: 忘记 root 密码
**解决**: 重置密码
```bash
# 停止 MySQL
brew services stop mysql

# 以安全模式启动
mysqld_safe --skip-grant-tables &

# 重置密码
mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
FLUSH PRIVILEGES;
EXIT;
```

## 推荐方案

**推荐使用 MariaDB**（更轻量，完全兼容 MySQL）：

```bash
brew install mariadb
brew services start mariadb
```

然后使用相同的连接字符串即可。
