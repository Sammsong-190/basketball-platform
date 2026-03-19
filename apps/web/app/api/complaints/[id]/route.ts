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
    const { reply, status } = body

    const complaint = await prisma.complaint.update({
      where: { id: params.id },
      data: {
        reply: reply || undefined,
        status: status || undefined,
        repliedAt: reply ? new Date() : undefined
      }
    })

    return NextResponse.json(complaint)
  } catch (error) {
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
