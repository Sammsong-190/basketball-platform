# 修复 .env 配置错误

## ❌ 错误信息

```
Error: Prisma schema validation
error: Error validating datasource `db`: the URL must start with the protocol `mysql://`.
```

## 🔍 问题原因

`.env` 文件中的 `DATABASE_URL` 格式不正确或文件不存在。

## ✅ 解决方案

### 方法一：使用修复脚本（最简单）

```bash
./修复env配置.sh
```

### 方法二：手动创建 .env 文件

在项目根目录创建 `.env` 文件，内容如下：

```env
DATABASE_URL="mysql://root:522471614s@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="basketball-nextauth-secret-change-in-production"
```

### 方法三：使用命令行创建

```bash
cat > .env << 'EOF'
DATABASE_URL="mysql://root:522471614s@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="basketball-nextauth-secret-change-in-production"
EOF
```

## ⚠️ 重要注意事项

1. **必须使用双引号**：`DATABASE_URL="mysql://..."`
2. **必须以 mysql:// 开头**：不能是 `file://` 或其他协议
3. **格式正确**：`mysql://用户名:密码@主机:端口/数据库名`

## ✅ 验证配置

创建 `.env` 文件后，运行：

```bash
# 验证配置
cat .env | grep DATABASE_URL

# 应该看到：
# DATABASE_URL="mysql://root:522471614s@localhost:3306/basketball_platform"

# 然后测试
npm run db:push
```

## 🚀 完整初始化流程

```bash
# 1. 修复 .env 配置
./修复env配置.sh

# 2. 创建数据库（如果还没创建）
mysql -u root -p522471614s -e "CREATE DATABASE IF NOT EXISTS basketball_platform;"

# 3. 生成 Prisma 客户端
npm run db:generate

# 4. 推送数据库模式
npm run db:push

# 5. 测试连接
npm run db:test
```

## 📋 常见错误格式

❌ **错误示例：**
```env
DATABASE_URL=mysql://root:522471614s@localhost:3306/basketball_platform
# 缺少引号

DATABASE_URL='mysql://root:522471614s@localhost:3306/basketball_platform'
# 单引号可能有问题

DATABASE_URL="file:./dev.db"
# 这是 SQLite 格式，不是 MySQL
```

✅ **正确格式：**
```env
DATABASE_URL="mysql://root:522471614s@localhost:3306/basketball_platform"
```

完成修复后，重新运行 `npm run db:push` 即可！
