import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'
import path from 'path'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import productRoutes from './routes/products'
import categoryRoutes from './routes/categories'
import postRoutes from './routes/posts'
import commentRoutes from './routes/comments'
import orderRoutes from './routes/orders'
import cartRoutes from './routes/cart'
import paymentRoutes from './routes/payments'
import refundRoutes from './routes/refunds'
import complaintRoutes from './routes/complaints'
import nbaRoutes from './routes/nba'
import adminRoutes from './routes/admin'

// 加载环境变量
config({ path: path.join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '后端 API 运行中' })
})

// API 路由

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/refunds', refundRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/nba', nbaRoutes)
app.use('/api/admin', adminRoutes)

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('错误:', err)
  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误'
  })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

app.listen(PORT, () => {
  console.log(`🚀 后端服务运行于 http://localhost:${PORT}`)
})
