import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === '1'

    const notifications = await prisma.userNotification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}
