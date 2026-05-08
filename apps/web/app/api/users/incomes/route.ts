import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticate, requireSeller } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await requireSeller(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const incomes = await prisma.income.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: 'desc' }
    })
    const total = incomes.reduce((sum, i) => sum + i.amount, 0)
    return NextResponse.json({ incomes, total })
  } catch (error) {
    return NextResponse.json({ error: '获取收入信息失败' }, { status: 500 })
  }
}
