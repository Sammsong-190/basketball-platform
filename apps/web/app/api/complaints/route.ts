import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireAdmin } from '@/lib/middleware'

// 用户提交投诉或建议
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { type, title, content, orderId } = body

    if (!type || !title || !content) {
      return NextResponse.json({ error: '类型、标题和内容为必填项' }, { status: 400 })
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId,
        type,
        title,
        content,
        orderId: orderId || null
      }
    })

    return NextResponse.json(complaint, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}

// 获取投诉建议列表
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const role = (authResult as any).role
  const { searchParams } = new URL(request.url)

  try {
    const where: any = role === 'ADMIN' ? {} : { userId }
    if (searchParams.get('type')) where.type = searchParams.get('type')
    if (searchParams.get('status')) where.status = searchParams.get('status')

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        user: { select: { id: true, username: true } },
        order: { select: { id: true, orderNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(complaints)
  } catch (error) {
    return NextResponse.json({ error: '获取列表失败' }, { status: 500 })
  }
}
