import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSeller } from '@/lib/middleware'

/** 卖家店铺订单：订单中含该卖家商品的记录 */
export async function GET(request: NextRequest) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const orders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            product: { sellerId: userId },
          },
        },
      },
      include: {
        user: { select: { id: true, username: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sellerId: true,
                images: true,
                price: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '加载卖家订单失败' }, { status: 500 })
  }
}
