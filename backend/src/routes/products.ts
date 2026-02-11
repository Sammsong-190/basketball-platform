import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate, requireSeller, AuthRequest } from '../lib/middleware'

const router = Router()

// 获取商品列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId as string | undefined
    const keyword = req.query.keyword as string | undefined
    const page = parseInt(req.query.page as string || '1')
    const limit = parseInt(req.query.limit as string || '10')

    const where: any = { status: 'ACTIVE' }
    if (categoryId) where.categoryId = categoryId
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        { seller: { username: { contains: keyword } } },
        { category: { name: { contains: keyword } } }
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: { select: { id: true, username: true } },
          category: true,
          _count: { select: { reviews: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    res.json({ products, total, page, limit })
  } catch (error) {
    console.error('获取商品列表失败:', error)
    res.status(500).json({ error: '获取商品列表失败' })
  }
})

// 创建商品（需要卖家权限）
router.post('/', requireSeller, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, stock, categoryId, images } = req.body

    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ error: '必填项不能为空' })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock || '0'),
        categoryId,
        images: JSON.stringify(images || []),
        sellerId: req.userId!,
        status: 'ACTIVE',
        sourceType: 'FREE_TRADE'
      } as any
    })

    res.status(201).json(product)
  } catch (error) {
    console.error('创建商品失败:', error)
    res.status(500).json({ error: '创建商品失败' })
  }
})

export default router
