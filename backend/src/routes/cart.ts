import { Router } from 'express'

const router = Router()

// TODO: 实现购物车相关路由
router.get('/', (req, res) => {
  res.json({ message: '获取购物车' })
})

export default router
