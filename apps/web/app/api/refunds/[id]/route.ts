import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

type OrderWithItems = {
  items: Array<{ product: { sellerId: string; sourceType: string } }>
}

function sellerCanProcessRefund(userId: string, order: OrderWithItems): boolean {
  const items = order.items
  if (!items?.length) return false

  let hasPlatform = false
  const sellerIds = new Set<string>()

  for (const it of items) {
    const p = it.product
    if (p.sourceType === 'PLATFORM_MANAGED') hasPlatform = true
    else if (p.sellerId) sellerIds.add(p.sellerId)
  }

  if (hasPlatform) return false
  if (sellerIds.size !== 1) return false
  return sellerIds.has(userId)
}

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
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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
      return NextResponse.json({ error: 'Refund request not found' }, { status: 404 })
    }

    if (refund.status !== 'PENDING') {
      return NextResponse.json({ error: 'This refund has already been processed' }, { status: 400 })
    }

    let allowed = role === 'ADMIN'
    if (!allowed) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isSeller: true },
      })
      if (user?.isSeller && sellerCanProcessRefund(userId, refund.order)) {
        allowed = true
      }
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'No permission to process this refund' },
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
        return NextResponse.json({ error: 'Only admins can set COMPLETED' }, { status: 403 })
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
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
