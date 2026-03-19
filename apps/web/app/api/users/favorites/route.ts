import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    const where: any = { userId }
    if (type) where.type = type
    const favorites = await prisma.favorite.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(favorites)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get favorites list' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { type, targetId } = body
    if (!type || !targetId) {
      return NextResponse.json({ error: 'Type and target ID are required' }, { status: 400 })
    }
    const favorite = await prisma.favorite.create({
      data: { userId, type, targetId }
    })
    return NextResponse.json(favorite, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Already favorited' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
      return NextResponse.json({ error: 'Favorite ID is required' }, { status: 400 })
  }

  try {
    await prisma.favorite.delete({ where: { id, userId } })
    return NextResponse.json({ message: 'Unfavorited successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unfavorite' }, { status: 500 })
  }
}
