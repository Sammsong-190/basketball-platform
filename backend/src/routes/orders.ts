import { Router } from 'express'

const router = Router()

// TODO: 实现订单相关路由
router.get('/', (req, res) => {
  res.json({ message: '获取订单列表' })
})

export default router
