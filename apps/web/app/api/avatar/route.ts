/**
 * 图片代理 - 解决 ESPN CDN 跨域/防盗链导致的头像无法显示
 */
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['a.espncdn.com', 'cdn.nba.com', 'espncdn.com']

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'URL 无效' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: '不允许使用该 URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NBA App)',
        'Accept': 'image/*',
      },
      cache: 'force-cache',
      next: { revalidate: 86400 }, // 24h
    })

    if (!res.ok) {
      return NextResponse.json({ error: '图片获取失败' }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/png'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: '代理请求失败' }, { status: 502 })
  }
}
