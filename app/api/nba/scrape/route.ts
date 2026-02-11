import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

interface PlayerStat {
  name: string
  avatar?: string
  points?: number
  rebounds?: number
  assists?: number
}

interface NBAMatch {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId?: number  // 添加teamId字段
  awayTeamId?: number  // 添加teamId字段
  homeScore: number | null
  awayScore: number | null
  status: 'upcoming' | 'live' | 'finished'
  date: string
  time: string
  league: string
  venue: string
  homeTopScorer?: PlayerStat | null
  homeTopRebounder?: PlayerStat | null
  homeTopAssister?: PlayerStat | null
  awayTopScorer?: PlayerStat | null
  awayTopRebounder?: PlayerStat | null
  awayTopAssister?: PlayerStat | null
}

interface NBANews {
  id: string
  title: string
  content: string
  image?: string
  publishedAt: string
  author: string
  url: string
}

// 使用Python爬虫获取NBA数据
async function fetchNBAScheduleWithPython(): Promise<NBAMatch[]> {
  try {
    // 获取Python脚本路径
    const scriptPath = path.join(process.cwd(), 'scripts', 'nba_scraper.py')

    console.log(`执行Python脚本: ${scriptPath}`)

    // 执行Python脚本
    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}"`, {
      timeout: 30000, // 30秒超时
      maxBuffer: 10 * 1024 * 1024 // 10MB缓冲区
    })

    if (stderr) {
      console.log('Python脚本stderr:', stderr)
    }

    // 解析JSON输出
    const result = JSON.parse(stdout.trim())

    if (result.error) {
      console.error('Python脚本返回错误:', result.message)
      return []
    }

    console.log(`Python爬虫成功获取 ${result.count} 场比赛`)

    return result.matches || []
  } catch (error: any) {
    console.error('执行Python爬虫失败:', error.message)

    // 如果Python不可用，尝试使用Node.js的fetch作为备用
    console.log('尝试使用Node.js fetch作为备用方案...')
    return await fetchNBAScheduleWithNodeJS()
  }
}

// 备用方案：使用Node.js fetch（如果Python不可用）
async function fetchNBAScheduleWithNodeJS(): Promise<NBAMatch[]> {
  // 这里可以保留之前的Node.js实现作为备用
  return []
}

// 爬取NBA新闻
type NewsDebugItem = { url: string; ok: boolean; error?: string; items?: number }

async function scrapeNBANews(debug?: NewsDebugItem[]): Promise<NBANews[]> {
  const rssUrls = [
    // 常见/历史可用的 NBA RSS
    'https://www.nba.com/rss/nba_rss.xml',
    'https://www.nba.com/news/rss.xml',
    'https://www.nba.com/news/rss',
    'https://www.nba.com/rss/nba_rss.xml?category=top-stories'
  ]

  const fetchText = async (url: string) => {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
      }
    })
    if (!res.ok) throw new Error(`RSS请求失败: ${res.status} ${res.statusText}`)
    return await res.text()
  }

  const getTag = (xml: string, tag: string) => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
    const m = xml.match(re)
    return m ? m[1].trim() : ''
  }

  const stripCdata = (s: string) =>
    s.replace(/^<!\\[CDATA\\[/i, '').replace(/\\]\\]>$/i, '').trim()

  const stripHtml = (s: string) =>
    s.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim()

  const decodeEntities = (s: string) =>
    s
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

  const findImage = (itemXml: string) => {
    // media:content url="..."
    const mediaUrl = itemXml.match(/<media:content[^>]+url="([^"]+)"/i)?.[1]
    if (mediaUrl) return mediaUrl
    // enclosure url="..."
    const encUrl = itemXml.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1]
    if (encUrl) return encUrl
    // <img src="...">
    const imgUrl = itemXml.match(/<img[^>]+src="([^"]+)"/i)?.[1]
    if (imgUrl) return imgUrl
    return undefined
  }

  const fetchNBANewsFromNextData = async (): Promise<NBANews[]> => {
    const pageUrls = [
      'https://www.nba.com/news',
      'https://www.nba.com/news/'
    ]

    const fetchHtml = async (url: string) => {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })
      if (!res.ok) throw new Error(`NBA新闻页请求失败: ${res.status} ${res.statusText}`)
      return await res.text()
    }

    const extractNextDataJson = (html: string) => {
      const m = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i)
      if (!m?.[1]) return null
      return m[1]
    }

    const getFirstString = (obj: any, keys: string[]) => {
      for (const k of keys) {
        const v = obj?.[k]
        if (typeof v === 'string' && v.trim()) return v.trim()
      }
      return ''
    }

    const getImageUrl = (obj: any) => {
      const normalizeMaybeUrl = (u?: string) => {
        if (!u || typeof u !== 'string') return undefined
        const s = u.trim()
        if (!s) return undefined
        if (s.startsWith('data:')) return undefined
        if (s.startsWith('http://') || s.startsWith('https://')) return s
        if (s.startsWith('//')) return `https:${s}`
        if (s.startsWith('/')) return `https://www.nba.com${s}`
        return s
      }

      const isLikelyImageUrl = (u?: string) => {
        if (!u) return false
        const s = u.toLowerCase()
        if (!s.startsWith('http')) return false
        // 常见图片扩展名，或 NBA 常用图片路径
        if (/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(s)) return true
        if (s.includes('cdn.nba.com') && (s.includes('/manage/') || s.includes('/images/'))) return true
        if (s.includes('ak-static.cms.nba.com')) return true
        return false
      }

      // 1) 常见字段直取
      const direct = normalizeMaybeUrl(getFirstString(obj, ['image', 'img', 'thumbnail', 'imageUrl', 'thumbnailUrl', 'heroImageUrl']))
      if (direct && isLikelyImageUrl(direct)) return direct

      // 2) 常见嵌套结构
      const nestedCandidates = [
        obj?.image?.url,
        obj?.image?.src,
        obj?.image?.uri,
        obj?.image?.path,
        obj?.thumbnail?.url,
        obj?.thumbnail?.src,
        obj?.heroImage?.url,
        obj?.heroImage?.src,
        obj?.featuredImage?.url,
        obj?.featuredImage?.src,
        obj?.promoImage?.url,
        obj?.promoImage?.src,
        obj?.media?.image?.url,
        obj?.media?.image?.src
      ]
        .map((v) => (typeof v === 'string' ? normalizeMaybeUrl(v) : undefined))
        .filter(Boolean) as string[]

      for (const u of nestedCandidates) {
        if (isLikelyImageUrl(u)) return u
      }

      // 3) 深度扫描（__NEXT_DATA__ 里图片字段经常藏得很深）
      type Candidate = { url: string; score: number }
      const candidates: Candidate[] = []
      const seen = new Set<any>()

      const scoreCandidate = (key: string, url: string) => {
        const k = key.toLowerCase()
        const u = url.toLowerCase()
        let score = 0
        if (/(hero|featured|promo|cover)/i.test(k)) score += 6
        if (/(image|thumbnail|thumb|photo|picture|media)/i.test(k)) score += 4
        if (u.includes('cdn.nba.com')) score += 4
        if (u.includes('ak-static.cms.nba.com')) score += 3
        if (/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(u)) score += 2
        // 避免拿到 logo / svg
        if (u.endsWith('.svg') || u.includes('/logos/')) score -= 10
        return score
      }

      const walkForImages = (node: any, depth: number, parentKey: string) => {
        // 优化：减少最大深度，提前终止低价值分支
        if (!node || depth > 5) return // 从7层减少到5层
        if (typeof node !== 'object') return
        if (seen.has(node)) return
        seen.add(node)

        // 优化：如果已经找到高质量图片，提前终止
        if (candidates.length > 0 && candidates[0].score >= 10) return

        if (Array.isArray(node)) {
          // 优化：限制数组遍历长度
          const maxArrayItems = depth > 2 ? 10 : 50
          for (let i = 0; i < Math.min(node.length, maxArrayItems); i++) {
            walkForImages(node[i], depth + 1, parentKey)
            if (candidates.length > 0 && candidates[0].score >= 10) return
          }
          return
        }

        for (const k of Object.keys(node)) {
          // 优化：跳过明显不相关的字段
          const keyLower = k.toLowerCase()
          if (depth > 2 && !/(image|photo|picture|media|hero|featured|promo|cover|thumbnail)/i.test(keyLower)) {
            continue
          }

          const v = (node as any)[k]
          if (typeof v === 'string') {
            const nu = normalizeMaybeUrl(v)
            if (nu && isLikelyImageUrl(nu)) {
              candidates.push({ url: nu, score: scoreCandidate(k || parentKey || '', nu) })
              // 找到高质量图片就提前返回
              if (scoreCandidate(k || parentKey || '', nu) >= 10) return
            }
          } else if (v && typeof v === 'object') {
            // 常见：{ url: "..."} / { src: "..."} 这种
            const urlish =
              typeof (v as any).url === 'string'
                ? normalizeMaybeUrl((v as any).url)
                : typeof (v as any).src === 'string'
                  ? normalizeMaybeUrl((v as any).src)
                  : undefined
            if (urlish && isLikelyImageUrl(urlish)) {
              const score = scoreCandidate(k || parentKey || '', urlish) + 2
              candidates.push({ url: urlish, score })
              if (score >= 10) return
            }
            walkForImages(v, depth + 1, k)
          }
        }
      }

      walkForImages(obj, 0, '')
      if (candidates.length === 0) return undefined
      candidates.sort((a, b) => b.score - a.score)
      return candidates[0].url
    }

    const normalizeUrl = (u: string) => {
      const url = u.trim()
      if (!url) return ''
      if (url.startsWith('http://') || url.startsWith('https://')) return url
      if (url.startsWith('/')) return `https://www.nba.com${url}`
      return `https://www.nba.com/${url}`
    }

    const tryParseDate = (s: string) => {
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }

    const results: NBANews[] = []
    const seen = new Set<string>()

    const collect = (node: any) => {
      if (!node || typeof node !== 'object') return
      const title = decodeEntities(stripHtml(stripCdata(getFirstString(node, ['title', 'headline', 'name']))))
      const urlRaw = getFirstString(node, ['url', 'link', 'permalink', 'slug'])
      const url = normalizeUrl(urlRaw)
      if (!title || !url) return

      // 过滤掉明显不是新闻的链接
      if (!url.includes('/news')) return

      const id = getFirstString(node, ['id', 'guid']) || url
      if (seen.has(id)) return
      seen.add(id)

      const descRaw =
        getFirstString(node, ['description', 'excerpt', 'dek', 'summary']) ||
        getFirstString(node, ['subheadline'])
      const content = decodeEntities(stripHtml(stripCdata(descRaw)))
      const image = getImageUrl(node)
      const publishedAt =
        tryParseDate(getFirstString(node, ['publishedAt', 'publishDate', 'date', 'pubDate'])) ||
        new Date().toISOString()
      const author =
        decodeEntities(stripHtml(stripCdata(getFirstString(node, ['author', 'byline', 'creator'])))) || 'NBA'

      results.push({ id, title, content, image, publishedAt, author, url })
    }

    const walk = (node: any) => {
      if (!node) return
      if (Array.isArray(node)) {
        for (const v of node) walk(v)
        return
      }
      if (typeof node !== 'object') return

      collect(node)
      for (const k of Object.keys(node)) {
        walk(node[k])
      }
    }

    for (const url of pageUrls) {
      try {
        const html = await fetchHtml(url)
        const jsonText = extractNextDataJson(html)
        if (!jsonText) {
          if (debug) debug.push({ url, ok: true, items: 0, error: '新闻页未找到 __NEXT_DATA__，可能页面结构变化' })
          continue
        }
        const data = JSON.parse(jsonText)
        walk(data)

        // 取前 12 条
        const sliced = results.slice(0, 12)
        if (debug) debug.push({ url, ok: true, items: sliced.length })
        if (sliced.length > 0) return sliced
      } catch (e: any) {
        const msg = e?.message || String(e)
        if (debug) debug.push({ url, ok: false, error: msg })
        continue
      }
    }

    return []
  }

  for (const url of rssUrls) {
    try {
      const xml = await fetchText(url)
      const hasItem = xml.toLowerCase().includes('<item')
      if (!hasItem) {
        // 请求成功但不是RSS或没有item，记录下来方便定位
        if (debug) debug.push({ url, ok: true, items: 0, error: 'RSS内容中未找到 <item>（可能被重定向到HTML/被拦截/源已失效）' })
        continue
      }

      const items = xml.split(/<item[^>]*>/i).slice(1)
      const news: NBANews[] = []

      for (const raw of items) {
        // 注意：这里需要匹配 XML 结束标签 </item>
        // 不能写成 /<\\/item>/i（会让正则在 `/` 处提前结束，导致 Unknown regular expression flags）
        const itemXml = raw.split(/<\/item>/i)[0]
        const titleRaw = stripCdata(getTag(itemXml, 'title'))
        const linkRaw = stripCdata(getTag(itemXml, 'link'))
        const guidRaw = stripCdata(getTag(itemXml, 'guid'))
        const descRaw = stripCdata(getTag(itemXml, 'description'))
        const pubDateRaw = stripCdata(getTag(itemXml, 'pubDate'))
        const creatorRaw = stripCdata(getTag(itemXml, 'dc:creator'))

        const title = decodeEntities(stripHtml(titleRaw))
        const urlFinal = decodeEntities(linkRaw || guidRaw)
        const content = decodeEntities(stripHtml(descRaw))
        const image = findImage(itemXml)
        const publishedAt = pubDateRaw ? new Date(pubDateRaw).toISOString() : new Date().toISOString()
        const author = decodeEntities(stripHtml(creatorRaw)) || 'NBA'

        if (!title || !urlFinal) continue

        news.push({
          id: guidRaw || urlFinal,
          title,
          content,
          image,
          publishedAt,
          author,
          url: urlFinal
        })

        if (news.length >= 12) break
      }

      if (debug) debug.push({ url, ok: true, items: news.length })
      if (news.length > 0) return news
    } catch (e: any) {
      const msg = e?.message || String(e)
      console.warn('RSS抓取失败:', url, msg)
      if (debug) debug.push({ url, ok: false, error: msg })
      continue
    }
  }

  // RSS 全部失败/为空时，兜底从 nba.com/news 的 __NEXT_DATA__ 解析
  const fallback = await fetchNBANewsFromNextData()
  if (fallback.length > 0) return fallback

  return []
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'all'
  const debug = searchParams.get('debug') === '1'
  const newsDebug: NewsDebugItem[] = []

  try {
    console.log('NBA数据请求:', { type })

    if (type === 'schedule' || type === 'all') {
      // 优化：并行获取比赛数据和新闻数据（如果type是'all'）
      const promises: Promise<any>[] = [fetchNBAScheduleWithPython()]

      if (type === 'all') {
        // 并行获取新闻，不等待比赛数据完成
        promises.push(scrapeNBANews(debug ? newsDebug : undefined))
      }

      // 等待所有请求完成
      const results = await Promise.all(promises)
      const matches = results[0]
      const news = type === 'all' ? results[1] : []

      console.log(`获取到 ${matches.length} 场比赛数据`)

      if (matches.length === 0) {
        console.warn('未获取到任何NBA比赛数据')
        return NextResponse.json({
          matches: [],
          message: '暂无比赛数据。可能的原因：当前日期范围内没有比赛，或API暂时不可用。请稍后重试。',
          error: false
        })
      }

      if (type === 'schedule') {
        return NextResponse.json({ matches, error: false })
      }

      return NextResponse.json({ matches, news, error: false, ...(debug ? { newsDebug } : {}) })
    } else if (type === 'news') {
      const news = await scrapeNBANews(debug ? newsDebug : undefined)
      return NextResponse.json({ news, error: false, ...(debug ? { newsDebug } : {}) })
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
  } catch (error: any) {
    console.error('获取NBA数据失败:', error)
    return NextResponse.json(
      {
        error: true,
        message: `获取数据失败: ${error.message}`,
        matches: [],
        news: []
      },
      { status: 500 }
    )
  }
}
