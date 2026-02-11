import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// 获取分类列表（层级结构）
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true
      },
      orderBy: { name: 'asc' }
    })

    res.json(categories)
  } catch (error) {
    console.error('获取分类列表失败:', error)
    res.status(500).json({ error: '获取分类列表失败' })
  }
})

export default router
