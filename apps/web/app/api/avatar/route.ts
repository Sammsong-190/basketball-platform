/**
 * 图片代理 - 解决 ESPN CDN 跨域/防盗链导致的头像无法显示
 */
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_HOSTS = ['a.espncdn.com', 'cdn.nba.com', 'espncdn.com']

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 })
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
      return NextResponse.json({ error: 'Image fetch failed' }, { status: 502 })
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
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 })
  }
}
