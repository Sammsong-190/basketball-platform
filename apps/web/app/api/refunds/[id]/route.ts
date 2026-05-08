import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'
import {
  adminCanProcessOrderRefund,
  sellerCanProcessOrderRefund,
} from '@/lib/refundPermissions'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult

  const userId = (authResult as any).userId
  const role = (authResult as any).role

  try {
    const body = await request.json()
    const { status, adminNote } = body

    if (!status || !['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: '状态无效' }, { status: 400 })
    }

    const refund = await prisma.refund.findUnique({
      where: { id: params.id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: { select: { sellerId: true, sourceType: true } },
              },
            },
          },
        },
      },
    })

    if (!refund) {
      return NextResponse.json({ error: '售后申请不存在' }, { status: 404 })
    }

    if (refund.status !== 'PENDING') {
      return NextResponse.json({ error: '该售后申请已处理' }, { status: 400 })
    }

    let allowed = false
    if (role === 'ADMIN') {
      allowed = adminCanProcessOrderRefund(refund.order)
    } else {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSeller: true },
      })
      if (user?.isSeller && sellerCanProcessOrderRefund(userId, refund.order)) {
        allowed = true
      }
    }

    if (!allowed) {
      return NextResponse.json(
        {
          error: '无权处理该售后申请',
          hint:
            role === 'ADMIN'
              ? '单一卖家的自由交易退款由卖家处理，管理员仅处理含平台自营或多卖家等订单'
              : undefined,
        },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (adminNote !== undefined) updateData.adminNote = adminNote

    if (status === 'APPROVED') {
      updateData.approvedAt = new Date()
      await prisma.order.update({
        where: { id: refund.orderId },
        data: { status: 'REFUNDED' },
      })
    } else if (status === 'REJECTED') {
      await prisma.order.update({
        where: { id: refund.orderId },
        data: { status: 'COMPLETED' },
      })
    } else if (status === 'COMPLETED') {
      if (role !== 'ADMIN') {
        return NextResponse.json({ error: '仅管理员可将状态设为已完成' }, { status: 403 })
      }
      updateData.completedAt = new Date()
    }

    const updated = await prisma.refund.update({
      where: { id: params.id },
      data: { ...updateData, status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '审核失败' }, { status: 500 })
  }
}
