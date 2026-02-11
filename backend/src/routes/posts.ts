import { Router } from 'express'

const router = Router()

// TODO: 实现帖子相关路由
router.get('/', (req, res) => {
  res.json({ message: '获取帖子列表' })
})

export default router
