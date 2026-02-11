import { Router } from 'express'

const router = Router()

// TODO: 实现投诉相关路由
router.get('/', (req, res) => {
  res.json({ message: '获取投诉列表' })
})

export default router
