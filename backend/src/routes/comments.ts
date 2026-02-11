import { Router } from 'express'

const router = Router()

// TODO: 实现评论相关路由
router.post('/', (req, res) => {
  res.json({ message: '创建评论' })
})

export default router
