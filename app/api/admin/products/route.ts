import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/middleware'

// 获取商品数据（管理员）
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  try {
    const where: any = {}
    if (status) where.status = status

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: { select: { id: true, username: true } },
          category: true,
          _count: {
            select: {
              reviews: true,
              orderItems: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    // 统计数据
    const stats = {
      total: await prisma.product.count(),
      active: await prisma.product.count({ where: { status: 'ACTIVE' } }),
      inactive: await prisma.product.count({ where: { status: 'INACTIVE' } }),
      soldOut: await prisma.product.count({ where: { status: 'SOLD_OUT' } })
    }

    return NextResponse.json({ products, total, page, limit, stats })
  } catch (error) {
    return NextResponse.json({ error: '获取商品数据失败' }, { status: 500 })
  }
}

// 管理员操作商品（下架、删除等）
export async function PUT(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ error: '商品ID和状态为必填项' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status }
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
