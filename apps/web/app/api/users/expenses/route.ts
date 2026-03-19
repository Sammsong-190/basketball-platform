import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const expenses = await prisma.expense.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    return NextResponse.json({ expenses, total })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get expense info' }, { status: 500 })
  }
}
