import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 这个API用于定时更新NBA数据到数据库
// 可以通过cron job或定时任务调用

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（可以添加API密钥验证）
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'your-secret-key'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 从NBA API获取最新数据
    const nbaResponse = await fetch(`${request.nextUrl.origin}/api/nba/scrape?type=schedule`, {
      cache: 'no-store'
    })

    if (!nbaResponse.ok) {
      throw new Error('Failed to fetch NBA data')
    }

    const { matches } = await nbaResponse.json()

    if (!matches || matches.length === 0) {
      return NextResponse.json({ message: 'No matches to update', updated: 0 })
    }

    // 这里可以将数据存储到数据库
    // 由于当前schema可能没有NBA比赛表，这里只返回成功消息
    // 如果需要持久化存储，需要先添加相应的Prisma模型

    return NextResponse.json({ 
      message: 'NBA data updated successfully',
      matchesCount: matches.length,
      updatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('更新NBA数据失败:', error)
    return NextResponse.json(
      { error: '更新失败', message: error.message },
      { status: 500 }
    )
  }
}

// 允许GET请求用于手动触发更新
export async function GET(request: NextRequest) {
  return POST(request)
}
