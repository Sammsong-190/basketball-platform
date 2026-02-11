# NBA数据爬虫安装说明

## 安装依赖

由于权限限制，请手动在终端执行以下命令安装依赖：

```bash
cd "/Users/song666/Desktop/未命名文件夹"
npm install cheerio axios --save
```

或者如果遇到权限问题，可以尝试：

```bash
npm install cheerio axios --save --legacy-peer-deps
```

## 功能说明

### 1. 爬虫API端点

- **GET /api/nba/scrape?type=all** - 获取赛程和新闻
- **GET /api/nba/scrape?type=schedule** - 仅获取赛程
- **GET /api/nba/scrape?type=news** - 仅获取新闻

### 2. 数据来源

爬虫会尝试从以下来源获取数据：

1. **NBA官方API** (`stats.nba.com`)
   - 获取赛程和实时比分
   - 需要正确的请求头以避免被拦截

2. **NBA官网** (`www.nba.com/news`)
   - 使用cheerio解析HTML获取新闻
   - 可能需要根据网站结构调整选择器

3. **备用数据**
   - 如果爬虫失败，自动使用模拟数据
   - 确保页面始终有数据显示

## 注意事项

### ⚠️ 反爬虫机制

NBA官网可能有以下反爬虫措施：
- IP限制
- User-Agent检测
- 请求频率限制
- CORS限制

### 💡 解决方案

1. **使用代理IP**
   - 可以配置代理服务器来避免IP限制

2. **使用第三方API**
   - RapidAPI的NBA API
   - ball-dont-lie API（免费）
   - ESPN API

3. **设置请求延迟**
   - 在代码中添加延迟避免请求过快

4. **使用官方API**
   - 申请NBA官方API密钥（如果有）

## 代码结构

```
app/api/nba/scrape/route.ts  - 爬虫API路由
app/events/page.tsx          - 前端页面（已更新为使用爬虫API）
```

## 使用示例

前端会自动调用爬虫API：

```typescript
const response = await fetch('/api/nba/scrape?type=all')
const data = await response.json()
// data.matches - 比赛数据
// data.news - 新闻数据
```

## 测试

安装依赖后，可以测试爬虫API：

```bash
# 启动开发服务器
npm run dev

# 在浏览器访问
http://localhost:3000/api/nba/scrape?type=all
```

## 后续优化建议

1. **添加缓存机制**
   - 避免频繁请求
   - 使用Redis或内存缓存

2. **定时任务**
   - 使用cron定期更新数据
   - 可以集成node-cron

3. **错误处理**
   - 更完善的错误日志
   - 失败重试机制

4. **数据存储**
   - 将爬取的数据存储到数据库
   - 避免每次都重新爬取
