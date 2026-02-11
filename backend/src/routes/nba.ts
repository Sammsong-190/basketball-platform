import { Router } from 'express'

const router = Router()

// TODO: 实现NBA数据相关路由
router.get('/scrape', (req, res) => {
  res.json({ message: '爬取NBA数据' })
})

export default router
