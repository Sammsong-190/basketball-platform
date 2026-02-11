import { Router } from 'express'
import { requireAdmin } from '../lib/middleware'

const router = Router()

// 所有管理员路由都需要管理员权限
router.use(requireAdmin)

// TODO: 实现管理员相关路由
router.get('/users', (req, res) => {
  res.json({ message: '获取用户列表' })
})

export default router
