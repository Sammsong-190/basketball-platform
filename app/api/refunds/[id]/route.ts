import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/middleware'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const body = await request.json()
    const { status, adminNote } = body

    const refund = await prisma.refund.findUnique({
      where: { id: params.id },
      include: { order: true }
    })

    if (!refund) {
      return NextResponse.json({ error: '退换货申请不存在' }, { status: 404 })
    }

    const updateData: any = { adminNote }
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
      await prisma.order.update({
        where: { id: refund.orderId },
        data: { status: 'REFUNDED' }
      })
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const updated = await prisma.refund.update({
      where: { id: params.id },
      data: { ...updateData, status }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: '审核失败' }, { status: 500 })
  }
}
