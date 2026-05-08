'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/Header'

function getAvatarSrc(url: string): string {
  if (!url?.startsWith('http')) return url
  try {
    const u = new URL(url)
    if (u.hostname.includes('espncdn.com') || u.hostname.includes('cdn.nba.com')) {
      return `/api/avatar?url=${encodeURIComponent(url)}`
    }
  } catch {}
  return url
}

function PlayerAvatar({ src, alt }: { src: string; alt: string }) {
  const proxySrc = getAvatarSrc(src)
  return (
    <img
      src={proxySrc}
      alt={alt}
      className="absolute inset-0 w-14 h-14 rounded-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        ;(e.target as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}

interface PlayerStat {
  name: string
  avatar?: string
  points?: number
  rebounds?: number
  assists?: number
}

interface LinescorePeriod {
  period: number
  value: number
}

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId?: number
  awayTeamId?: number
  homeLogo?: string
  awayLogo?: string
  homeScore: number | null
  awayScore: number | null
  status: 'upcoming' | 'live' | 'finished'
  date: string
  time: string
  league: string
  venue: string
  homeLinescores?: LinescorePeriod[]
  awayLinescores?: LinescorePeriod[]
  homeTopScorer?: PlayerStat | null
  homeTopRebounder?: PlayerStat | null
  homeTopAssister?: PlayerStat | null
  awayTopScorer?: PlayerStat | null
  awayTopRebounder?: PlayerStat | null
  awayTopAssister?: PlayerStat | null
}

// NBA球队信息（队标和缩写）
const teamInfo: { [key: string]: { logo: string; abbreviation: string } } = {
  '洛杉矶湖人': { logo: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg', abbreviation: 'LAL' },
  '金州勇士': { logo: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg', abbreviation: 'GSW' },
  '波士顿凯尔特人': { logo: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg', abbreviation: 'BOS' },
  '迈阿密热火': { logo: 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg', abbreviation: 'MIA' },
  '芝加哥公牛': { logo: 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg', abbreviation: 'CHI' },
  '纽约尼克斯': { logo: 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg', abbreviation: 'NYK' },
  '达拉斯独行侠': { logo: 'https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg', abbreviation: 'DAL' },
  '菲尼克斯太阳': { logo: 'https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg', abbreviation: 'PHX' },
  '密尔沃基雄鹿': { logo: 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg', abbreviation: 'MIL' },
  '费城76人': { logo: 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg', abbreviation: 'PHI' },
  '丹佛掘金': { logo: 'https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg', abbreviation: 'DEN' },
  '波特兰开拓者': { logo: 'https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg', abbreviation: 'POR' },
  '休斯顿火箭': { logo: 'https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg', abbreviation: 'HOU' },
  '圣安东尼奥马刺': { logo: 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg', abbreviation: 'SAS' },
  '孟菲斯灰熊': { logo: 'https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg', abbreviation: 'MEM' },
  '新奥尔良鹈鹕': { logo: 'https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg', abbreviation: 'NOP' },
  '明尼苏达森林狼': { logo: 'https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg', abbreviation: 'MIN' },
  '俄克拉荷马雷霆': { logo: 'https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg', abbreviation: 'OKC' },
  '萨克拉门托国王': { logo: 'https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg', abbreviation: 'SAC' },
  '犹他爵士': { logo: 'https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg', abbreviation: 'UTA' },
  '亚特兰大老鹰': { logo: 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg', abbreviation: 'ATL' },
  '夏洛特黄蜂': { logo: 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg', abbreviation: 'CHA' },
  '华盛顿奇才': { logo: 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg', abbreviation: 'WAS' },
  '奥兰多魔术': { logo: 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg', abbreviation: 'ORL' },
  '底特律活塞': { logo: 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg', abbreviation: 'DET' },
  '克利夫兰骑士': { logo: 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg', abbreviation: 'CLE' },
  '印第安纳步行者': { logo: 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg', abbreviation: 'IND' },
  '多伦多猛龙': { logo: 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg', abbreviation: 'TOR' },
  '布鲁克林篮网': { logo: 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg', abbreviation: 'BKN' },
  '洛杉矶快船': { logo: 'https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg', abbreviation: 'LAC' }
}

// 球队名到ID的映射（用于teamId缺失时的回退）
const teamNameToId: { [key: string]: number } = {
  '亚特兰大老鹰': 1610612737, '波士顿凯尔特人': 1610612738, '克利夫兰骑士': 1610612739, '新奥尔良鹈鹕': 1610612740,
  '芝加哥公牛': 1610612741, '达拉斯独行侠': 1610612742, '丹佛掘金': 1610612743, '金州勇士': 1610612744,
  '休斯顿火箭': 1610612745, '洛杉矶快船': 1610612746, '洛杉矶湖人': 1610612747, '迈阿密热火': 1610612748,
  '密尔沃基雄鹿': 1610612749, '明尼苏达森林狼': 1610612750, '布鲁克林篮网': 1610612751, '纽约尼克斯': 1610612752,
  '奥兰多魔术': 1610612753, '印第安纳步行者': 1610612754, '费城76人': 1610612755, '菲尼克斯太阳': 1610612756,
  '波特兰开拓者': 1610612757, '萨克拉门托国王': 1610612758, '圣安东尼奥马刺': 1610612759, '俄克拉荷马雷霆': 1610612760,
  '多伦多猛龙': 1610612761, '犹他爵士': 1610612762, '孟菲斯灰熊': 1610612763, '华盛顿奇才': 1610612764,
  '底特律活塞': 1610612765, '夏洛特黄蜂': 1610612766
}

// NBA球队ID到队标和缩写的映射
const teamIdToInfo: { [key: number]: { logo: string; abbreviation: string } } = {
  1610612737: { logo: 'https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg', abbreviation: 'ATL' },
  1610612738: { logo: 'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg', abbreviation: 'BOS' },
  1610612739: { logo: 'https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg', abbreviation: 'CLE' },
  1610612740: { logo: 'https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg', abbreviation: 'NOP' },
  1610612741: { logo: 'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg', abbreviation: 'CHI' },
  1610612742: { logo: 'https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg', abbreviation: 'DAL' },
  1610612743: { logo: 'https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg', abbreviation: 'DEN' },
  1610612744: { logo: 'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg', abbreviation: 'GSW' },
  1610612745: { logo: 'https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg', abbreviation: 'HOU' },
  1610612746: { logo: 'https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg', abbreviation: 'LAC' },
  1610612747: { logo: 'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg', abbreviation: 'LAL' },
  1610612748: { logo: 'https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg', abbreviation: 'MIA' },
  1610612749: { logo: 'https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg', abbreviation: 'MIL' },
  1610612750: { logo: 'https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg', abbreviation: 'MIN' },
  1610612751: { logo: 'https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg', abbreviation: 'BKN' },
  1610612752: { logo: 'https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg', abbreviation: 'NYK' },
  1610612753: { logo: 'https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg', abbreviation: 'ORL' },
  1610612754: { logo: 'https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg', abbreviation: 'IND' },
  1610612755: { logo: 'https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg', abbreviation: 'PHI' },
  1610612756: { logo: 'https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg', abbreviation: 'PHX' },
  1610612757: { logo: 'https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg', abbreviation: 'POR' },
  1610612758: { logo: 'https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg', abbreviation: 'SAC' },
  1610612759: { logo: 'https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg', abbreviation: 'SAS' },
  1610612760: { logo: 'https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg', abbreviation: 'OKC' },
  1610612761: { logo: 'https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg', abbreviation: 'TOR' },
  1610612762: { logo: 'https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg', abbreviation: 'UTA' },
  1610612763: { logo: 'https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg', abbreviation: 'MEM' },
  1610612764: { logo: 'https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg', abbreviation: 'WAS' },
  1610612765: { logo: 'https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg', abbreviation: 'DET' },
  1610612766: { logo: 'https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg', abbreviation: 'CHA' }
}

// 获取球队信息，优先使用teamId，如果没有则使用teamName
const getTeamInfo = (teamName: string, teamId?: number) => {
  if (teamId && teamIdToInfo[teamId]) {
    return teamIdToInfo[teamId]
  }
  if (teamInfo[teamName]) {
    return teamInfo[teamName]
  }
  // 当teamId缺失时，用球队名查找ID
  const resolvedId = teamId || teamNameToId[teamName]
  if (resolvedId && teamIdToInfo[resolvedId]) {
    return teamIdToInfo[resolvedId]
  }
  // 模糊匹配：部分球队名
  const partial = Object.keys(teamNameToId).find((k) => teamName.includes(k) || k.includes(teamName))
  if (partial && teamIdToInfo[teamNameToId[partial]]) {
    return teamIdToInfo[teamNameToId[partial]]
  }
  const defaultTeamId = resolvedId || 1610612738
  let abbreviation = teamName.length >= 2 ? teamName.substring(0, 3).toUpperCase() : '???'

  if (teamName.includes('湖人')) abbreviation = 'LAL'
  else if (teamName.includes('快船')) abbreviation = 'LAC'
  else if (teamName.includes('76') || teamName.includes('76人')) abbreviation = 'PHI'

  return {
    logo: `https://cdn.nba.com/logos/nba/${defaultTeamId}/primary/L/logo.svg`,
    abbreviation
  }
}

function getPeriodLabel(period: number): string {
  if (period <= 4) return `第${period}节`
  return `加时${period - 4}`
}

function QuarterScoresTable({ match, getTeamInfo }: { match: Match; getTeamInfo: (name: string, id?: number) => { abbreviation: string } }) {
  const home = match.homeLinescores || []
  const away = match.awayLinescores || []
  const maxPeriod = Math.max(...home.map((s) => s.period), ...away.map((s) => s.period), 4)
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1)

  const getScore = (arr: LinescorePeriod[], p: number) => arr.find((s) => s.period === p)?.value ?? '-'

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[320px]">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="text-left font-bold uppercase py-2 px-3">球队</th>
            {periods.map((p) => (
              <th key={p} className="text-center font-bold uppercase py-2 px-2">
                {getPeriodLabel(p)}
              </th>
            ))}
            <th className="text-center font-bold uppercase py-2 px-3">总分</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          <tr>
            <td className="font-bold py-2 px-3 text-gray-900">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</td>
            {periods.map((p) => (
              <td key={p} className="text-center py-2 px-2">
                {getScore(home, p)}
              </td>
            ))}
            <td className="font-bold text-center py-2 px-3 text-gray-900">{match.homeScore ?? '-'}</td>
          </tr>
          <tr>
            <td className="font-bold py-2 px-3 text-gray-900">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</td>
            {periods.map((p) => (
              <td key={p} className="text-center py-2 px-2">
                {getScore(away, p)}
              </td>
            ))}
            <td className="font-bold text-center py-2 px-3 text-gray-900">{match.awayScore ?? '-'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

interface News {
  id: string
  title: string
  content: string
  image?: string
  publishedAt: string
  author: string
  url?: string
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'scores' | 'news'>('schedule')
  const [matches, setMatches] = useState<Match[]>([])
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLiveIndex, setCurrentLiveIndex] = useState(0)
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null)
  const mainArticleRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      // 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

      const nbaResponse = await fetch('/api/nba/scrape?type=all&refresh=true', {
        cache: 'no-store',
        next: { revalidate: 0 },
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))

      if (!nbaResponse.ok) {
        console.error('NBA API请求失败:', nbaResponse.status, nbaResponse.statusText)
        setMatches([])
        setNews([])
        if (showLoading) setLoading(false)
        return
      }

      const nbaData = await nbaResponse.json()
      if (nbaData.error) {
        console.error('NBA API返回错误:', nbaData.error, nbaData.message)
      }

      if (nbaData.matches && nbaData.matches.length > 0) {
        setMatches(nbaData.matches)
        if (showLoading) setLoading(false)
      } else {
        setMatches([])
        console.warn('未获取到NBA比赛数据，可能的原因：', nbaData.message || 'API返回空数据')
        if (showLoading) setLoading(false)
      }

      // 新闻数据异步处理，不阻塞页面显示
      if (nbaData.news && nbaData.news.length > 0) {
        console.log('成功获取', nbaData.news.length, '条新闻数据')
        setNews(nbaData.news)
      } else {
        console.warn('未获取到NBA新闻数据，尝试从数据库获取...')
        // 异步获取新闻，不阻塞主流程
        fetch('/api/posts?isNews=true')
          .then(response => {
            if (response.ok) {
              return response.json()
            }
            throw new Error(`HTTP ${response.status}`)
          })
          .then(data => {
            const newsData = (data.posts || []).map((post: any) => ({
              id: post.id,
              title: post.title,
              content: post.content,
              image: post.images ? JSON.parse(post.images)[0] : null,
              publishedAt: post.createdAt,
              author: post.author?.username || '未知'
            }))
            setNews(newsData)
          })
          .catch(newsError => {
            console.error('获取数据库新闻失败:', newsError)
            setNews([])
          })
      }
    } catch (error: any) {
      console.error('获取数据失败:', error)
      if (error.name === 'AbortError') {
        console.error('请求超时')
      }
      setMatches([])
      setNews([])
      if (showLoading) setLoading(false)
    }
  }

  // 初始加载 + 每2分钟自动爬取（长轮询）
  useEffect(() => {
    fetchData()

    const POLL_INTERVAL = 2 * 60 * 1000 // 2 minutes

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      fetchData(false) // 后台静默刷新，不显示 loading
    }

    const interval = setInterval(tick, POLL_INTERVAL)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'upcoming': { text: '未开始', color: 'bg-blue-100 text-blue-800' },
      'live': { text: '进行中', color: 'bg-red-100 text-red-800' },
      'finished': { text: '已结束', color: 'bg-gray-100 text-gray-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  // 过滤掉包含"未知球队"的比赛
  const validMatches = matches.filter(m =>
    m.homeTeam !== '未知球队' &&
    m.awayTeam !== '未知球队' &&
    !m.homeTeam.includes('未知') &&
    !m.awayTeam.includes('未知')
  )

  // 将美东时区的日期转换为北京时间
  // 爬虫返回的日期是基于美东时区的，需要转换为北京时间
  const convertETDateToBeijing = (etDateStr: string): string => {
    // etDateStr 格式：YYYY-MM-DD（美东时区）
    // 使用美东时区当天的中午12点作为参考时间
    const [year, month, day] = etDateStr.split('-').map(Number)

    // 方法：创建一个表示美东时区中午12点的日期时间
    // 使用 Intl.DateTimeFormat 来正确处理时区转换
    // 先创建一个本地时间的 Date 对象，然后通过时区格式化来转换
    const localDate = new Date(year, month - 1, day, 12, 0, 0)

    // 验证这个日期在美东时区是否正确
    const etDateCheck = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(localDate)

    // 如果日期不匹配，尝试使用 UTC 时间
    if (etDateCheck !== etDateStr) {
      // 美东时区中午12点大约对应 UTC 17点（EST）或16点（EDT）
      // 使用平均值 16:30 来避免夏令时问题
      const utcDate = new Date(Date.UTC(year, month - 1, day, 16, 30, 0))
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(utcDate)
    }

    // 转换为北京时间
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(localDate)
  }

  // 将所有比赛的日期转换为北京时间
  const matchesWithBeijingDate = validMatches.map(m => ({
    ...m,
    beijingDate: convertETDateToBeijing(m.date)
  }))

  // 获取北京时间的"今天"
  const todayBeijing = (() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
  })()

  // 实时比分：显示北京时间"今天"的比赛
  const todayLiveMatches = matchesWithBeijingDate.filter(m =>
    m.status === 'live' && m.beijingDate === todayBeijing
  )

  const upcomingMatches = matchesWithBeijingDate.filter(m => m.status === 'upcoming')

  // 已结束的比赛：基于北京时间的"今天"计算往前2天和往前1天
  const calculateDateOffset = (baseDateStr: string, daysOffset: number): string => {
    const [year, month, day] = baseDateStr.split('-').map(Number)
    const baseDate = new Date(year, month - 1, day)
    baseDate.setDate(baseDate.getDate() + daysOffset)
    const y = baseDate.getFullYear()
    const m = String(baseDate.getMonth() + 1).padStart(2, '0')
    const d = String(baseDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 基于北京时间的"今天"计算：今天、往前1天、往前2天
  const beijingTwoDaysAgo = calculateDateOffset(todayBeijing, -2)
  const beijingOneDayAgo = calculateDateOffset(todayBeijing, -1)
  const beijingToday = todayBeijing

  // 直接使用北京时间日期进行匹配
  const finishedMatches = matchesWithBeijingDate.filter(m => {
    if (m.status !== 'finished') return false
    const matchBeijingDate = String(m.beijingDate).trim()
    // 匹配：今天 + 往前1天 + 往前2天
    return (
      matchBeijingDate === beijingToday ||
      matchBeijingDate === beijingOneDayAgo ||
      matchBeijingDate === beijingTwoDaysAgo
    )
  })

  // 按日期分组比赛
  const parseTimeToMinutes = (t: string) => {
    // 兼容：'HH:MM'、'7:30 PM ET'、'Q3 08:21'、'FINAL'
    const hhmm = t.match(/(\d{1,2}):(\d{2})/)
    if (hhmm) {
      const h = Number(hhmm[1])
      const m = Number(hhmm[2])
      return h * 60 + m
    }
    return -1
  }

  const groupMatchesByDate = (
    matchList: any[],
    opts?: { dateOrder?: 'asc' | 'desc'; timeOrder?: 'asc' | 'desc' }
  ) => {
    const grouped: { [key: string]: any[] } = {}
    matchList.forEach(match => {
      // 使用转换后的北京时间日期
      const date = (match.beijingDate || match.date) as string
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(match)
    })

    const dateOrder = opts?.dateOrder ?? 'asc'
    const timeOrder = opts?.timeOrder ?? 'asc'

    const dates = Object.keys(grouped).sort((a, b) => {
      // date: YYYY-MM-DD，字符串排序等价于时间排序
      return dateOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
    })

    return dates.map(date => {
      const list = [...grouped[date]]
      list.sort((a, b) => {
        const am = parseTimeToMinutes(a.time)
        const bm = parseTimeToMinutes(b.time)
        // 没法解析的时间放到最后
        if (am === -1 && bm === -1) return 0
        if (am === -1) return 1
        if (bm === -1) return -1
        return timeOrder === 'asc' ? am - bm : bm - am
      })
      return { date, matches: list }
    })
  }

  const upcomingByDate = groupMatchesByDate(upcomingMatches, { dateOrder: 'asc', timeOrder: 'asc' })
  // ✅ 已结束的比赛：从最近到最远（日期倒序 + 当天时间倒序）
  const finishedByDate = groupMatchesByDate(finishedMatches, { dateOrder: 'desc', timeOrder: 'desc' })

  // 同步右侧边栏高度与主文章高度
  useEffect(() => {
    const syncHeight = () => {
      if (mainArticleRef.current && sidebarRef.current && news.length > 0 && activeTab === 'news') {
        const mainHeight = mainArticleRef.current.offsetHeight
        // 设置最大高度，确保不超过主文章高度
        sidebarRef.current.style.maxHeight = `${mainHeight}px`
        sidebarRef.current.style.height = `${mainHeight}px`
        sidebarRef.current.style.overflow = 'hidden'
      }
    }

    // 初始同步 - 多次尝试以确保DOM完全渲染
    if (activeTab === 'news') {
      setTimeout(syncHeight, 100)
      setTimeout(syncHeight, 300)
      setTimeout(syncHeight, 500)
    }

    // 监听窗口大小变化
    window.addEventListener('resize', syncHeight)

    // 使用 MutationObserver 监听主文章内容变化
    if (mainArticleRef.current) {
      const observer = new MutationObserver(() => {
        setTimeout(syncHeight, 50)
      })
      observer.observe(mainArticleRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      })

      return () => {
        window.removeEventListener('resize', syncHeight)
        observer.disconnect()
      }
    }

    return () => {
      window.removeEventListener('resize', syncHeight)
    }
  }, [news, activeTab])

  // 轮播控制
  useEffect(() => {
    if (todayLiveMatches.length > 1 && activeTab === 'scores') {
      const interval = setInterval(() => {
        setCurrentLiveIndex((prev) => (prev + 1) % todayLiveMatches.length)
      }, 5000)

      return () => clearInterval(interval)
    }
    return undefined
  }, [todayLiveMatches.length, activeTab])

  const goToSlide = (index: number) => {
    setCurrentLiveIndex(index)
  }

  const goToPrevious = () => {
    setCurrentLiveIndex((prev) => (prev - 1 + todayLiveMatches.length) % todayLiveMatches.length)
  }

  const goToNext = () => {
    setCurrentLiveIndex((prev) => (prev + 1) % todayLiveMatches.length)
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-8">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
              <span className="mr-3">📰</span>
              <span className="bg-gradient-to-r text-gray-900">赛事资讯</span>
            </h1>
            <p className="text-xl text-gray-600">赛事新闻、赛程安排与实时比分</p>
          </div>

          {/* 标签导航 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-1 px-6">
                {[
                  { id: 'schedule', name: '赛程', icon: '📅' },
                  { id: 'scores', name: '实时比分', icon: '🏀' },
                  { id: 'news', name: '新闻', icon: '📰' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 font-semibold text-sm transition-all ${activeTab === tab.id
                      ? 'text-gray-900 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* 内容区域 */}
            <div className="p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mb-4"></div>
                  <p className="text-gray-600">正在加载赛事数据…</p>
                </div>
              ) : validMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏀</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无比赛数据</h3>
                  <p className="text-gray-600 mb-4">正在从 NBA 官网获取数据，请稍后刷新再试</p>
                  <button
                    onClick={() => fetchData()}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
                  >
                    刷新数据
                  </button>
                </div>
              ) : (
                <>
                  {/* 赛程安排 */}
                  {activeTab === 'schedule' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">即将开始的比赛</h2>
                      {upcomingMatches.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-lg">暂无即将开始的比赛</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {upcomingByDate.map(({ date, matches: dateMatches }) => (
                            <div key={date} className="space-y-3">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                <h3 className="text-lg font-bold text-gray-700 px-4">
                                  {formatDate(date)}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                              </div>
                              <div className="space-y-2">
                                {dateMatches.map((match) => (
                                  <div key={match.id} className="bg-gradient-to-r bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-gray-600 text-white rounded-full text-xs font-semibold">
                                          {match.league}
                                        </span>
                                        {getStatusBadge(match.status)}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        <span>{formatDate(match.beijingDate || match.date)}</span>
                                        <span className="ml-2">{match.time}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-4 flex-1">
                                            <div className="text-center flex-1">
                                              <div className="flex justify-center mb-1">
                                                <img
                                                  src={getAvatarSrc(match.homeLogo || getTeamInfo(match.homeTeam, match.homeTeamId).logo)}
                                                  alt={match.homeTeam}
                                                  className="w-20 h-20 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                    const fallback = target.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'block'
                                                  }}
                                                />
                                                <div className="w-20 h-20 flex items-center justify-center text-lg font-bold text-gray-700" style={{ display: 'none' }}>
                                                  {getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}
                                                </div>
                                              </div>
                                              <div className="text-base font-semibold text-gray-700">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</div>
                                              <div className="text-xs text-gray-500 mt-0.5">主场</div>
                                            </div>
                                            <div className="text-xl font-bold text-gray-400">对阵</div>
                                            <div className="text-center flex-1">
                                              <div className="flex justify-center mb-1">
                                                <img
                                                  src={getAvatarSrc(match.awayLogo || getTeamInfo(match.awayTeam, match.awayTeamId).logo)}
                                                  alt={match.awayTeam}
                                                  className="w-20 h-20 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                    const fallback = target.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'block'
                                                  }}
                                                />
                                                <div className="w-20 h-20 flex items-center justify-center text-lg font-bold text-gray-700" style={{ display: 'none' }}>
                                                  {getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}
                                                </div>
                                              </div>
                                              <div className="text-base font-semibold text-gray-700">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</div>
                                              <div className="text-xs text-gray-500 mt-0.5">客场</div>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1.5 text-center">
                                          📍 {match.venue}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 实时比分 */}
                  {activeTab === 'scores' && (
                    <div className="space-y-6">
                      {/* 进行中的比赛 - 只显示今天的比赛 */}
                      {todayLiveMatches.length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></span>
                            进行中比赛
                            {todayLiveMatches.length > 1 && (
                              <span className="text-sm font-normal text-gray-500 ml-2">
                                ({currentLiveIndex + 1} / {todayLiveMatches.length})
                              </span>
                            )}
                          </h2>

                          <div className="relative group">
                            <div className="overflow-hidden rounded-xl">
                              <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentLiveIndex * 100}%)` }}
                              >
                                {todayLiveMatches.map((match) => (
                                    <div
                                      key={match.id}
                                      className="w-full flex-shrink-0 bg-gradient-to-r bg-gray-50 rounded-xl p-6 border-2 border-gray-300 hover:shadow-lg transition-shadow"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <span className="px-3 py-1 bg-gray-600 text-white rounded-full text-xs font-semibold">
                                          {match.league}
                                        </span>
                                        {getStatusBadge(match.status)}
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <div className="text-center flex-1">
                                              <div className="flex justify-center mb-2">
                                                <img
                                                  src={getAvatarSrc(match.homeLogo || getTeamInfo(match.homeTeam, match.homeTeamId).logo)}
                                                  alt={match.homeTeam}
                                                  className="w-24 h-24 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                    const fallback = target.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'block'
                                                  }}
                                                />
                                                <div className="w-24 h-24 flex items-center justify-center text-xl font-bold text-gray-700" style={{ display: 'none' }}>
                                                  {getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}
                                                </div>
                                              </div>
                                              <div className="text-lg font-semibold text-gray-700 mb-1">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</div>
                                              <div className="text-4xl font-bold text-gray-900 mt-2">
                                                {match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '-'}
                                              </div>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-400 mx-8">:</div>
                                            <div className="text-center flex-1">
                                              <div className="flex justify-center mb-2">
                                                <img
                                                  src={getAvatarSrc(match.awayLogo || getTeamInfo(match.awayTeam, match.awayTeamId).logo)}
                                                  alt={match.awayTeam}
                                                  className="w-24 h-24 object-contain"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement
                                                    target.style.display = 'none'
                                                    const fallback = target.nextElementSibling as HTMLElement
                                                    if (fallback) fallback.style.display = 'block'
                                                  }}
                                                />
                                                <div className="w-24 h-24 flex items-center justify-center text-xl font-bold text-gray-700" style={{ display: 'none' }}>
                                                  {getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}
                                                </div>
                                              </div>
                                              <div className="text-lg font-semibold text-gray-700 mb-1">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</div>
                                              <div className="text-4xl font-bold text-gray-900 mt-2">
                                                {match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '-'}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-sm text-gray-600 mt-4 text-center">
                                            📍 {match.venue}
                                          </div>

                                          {/* 球员统计数据 */}
                                          {(match.homeTopScorer || match.awayTopScorer || match.homeTopRebounder || match.awayTopRebounder || match.homeTopAssister || match.awayTopAssister) && (
                                            <div className="mt-6 pt-4 border-t border-gray-200">
                                              {/* 头像放两边；中间是标签；标签两侧显示数据 */}
                                              <div className="space-y-2 max-w-[920px] mx-auto">
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6 text-sm font-semibold text-gray-700 mb-2">
                                                  <div />
                                                  <div className="truncate">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</div>
                                                  <div />
                                                  <div className="truncate text-right">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</div>
                                                  <div />
                                                </div>

                                                {/* 得分王 */}
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6">
                                                  <div className="relative w-14 h-14 flex-shrink-0">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.homeTopScorer?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.homeTopScorer?.avatar ? (
                                                      <PlayerAvatar src={match.homeTopScorer.avatar} alt={match.homeTopScorer.name} />
                                                    ) : null}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.homeTopScorer?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-gray-900">{match.homeTopScorer?.points ?? '-'} 分</div>
                                                  </div>
                                                  <div className="px-3 text-base font-extrabold text-gray-800 text-center whitespace-nowrap">得分王</div>
                                                  <div className="min-w-0 text-right">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.awayTopScorer?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-gray-900">{match.awayTopScorer?.points ?? '-'} 分</div>
                                                  </div>
                                                  <div className="relative w-14 h-14 flex-shrink-0 justify-self-end">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.awayTopScorer?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.awayTopScorer?.avatar ? (
                                                      <PlayerAvatar src={match.awayTopScorer.avatar} alt={match.awayTopScorer.name} />
                                                    ) : null}
                                                  </div>
                                                </div>

                                                {/* 篮板王 */}
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6">
                                                  <div className="relative w-14 h-14 flex-shrink-0">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.homeTopRebounder?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.homeTopRebounder?.avatar ? (
                                                      <PlayerAvatar src={match.homeTopRebounder.avatar} alt={match.homeTopRebounder.name} />
                                                    ) : null}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.homeTopRebounder?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-blue-600">{match.homeTopRebounder?.rebounds ?? '-'} 板</div>
                                                  </div>
                                                  <div className="px-3 text-base font-extrabold text-gray-800 text-center whitespace-nowrap">篮板王</div>
                                                  <div className="min-w-0 text-right">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.awayTopRebounder?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-blue-600">{match.awayTopRebounder?.rebounds ?? '-'} 板</div>
                                                  </div>
                                                  <div className="relative w-14 h-14 flex-shrink-0 justify-self-end">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.awayTopRebounder?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.awayTopRebounder?.avatar ? (
                                                      <PlayerAvatar src={match.awayTopRebounder.avatar} alt={match.awayTopRebounder.name} />
                                                    ) : null}
                                                  </div>
                                                </div>

                                                {/* 助攻王 */}
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6">
                                                  <div className="relative w-14 h-14 flex-shrink-0">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.homeTopAssister?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.homeTopAssister?.avatar ? (
                                                      <PlayerAvatar src={match.homeTopAssister.avatar} alt={match.homeTopAssister.name} />
                                                    ) : null}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.homeTopAssister?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-green-600">{match.homeTopAssister?.assists ?? '-'} 助</div>
                                                  </div>
                                                  <div className="px-3 text-base font-extrabold text-gray-800 text-center whitespace-nowrap">助攻王</div>
                                                  <div className="min-w-0 text-right">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.awayTopAssister?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-green-600">{match.awayTopAssister?.assists ?? '-'} 助</div>
                                                  </div>
                                                  <div className="relative w-14 h-14 flex-shrink-0 justify-self-end">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.awayTopAssister?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.awayTopAssister?.avatar ? (
                                                      <PlayerAvatar src={match.awayTopAssister.avatar} alt={match.awayTopAssister.name} />
                                                    ) : null}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                ))}
                              </div>
                            </div>

                            {/* 轮播控制按钮 */}
                            {todayLiveMatches.length > 1 && (
                              <>
                                <button
                                  onClick={goToPrevious}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100"
                                  aria-label="上一场比赛"
                                >
                                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={goToNext}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100"
                                  aria-label="下一场比赛"
                                >
                                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>

                                <div className="flex justify-center gap-2 mt-4">
                                  {todayLiveMatches.map((_, index) => (
                                    <button
                                      key={index}
                                      onClick={() => goToSlide(index)}
                                      className={`h-2 rounded-full transition-all duration-300 ease-out ${index === currentLiveIndex
                                        ? 'w-8 bg-gray-600'
                                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                                        }`}
                                      aria-label={`切换到第${index + 1}场比赛`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 进行中比赛 - 轮播下方逐行显示 */}
                      {todayLiveMatches.length > 0 && (
                        <div className="mb-8">
                          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
                            正在直播（逐场显示）
                          </h2>
                          <div className="space-y-3">
                            {todayLiveMatches.map((match) => {
                              const isExpanded = expandedMatchId === match.id
                              const hasLinescores = (match.homeLinescores?.length ?? 0) > 0 || (match.awayLinescores?.length ?? 0) > 0
                              return (
                                <div
                                  key={match.id}
                                  className="bg-gradient-to-r bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                                >
                                  <div
                                    className={`flex items-center justify-between p-4 hover:shadow-md transition-shadow duration-300 ease-out ${hasLinescores ? 'cursor-pointer' : ''}`}
                                    onClick={() => hasLinescores && setExpandedMatchId(isExpanded ? null : match.id)}
                                  >
                                    <div className="flex items-center gap-6 flex-1 min-w-0">
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <img
                                          src={getAvatarSrc(match.homeLogo || getTeamInfo(match.homeTeam, match.homeTeamId).logo)}
                                          alt={match.homeTeam}
                                          className="w-12 h-12 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                          }}
                                        />
                                        <div className="text-center min-w-[80px]">
                                          <div className="font-semibold text-gray-900">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</div>
                                          <div className="text-xl font-bold text-gray-900">{match.homeScore ?? '-'}</div>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-center flex-shrink-0">
                                        <span className="text-xs font-medium text-gray-700">{match.time}</span>
                                        <span className="text-gray-400 text-lg">对阵</span>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-center min-w-[80px]">
                                          <div className="font-semibold text-gray-900">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</div>
                                          <div className="text-xl font-bold text-gray-900">{match.awayScore ?? '-'}</div>
                                        </div>
                                        <img
                                          src={getAvatarSrc(match.awayLogo || getTeamInfo(match.awayTeam, match.awayTeamId).logo)}
                                          alt={match.awayTeam}
                                          className="w-12 h-12 object-contain"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                      <div className="hidden sm:block text-sm text-gray-600">📍 {match.venue}</div>
                                      {hasLinescores && (
                                        <svg
                                          className={`w-4 h-4 text-gray-500 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  {hasLinescores && (
                                    <div
                                      className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}
                                    >
                                      <div className="border-t border-gray-200 bg-white px-4 py-4">
                                        <QuarterScoresTable match={match} getTeamInfo={getTeamInfo} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* 已结束的比赛 */}
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">已结束比赛</h2>
                        {finishedMatches.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">暂无已结束比赛</p>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            {finishedByDate.map(({ date, matches: dateMatches }) => (
                              <div key={date} className="space-y-3">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                  <h3 className="text-lg font-bold text-gray-700 px-4">
                                    {formatDate(date)}
                                  </h3>
                                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                                </div>
                                <div className="space-y-2">
                                  {dateMatches.map((match) => {
                                    const isExpanded = expandedMatchId === match.id
                                    // 检查球员统计数据是否存在（排除null和undefined）
                                    const hasPlayerStats = !!(
                                      (match.homeTopScorer && match.homeTopScorer.name) ||
                                      (match.homeTopRebounder && match.homeTopRebounder.name) ||
                                      (match.homeTopAssister && match.homeTopAssister.name) ||
                                      (match.awayTopScorer && match.awayTopScorer.name) ||
                                      (match.awayTopRebounder && match.awayTopRebounder.name) ||
                                      (match.awayTopAssister && match.awayTopAssister.name)
                                    )

                                    return (
                                      <div key={match.id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-300 ease-out overflow-hidden">
                                        <div
                                          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors duration-300 ease-out"
                                          onClick={() => {
                                            setExpandedMatchId(isExpanded ? null : match.id)
                                          }}
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="px-2 py-0.5 bg-gray-600 text-white rounded-full text-xs font-semibold">
                                              {match.league}
                                            </span>
                                            <div className="flex items-center gap-2">
                                              <div className="text-xs text-gray-600">
                                                {formatDate(match.beijingDate || match.date)}
                                              </div>
                                              {/* 所有已结束的比赛都显示下拉箭头 */}
                                              <svg
                                                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                              </svg>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center justify-between">
                                                <div className="text-center flex-1">
                                                  <div className="flex justify-center mb-1">
                                                    <img
                                                      src={getAvatarSrc(match.homeLogo || getTeamInfo(match.homeTeam, match.homeTeamId).logo)}
                                                      alt={match.homeTeam}
                                                      className="w-20 h-20 object-contain"
                                                      onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.style.display = 'none'
                                                        const fallback = target.nextElementSibling as HTMLElement
                                                        if (fallback) fallback.style.display = 'block'
                                                      }}
                                                    />
                                                    <div className="w-20 h-20 flex items-center justify-center text-lg font-bold text-gray-700" style={{ display: 'none' }}>
                                                      {getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}
                                                    </div>
                                                  </div>
                                                  <div className="text-base font-semibold text-gray-700 mb-0.5">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</div>
                                                  <div className={`text-xl font-bold mt-1 ${match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
                                                    ? 'text-gray-900'
                                                    : match.homeScore !== null && match.awayScore !== null && match.homeScore < match.awayScore
                                                      ? 'text-gray-400'
                                                      : 'text-gray-600'
                                                    }`}>
                                                    {match.homeScore !== null && match.homeScore !== undefined ? match.homeScore : '-'}
                                                  </div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-400 mx-4">-</div>
                                                <div className="text-center flex-1">
                                                  <div className="flex justify-center mb-1">
                                                    <img
                                                      src={getAvatarSrc(match.awayLogo || getTeamInfo(match.awayTeam, match.awayTeamId).logo)}
                                                      alt={match.awayTeam}
                                                      className="w-20 h-20 object-contain"
                                                      onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.style.display = 'none'
                                                        const fallback = target.nextElementSibling as HTMLElement
                                                        if (fallback) fallback.style.display = 'block'
                                                      }}
                                                    />
                                                    <div className="w-20 h-20 flex items-center justify-center text-lg font-bold text-gray-700" style={{ display: 'none' }}>
                                                      {getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}
                                                    </div>
                                                  </div>
                                                  <div className="text-base font-semibold text-gray-700 mb-0.5">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</div>
                                                  <div className={`text-xl font-bold mt-1 ${match.awayScore !== null && match.homeScore !== null && match.awayScore > match.homeScore
                                                    ? 'text-gray-900'
                                                    : match.awayScore !== null && match.homeScore !== null && match.awayScore < match.homeScore
                                                      ? 'text-gray-400'
                                                      : 'text-gray-600'
                                                    }`}>
                                                    {match.awayScore !== null && match.awayScore !== undefined ? match.awayScore : '-'}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-xs text-gray-600 mt-1.5 text-center">
                                                📍 {match.venue}
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* 球员统计与每节得分下拉框 - 所有已结束的比赛都显示 */}
                                        <div
                                          className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}
                                        >
                                          <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-gray-50">
                                            {((match.homeLinescores?.length ?? 0) > 0 || (match.awayLinescores?.length ?? 0) > 0) && (
                                              <div className="mb-4">
                                                <QuarterScoresTable match={match} getTeamInfo={getTeamInfo} />
                                              </div>
                                            )}
                                            {hasPlayerStats ? (
                                              <div className="space-y-2 max-w-[920px] mx-auto">
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6 text-sm font-semibold text-gray-700 mb-2">
                                                  <div />
                                                  <div className="truncate">{getTeamInfo(match.homeTeam, match.homeTeamId).abbreviation}</div>
                                                  <div />
                                                  <div className="truncate text-right">{getTeamInfo(match.awayTeam, match.awayTeamId).abbreviation}</div>
                                                  <div />
                                                </div>

                                                {/* 得分王 */}
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6">
                                                  <div className="relative w-14 h-14 flex-shrink-0">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.homeTopScorer?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.homeTopScorer?.avatar ? (
                                                      <PlayerAvatar src={match.homeTopScorer.avatar} alt={match.homeTopScorer.name} />
                                                    ) : null}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.homeTopScorer?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-gray-900">{match.homeTopScorer?.points ?? '-'} 分</div>
                                                  </div>
                                                  <div className="px-3 text-base font-extrabold text-gray-800 text-center whitespace-nowrap">得分王</div>
                                                  <div className="min-w-0 text-right">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.awayTopScorer?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-gray-900">{match.awayTopScorer?.points ?? '-'} 分</div>
                                                  </div>
                                                  <div className="relative w-14 h-14 flex-shrink-0 justify-self-end">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.awayTopScorer?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.awayTopScorer?.avatar ? (
                                                      <PlayerAvatar src={match.awayTopScorer.avatar} alt={match.awayTopScorer.name} />
                                                    ) : null}
                                                  </div>
                                                </div>

                                                {/* 篮板王 */}
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6">
                                                  <div className="relative w-14 h-14 flex-shrink-0">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.homeTopRebounder?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.homeTopRebounder?.avatar ? (
                                                      <PlayerAvatar src={match.homeTopRebounder.avatar} alt={match.homeTopRebounder.name} />
                                                    ) : null}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.homeTopRebounder?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-blue-600">{match.homeTopRebounder?.rebounds ?? '-'} 板</div>
                                                  </div>
                                                  <div className="px-3 text-base font-extrabold text-gray-800 text-center whitespace-nowrap">篮板王</div>
                                                  <div className="min-w-0 text-right">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.awayTopRebounder?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-blue-600">{match.awayTopRebounder?.rebounds ?? '-'} 板</div>
                                                  </div>
                                                  <div className="relative w-14 h-14 flex-shrink-0 justify-self-end">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.awayTopRebounder?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.awayTopRebounder?.avatar ? (
                                                      <PlayerAvatar src={match.awayTopRebounder.avatar} alt={match.awayTopRebounder.name} />
                                                    ) : null}
                                                  </div>
                                                </div>

                                                {/* 助攻王 */}
                                                <div className="grid grid-cols-[72px,1fr,auto,1fr,72px] items-center gap-6">
                                                  <div className="relative w-14 h-14 flex-shrink-0">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.homeTopAssister?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.homeTopAssister?.avatar ? (
                                                      <PlayerAvatar src={match.homeTopAssister.avatar} alt={match.homeTopAssister.name} />
                                                    ) : null}
                                                  </div>
                                                  <div className="min-w-0">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.homeTopAssister?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-green-600">{match.homeTopAssister?.assists ?? '-'} 助</div>
                                                  </div>
                                                  <div className="px-3 text-base font-extrabold text-gray-800 text-center whitespace-nowrap">助攻王</div>
                                                  <div className="min-w-0 text-right">
                                                    <div className="text-base font-semibold text-gray-900 truncate">{match.awayTopAssister?.name || '-'}</div>
                                                    <div className="text-sm font-semibold text-green-600">{match.awayTopAssister?.assists ?? '-'} 助</div>
                                                  </div>
                                                  <div className="relative w-14 h-14 flex-shrink-0 justify-self-end">
                                                    <div className="absolute inset-0 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                                      {match.awayTopAssister?.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    {match.awayTopAssister?.avatar ? (
                                                      <PlayerAvatar src={match.awayTopAssister.avatar} alt={match.awayTopAssister.name} />
                                                    ) : null}
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="text-center py-4 text-gray-500 text-sm">
                                                暂无球员数据
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 赛事新闻 */}
                  {activeTab === 'news' && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">最新赛事新闻</h2>
                      {news.length === 0 ? (
                        <div className="text-center py-12">
                          <p className="text-gray-500 text-lg">暂无赛事新闻</p>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {/* 主文章 + 侧边栏布局 */}
                          {news.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* 主文章（左侧，占2列） */}
                              <div className="lg:col-span-2" id="main-article" ref={mainArticleRef}>
                                <a
                                  href={news[0].url || '#'}
                                  target={news[0].url ? '_blank' : undefined}
                                  rel={news[0].url ? 'noopener noreferrer' : undefined}
                                  className="block group"
                                >
                                  <div className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300">
                                    <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                                      {news[0].image ? (
                                        <img
                                          src={news[0].image}
                                          alt={news[0].title}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                          loading="lazy"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                            const placeholder = target.parentElement?.querySelector('.image-placeholder')
                                            if (placeholder) {
                                              (placeholder as HTMLElement).style.display = 'flex'
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div className="image-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" style={{ display: news[0].image ? 'none' : 'flex' }}>
                                        <div className="text-center">
                                          <div className="text-7xl mb-3">🏀</div>
                                          <div className="text-lg text-gray-500 font-semibold">NBA</div>
                                        </div>
                                      </div>
                                      <div className="absolute top-4 left-4 px-3 py-1 bg-gray-600 text-white rounded-full text-xs font-semibold shadow-md">
                                        热门
                                      </div>
                                    </div>
                                    <div className="p-6">
                                      <h3 className="text-3xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-gray-600 transition-colors">
                                        {news[0].title}
                                      </h3>
                                      <p className="text-gray-600 mb-4 line-clamp-3 text-base leading-relaxed">
                                        {news[0].content}
                                      </p>
                                      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                                        <span className="font-medium">{news[0].author}</span>
                                        <span>{formatDate(news[0].publishedAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              </div>

                              {/* 侧边栏（右侧，占1列）- 显示6条新闻，总高度与主文章一致 */}
                              {news.length > 1 && (
                                <div className="flex flex-col gap-2" ref={sidebarRef} style={{ maxHeight: '100%', overflow: 'hidden' }}>
                                  {news.slice(1, 7).map((item) => (
                                    <a
                                      key={item.id}
                                      href={item.url || '#'}
                                      target={item.url ? '_blank' : undefined}
                                      rel={item.url ? 'noopener noreferrer' : undefined}
                                      className="block group flex-1 min-h-0"
                                    >
                                      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 flex gap-2 p-2 h-full items-stretch">
                                        <div className="w-28 h-full flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden rounded-lg relative">
                                          {item.image ? (
                                            <img
                                              src={item.image}
                                              alt={item.title}
                                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                              loading="lazy"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.style.display = 'none'
                                                const placeholder = target.parentElement?.querySelector('.image-placeholder')
                                                if (placeholder) {
                                                  (placeholder as HTMLElement).style.display = 'flex'
                                                }
                                              }}
                                            />
                                          ) : null}
                                          <div className="image-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" style={{ display: item.image ? 'none' : 'flex' }}>
                                            <div className="text-xl">🏀</div>
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-between min-h-0">
                                          <div className="min-h-0">
                                            <h4 className="text-xs font-bold text-gray-900 mb-0.5 line-clamp-2 group-hover:text-gray-600 transition-colors">
                                              {item.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 mb-1 line-clamp-1">
                                              {item.content}
                                            </p>
                                          </div>
                                          <div className="flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
                                            <span className="truncate">{item.author}</span>
                                            <span className="ml-1">{formatDate(item.publishedAt)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 底部新闻网格 - 显示5条新闻 */}
                          {news.length > 7 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                              {news.slice(7, 12).map((item) => (
                                <a
                                  key={item.id}
                                  href={item.url || '#'}
                                  target={item.url ? '_blank' : undefined}
                                  rel={item.url ? 'noopener noreferrer' : undefined}
                                  className="block group"
                                >
                                  <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.title}
                                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                          loading="lazy"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                            const placeholder = target.parentElement?.querySelector('.image-placeholder')
                                            if (placeholder) {
                                              (placeholder as HTMLElement).style.display = 'flex'
                                            }
                                          }}
                                        />
                                      ) : null}
                                      <div className="image-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200" style={{ display: item.image ? 'none' : 'flex' }}>
                                        <div className="text-4xl">🏀</div>
                                      </div>
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col">
                                      <h4 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gray-600 transition-colors">
                                        {item.title}
                                      </h4>
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">
                                        {item.content}
                                      </p>
                                      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                        <span>{item.author}</span>
                                        <span>{formatDate(item.publishedAt)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
