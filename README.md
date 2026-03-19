# 篮球用品电商社交平台

一个整合电商交易、社交互动与媒体内容三大功能的篮球用品平台，具有「内容—社群—消费」联动机制。

## 功能模块

### 1. 用户信息管理模块

| 功能 | 状态 | 说明 |
|------|------|------|
| 个人信息管理 | ✅ 已实现 | 头像、手机号编辑，个人中心展示 |
| 收藏管理（商品/帖子） | ✅ 已实现 | 仪表盘收藏列表，可查看商品/帖子 |
| 评论管理 | ✅ 已实现 | 仪表盘我的评论，支持帖子/商品评论 |
| 发布信息管理 | ✅ 已实现 | 仪表盘我的帖子 |
| 收入信息管理（卖家） | ⚠️ 未实现 | API 已存在，无前端页面 |
| 支出信息管理 | ⚠️ 未实现 | API 已存在，无前端页面 |

### 2. 社群互动模块

| 功能 | 状态 | 说明 |
|------|------|------|
| 社区帖子管理 | ✅ 已实现 | 发布、编辑、删除、审核流程 |
| 评论与互动 | ✅ 已实现 | 点赞、评论、回复，支持审核 |
| 赛事资讯管理 | ✅ 已实现 | NBA 赛程、比分、新闻（ESPN API） |
| 热门内容推荐 | ⚠️ 部分实现 | 帖子有 isHot 字段，推荐逻辑待完善 |
| 主题分类管理 | ✅ 已实现 | 帖子分类、商品分类，管理员可维护 |

### 3. 商品管理模块

| 功能 | 状态 | 说明 |
|------|------|------|
| 商品信息管理 | ✅ 已实现 | 上架、编辑、下架，Platform Managed / Free Trade |
| 商品类别管理 | ✅ 已实现 | 分类管理，支持父子级 |
| 商品评价管理 | ✅ 已实现 | 商品详情页评价展示，API 支持 |
| 商品爬取 | ✅ 已实现 | 管理员可爬取电商商品入库 |

### 4. 交易订单模块

| 功能 | 状态 | 说明 |
|------|------|------|
| 购物车管理 | ✅ 已实现 | 增删改查，结算下单 |
| 订单创建 | ✅ 已实现 | 购物车结算、立即购买 |
| 订单列表 | ✅ 已实现 | 仪表盘我的订单 |
| 订单详情页 | ⚠️ 未实现 | 链接存在但 `/orders/[id]` 页面缺失 |
| 订单支付 | ⚠️ 部分实现 | 支付 API 存在，前端流程待完善 |
| 订单状态管理 | ⚠️ 部分实现 | 状态流转逻辑待完善 |

### 5. 售后服务模块

| 功能 | 状态 | 说明 |
|------|------|------|
| 退换货管理 | ⚠️ 未实现 | API 已存在，无前端页面 |
| 投诉与建议管理 | ⚠️ 未实现 | API 已存在，无前端页面 |

### 6. 系统管理模块

| 功能 | 状态 | 说明 |
|------|------|------|
| 帖子审核管理 | ✅ 已实现 | 通过/拒绝/删除，支持已发布内容 |
| 评论审核管理 | ✅ 已实现 | 通过/拒绝/删除，支持已发布评论 |
| 商品审核管理 | ✅ 已实现 | 上架/下架/删除 |
| 用户权限管理 | ⚠️ 未实现 | 用户管理 API 存在，无管理界面 |
| 维护日志管理 | ⚠️ 未实现 | 日志 API 存在，无查看界面 |

---

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Prisma ORM + MySQL
- **认证**: JWT

---

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

在根目录或 `apps/web/` 下创建 `.env` 文件：
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/basketball_platform"
JWT_SECRET="basketball-platform-secret-key-change-in-production-2024"
```

**4. 初始化数据库**

```bash
npm run db:generate
npm run db:push
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 其他命令

```bash
npm run dev:web       # 仅启动主站 (apps/web)
npm run dev:admin     # 仅启动管理后台 (apps/admin)
npm run dev:backend   # 仅启动 Express 后端
npm run db:migrate    # 数据库迁移
npm run db:studio     # Prisma Studio 数据库管理
npm run build         # 构建主站生产版本
npm start             # 启动主站生产服务器
npm run create-admin  # 创建管理员账户
```

---

## 项目结构 (Monorepo)

```
/ (根目录)
├── apps/
│   ├── web/                 # [主站] Next.js 篮球电商社交平台 (SSR)
│   │   ├── app/             # 路由与 API
│   │   │   ├── api/         # API 路由 (auth, users, posts, products, orders...)
│   │   │   ├── admin/       # 管理员后台
│   │   │   ├── dashboard/   # 用户仪表盘
│   │   │   ├── products/    # 商品
│   │   │   ├── posts/       # 帖子
│   │   │   ├── events/      # NBA 赛事
│   │   │   └── ...
│   │   ├── components/      # 公共组件
│   │   ├── lib/             # 工具与逻辑
│   │   └── prisma/          # 数据库 Schema
│   │
│   └── admin/               # [后台] Vite React 管理应用 (CSR)
│       └── src/
│
├── backend/                 # Express.js 后端 API 服务
│   ├── src/
│   └── prisma/
│
├── scripts/                 # Python 爬虫与维护脚本
│   └── nba_scraper.py
│
├── package.json             # 根配置 (Workspaces)
└── .gitignore
```

---

## 环境变量

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接字符串，格式: `mysql://用户:密码@主机:端口/数据库名` |
| `JWT_SECRET` | JWT 签名密钥，生产环境务必更换 |

---

## 未实现功能清单（待开发）

- [ ] 订单详情页 `/orders/[id]`
- [ ] 订单支付完整流程（含支付结果页）
- [ ] 退换货申请与处理界面
- [ ] 投诉与建议提交与查看界面
- [ ] 卖家收入/支出统计与展示
- [ ] 管理员用户管理界面
- [ ] 系统维护日志查看界面
- [ ] 热门内容推荐算法与展示优化

---

## 许可证

MIT
