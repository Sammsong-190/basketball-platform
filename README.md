# 篮球用品电商社交平台

一个整合电商交易、社交互动与媒体内容三大功能的篮球用品平台，具有"内容—社群—消费"联动机制。

## 功能模块

### 1. 用户信息管理模块
- 个人信息管理
- 收藏管理（商品/帖子）
- 评论管理
- 支付订单管理
- 发布信息管理
- 支出信息管理
- 收入信息管理（卖家）

### 2. 社群互动模块
- 社区帖子管理（发布、编辑、删除）
- 评论与互动（点赞、分享）
- 赛事资讯管理
- 热门内容推荐
- 主题分类管理

### 3. 商品管理模块
- 商品信息管理（上架、编辑、下架）
- 商品类别管理
- 商品评价管理

### 4. 交易订单模块
- 购物车管理
- 订单状态管理
- 订单支付管理

### 5. 售后服务模块
- 退换货管理
- 投诉与建议管理

### 6. 系统管理模块
- 用户权限管理
- 帖子审核管理
- 评论审核管理
- 商品数据管理
- 维护日志管理

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Prisma ORM + MySQL
- **认证**: JWT

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置数据库

**1. 安装并启动 MySQL**

macOS:
```bash
brew install mysql
brew services start mysql
```

Linux:
```bash
sudo apt install mysql-server
sudo systemctl start mysql
```

**2. 创建数据库**

```bash
mysql -u root -p
```

```sql
CREATE DATABASE basketball_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**3. 配置环境变量**

创建 `.env` 文件：
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
```

**4. 初始化数据库**

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库模式到 MySQL
npm run db:push
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 其他命令

```bash
# 数据库迁移
npm run db:migrate

# 打开 Prisma Studio（数据库管理界面）
npm run db:studio

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── auth/          # 认证相关
│   │   ├── users/         # 用户管理
│   │   ├── posts/         # 帖子管理
│   │   ├── products/      # 商品管理
│   │   ├── orders/        # 订单管理
│   │   ├── cart/          # 购物车
│   │   └── admin/         # 系统管理
│   └── (auth)/            # 认证页面
├── lib/                    # 工具函数
│   ├── prisma.ts          # Prisma 客户端
│   ├── auth.ts            # 认证工具
│   ├── middleware.ts      # 中间件
│   └── utils.ts           # 通用工具
├── prisma/                 # 数据库模式
│   └── schema.prisma      # Prisma 模式定义
└── components/             # React 组件
```

## 环境变量

创建 `.env` 文件：

```
# MySQL 连接字符串
# 格式: mysql://用户名:密码@主机:端口/数据库名
DATABASE_URL="mysql://root:your_password@localhost:3306/basketball_platform"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

**注意**: 
- 将 `your_password` 替换为您的 MySQL root 密码
- 确保 MySQL 服务正在运行
- 数据库需要先创建: `CREATE DATABASE basketball_platform;`

## 许可证

MIT
