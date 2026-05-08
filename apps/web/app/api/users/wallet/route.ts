import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { authenticate } from '@/lib/middleware'

const MAX_RECHARGE = 100_000
const MIN_RECHARGE = 1

const DB_HINT =
  '请在本机进入 apps/web 目录执行：npx prisma db push（或 prisma migrate deploy），确保 User.balance 与 WalletLedger 表已同步。'

function prismaErrorInfo(error: unknown): { code?: string; message: string } {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { code: error.code, message: error.message }
  }
  if (error instanceof Error) {
    return { message: error.message }
  }
  return { message: String(error) }
}

/** 表或列不存在等 schema 不同步 */
function isSchemaDriftError(error: unknown): boolean {
  const { code, message } = prismaErrorInfo(error)
  const m = message.toLowerCase()
  if (code === 'P2021' || code === 'P2010') return true
  if (m.includes("doesn't exist") || m.includes('unknown table') || m.includes('walletledger'))
    return true
  if (m.includes('unknown column') && m.includes('balance')) return true
  return false
}

/** 虚拟币（球币）流水 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId

  try {
    const { searchParams } = new URL(request.url)
    const take = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    })

    let ledgers: Awaited<ReturnType<typeof prisma.walletLedger.findMany>> = []
    try {
      ledgers = await prisma.walletLedger.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take,
      })
    } catch (e) {
      console.warn('[wallet GET] WalletLedger 查询失败，将只返回余额', e)
    }

    return NextResponse.json({
      balance: user?.balance ?? 0,
      ledgers,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '加载钱包失败', hint: DB_HINT }, { status: 500 })
  }
}

/** 模拟充值虚拟币（球币），1 球币 = 1 元额度用于平台内展示与支付 */
export async function POST(request: NextRequest) {
  const authResult = await authenticate(request)
  if (authResult instanceof NextResponse) return authResult
  const userId = (authResult as any).userId
  const isDev = process.env.NODE_ENV !== 'production'

  try {
    const body = await request.json()
    const raw = parseFloat(String(body.amount ?? 0))
    if (Number.isNaN(raw) || raw < MIN_RECHARGE || raw > MAX_RECHARGE) {
      return NextResponse.json(
        { error: `充值金额须在 ${MIN_RECHARGE} 至 ${MAX_RECHARGE} 之间` },
        { status: 400 }
      )
    }

    const amount = Math.round(raw * 100) / 100

    const user = await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
      select: { balance: true },
    })

    try {
      await prisma.walletLedger.create({
        data: {
          userId,
          amount,
          type: 'RECHARGE',
          balanceAfter: user.balance,
          description: `球币充值 +${amount}`,
        },
      })
    } catch (ledgerErr) {
      if (isSchemaDriftError(ledgerErr)) {
        return NextResponse.json({
          balance: user.balance,
          message: `已充值 ¥${amount}（未写入流水表；请执行 prisma db push 同步 WalletLedger）`,
          warning: DB_HINT,
        })
      }
      console.error('[wallet] 写入流水失败，已回滚余额增量', ledgerErr)
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } },
        })
      } catch (revertErr) {
        console.error('[wallet] 回滚余额失败', revertErr)
      }
      throw ledgerErr
    }

    return NextResponse.json({
      balance: user.balance,
      message: `已充值 ${amount} 球币`,
    })
  } catch (error) {
    console.error(error)
    const { code, message } = prismaErrorInfo(error)
    const body: Record<string, string> = {
      error: '充值失败',
      hint: DB_HINT,
    }
    if (code) body.code = code
    if (isDev || code === 'P2025') body.details = message
    if (code === 'P2025') {
      body.error = '用户不存在'
      return NextResponse.json(body, { status: 404 })
    }
    if (isSchemaDriftError(error) || (message && message.toLowerCase().includes('balance'))) {
      body.error = '数据库可能缺少 User.balance 字段或未同步'
    }
    return NextResponse.json(body, { status: 500 })
  }
}
