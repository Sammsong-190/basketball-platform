import { Router } from 'express'

const router = Router()

// TODO: 实现支付相关路由
router.post('/', (req, res) => {
  res.json({ message: '处理支付' })
})

export default router
