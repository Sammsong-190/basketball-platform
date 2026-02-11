# MySQL 数据库配置说明

## 1. 安装 MySQL

### macOS
```bash
# 使用 Homebrew 安装
brew install mysql

# 启动 MySQL 服务
brew services start mysql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### Windows
下载 MySQL Installer: https://dev.mysql.com/downloads/installer/

## 2. 创建数据库

登录 MySQL：
```bash
mysql -u root -p
```

创建数据库：
```sql
CREATE DATABASE basketball_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

退出 MySQL：
```sql
EXIT;
```

## 3. 配置 .env 文件

在项目根目录创建 `.env` 文件：

```env
# MySQL 连接字符串
# 格式: mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://root:your_password@localhost:3306/basketball_platform"

# JWT Secret
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
```

**重要**: 
- 将 `your_password` 替换为您的 MySQL root 密码
- 如果使用其他用户，替换 `root` 为您的用户名
- 如果 MySQL 运行在不同端口，修改 `3306` 为实际端口

## 4. 初始化数据库

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库模式到 MySQL
npm run db:push
```

## 5. 验证连接

```bash
# 打开 Prisma Studio 查看数据库
npm run db:studio
```

## 常见问题

### 连接被拒绝
- 检查 MySQL 服务是否运行: `brew services list` (macOS) 或 `sudo systemctl status mysql` (Linux)
- 检查端口是否正确（默认 3306）
- 检查防火墙设置

### 认证失败
- 确认用户名和密码正确
- 检查用户是否有访问数据库的权限

### 字符集问题
- 确保数据库使用 utf8mb4 字符集
- 在创建数据库时指定: `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`

## 从 SQLite 迁移到 MySQL

如果之前使用 SQLite，需要：
1. 备份 SQLite 数据（如果需要）
2. 更新 `.env` 文件中的 DATABASE_URL
3. 运行 `npm run db:push` 重新创建表结构
4. 导入数据（如果有备份）
