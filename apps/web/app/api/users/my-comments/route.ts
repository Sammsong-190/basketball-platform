import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const comments = await prisma.comment.findMany({
      where: { authorId: userId },
      include: {
        post: { select: { id: true, title: true } },
        product: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get comments list' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
  }

  try {
    await prisma.comment.delete({ where: { id, authorId: userId } })
    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
