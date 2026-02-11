# 解决 Loading 一直显示的问题

## 🔍 问题原因

页面一直显示 loading 可能由以下原因导致：

1. **API 请求超时或卡住**（最常见）
2. **数据库迁移后 Prisma Client 未重新生成**
3. **网络请求失败但没有正确处理错误**

## ✅ 已修复的内容

### 1. 添加超时控制
- 主 API 请求：30 秒超时
- 新闻 API 请求：10 秒超时
- 超时后自动取消请求并显示错误

### 2. 改进错误处理
- 所有错误都会被捕获
- `finally` 块确保 `loading` 总是被设置为 `false`
- 添加了详细的错误日志

## 🚀 解决步骤

### 步骤 1：重新生成 Prisma Client

如果你刚刚执行了数据库迁移（添加了 `contentType` 字段），**必须**重新生成 Prisma Client：

```bash
npx prisma generate
```

### 步骤 2：重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

### 步骤 3：检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签：

- 如果有错误信息，告诉我具体的错误
- 查看是否有 "获取数据失败" 或 "请求超时" 的日志

### 步骤 4：检查网络请求

在 Network 标签中：

1. 刷新页面
2. 查看 `/api/nba/scrape?type=all` 请求
   - 状态码是什么？（200/500/超时？）
   - 响应时间是多少？
3. 查看 `/api/posts?isNews=true` 请求（如果有）
   - 状态码是什么？

## 🔧 常见问题排查

### 问题 1：Prisma 错误

**错误信息：**
```
Unknown arg `contentType` in data.contentType
```

**解决方法：**
```bash
npx prisma generate
npm run dev  # 重启服务器
```

### 问题 2：数据库连接失败

**错误信息：**
```
Can't reach database server
```

**解决方法：**
1. 检查 MySQL 是否运行
2. 检查 `.env` 中的 `DATABASE_URL` 是否正确
3. 测试连接：`npm run db:test`

### 问题 3：API 请求超时

**现象：** 请求一直 pending，30 秒后超时

**可能原因：**
- Python 爬虫脚本执行很慢
- 网络问题
- NBA API 响应慢

**解决方法：**
- 检查终端中 Python 脚本的输出
- 查看是否有错误信息

### 问题 4：CORS 或网络错误

**错误信息：**
```
Failed to fetch
NetworkError
```

**解决方法：**
- 检查开发服务器是否运行（`npm run dev`）
- 检查端口是否正确（默认 3000）

## 📝 临时解决方案

如果问题持续，可以临时禁用自动更新：

在 `app/events/page.tsx` 中，注释掉自动更新逻辑：

```typescript
// 临时禁用自动更新
useEffect(() => {
  fetchData()
  // const updateInterval = activeTab === 'scores' ? 30 * 1000 : 5 * 60 * 1000
  // const interval = setInterval(() => {
  //   fetchData()
  // }, updateInterval)
  // return () => clearInterval(interval)
}, [activeTab])
```

## 🐛 调试技巧

### 1. 添加更多日志

在 `fetchData` 函数中添加：

```typescript
console.log('开始获取数据...')
// ... 你的代码
console.log('数据获取完成，loading 设置为 false')
```

### 2. 检查状态

在组件中添加：

```typescript
useEffect(() => {
  console.log('Loading 状态:', loading)
}, [loading])
```

### 3. 手动测试 API

在浏览器中直接访问：

```
http://localhost:3000/api/nba/scrape?type=all
http://localhost:3000/api/posts?isNews=true
```

查看返回的 JSON 数据是否正确。

## 📞 如果问题仍然存在

请提供以下信息：

1. **浏览器控制台的错误信息**（截图或复制文本）
2. **Network 标签中的请求状态**（状态码、响应时间）
3. **终端中的错误信息**（如果有）
4. **具体是哪个页面**一直 loading（events、posts、dashboard？）

这样我可以更准确地帮你定位问题。
