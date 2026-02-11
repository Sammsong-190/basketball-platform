import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true }
    })

    const total = cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    return NextResponse.json({ cartItems, total })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || !quantity) {
      return NextResponse.json({ error: 'Product ID and quantity are required' }, { status: 400 })
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } }
    })

    if (existing) {
      const cartItem = await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity: existing.quantity + quantity }
      })
      return NextResponse.json(cartItem)
    } else {
      const cartItem = await prisma.cartItem.create({
        data: { userId, productId, quantity }
      })
      return NextResponse.json(cartItem, { status: 201 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    await prisma.cartItem.delete({ where: { id, userId } })
  } else {
    await prisma.cartItem.deleteMany({ where: { userId } })
  }

  return NextResponse.json({ message: 'Deleted successfully' })
}
