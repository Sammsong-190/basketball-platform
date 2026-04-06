import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { id } = params

  try {
    const body = await request.json().catch(() => ({}))
    const read = body.read !== false

    const existing = await prisma.userNotification.findFirst({
      where: { id, userId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const updated = await prisma.userNotification.update({
      where: { id },
      data: { read },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
