import { Router } from 'express'
import { authenticate, AuthRequest } from '../lib/middleware'

const router = Router()

// 所有用户相关路由都需要认证
router.use(authenticate)

// 获取用户资料
router.get('/profile', async (req: AuthRequest, res) => {
  // TODO: 实现获取用户资料
  res.json({ message: '获取用户资料' })
})

// 获取我的订单
router.get('/my-orders', async (req: AuthRequest, res) => {
  // TODO: 实现获取我的订单
  res.json({ message: '获取我的订单' })
})

export default router
