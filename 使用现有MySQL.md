# 使用现有 MySQL 连接指南

## ✅ 好消息！

检测到您的系统已安装 MySQL（通过 Anaconda，版本 5.7.24）。

## 🚀 快速连接步骤

### 步骤 1: 测试 MySQL 连接

```bash
# 测试无密码连接
mysql -u root -e "SELECT 1;"

# 如果需要密码
mysql -u root -p
```

### 步骤 2: 创建数据库

```bash
mysql -u root -p
```

在 MySQL 命令行中执行：

```sql
CREATE DATABASE IF NOT EXISTS basketball_platform 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SHOW DATABASES;
EXIT;
```

### 步骤 3: 配置 .env 文件

在项目根目录的 `.env` 文件中配置：

**如果 root 没有密码：**
```env
DATABASE_URL="mysql://root@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-2024"
```

**如果 root 有密码：**
```env
DATABASE_URL="mysql://root:你的密码@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-2024"
```

### 步骤 4: 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库模式
npm run db:push

# 测试连接
npm run db:test
```

## 🔍 检查 MySQL 服务状态

```bash
# 检查 MySQL 进程
ps aux | grep mysql

# 检查端口
lsof -i :3306

# 测试连接
mysql -u root -e "SHOW DATABASES;"
```

## ⚠️ 注意事项

1. **Anaconda 的 MySQL** 可能没有作为系统服务运行
2. 如果 MySQL 未运行，需要手动启动
3. 确保 MySQL 监听在 3306 端口

## 🆘 如果 MySQL 未运行

如果 MySQL 服务未运行，可以：

1. **使用 Anaconda 环境启动**（如果适用）
2. **安装 Homebrew MySQL 服务**：
   ```bash
   brew install mysql
   brew services start mysql
   ```
3. **或使用 MariaDB**：
   ```bash
   brew install mariadb
   brew services start mariadb
   ```

## ✅ 验证连接

运行测试脚本：

```bash
npm run db:test
```

如果看到 "✅ 数据库连接成功！"，说明一切正常！
