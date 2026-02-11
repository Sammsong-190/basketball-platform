import { Router } from 'express'

const router = Router()

// TODO: 实现退款相关路由
router.get('/', (req, res) => {
  res.json({ message: '获取退款列表' })
})

export default router
