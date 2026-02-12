/**
 * Node.js NBA schedule fetcher - 从 ESPN API 获取数据，适用于 Vercel 等无 Python 环境
 */

const TEAM_NAME_TO_CHINESE: Record<string, string> = {
  'Atlanta Hawks': '亚特兰大老鹰',
  'Boston Celtics': '波士顿凯尔特人',
  'Cleveland Cavaliers': '克利夫兰骑士',
  'New Orleans Pelicans': '新奥尔良鹈鹕',
  'Chicago Bulls': '芝加哥公牛',
  'Dallas Mavericks': '达拉斯独行侠',
  'Denver Nuggets': '丹佛掘金',
  'Golden State Warriors': '金州勇士',
  'Houston Rockets': '休斯顿火箭',
  'LA Clippers': '洛杉矶快船',
  'Los Angeles Clippers': '洛杉矶快船',
  'Los Angeles Lakers': '洛杉矶湖人',
  'Miami Heat': '迈阿密热火',
  'Milwaukee Bucks': '密尔沃基雄鹿',
  'Minnesota Timberwolves': '明尼苏达森林狼',
  'Brooklyn Nets': '布鲁克林篮网',
  'New York Knicks': '纽约尼克斯',
  'Orlando Magic': '奥兰多魔术',
  'Indiana Pacers': '印第安纳步行者',
  'Philadelphia 76ers': '费城76人',
  'Phoenix Suns': '菲尼克斯太阳',
  'Portland Trail Blazers': '波特兰开拓者',
  'Sacramento Kings': '萨克拉门托国王',
  'San Antonio Spurs': '圣安东尼奥马刺',
  'Oklahoma City Thunder': '俄克拉荷马雷霆',
  'Toronto Raptors': '多伦多猛龙',
  'Utah Jazz': '犹他爵士',
  'Memphis Grizzlies': '孟菲斯灰熊',
  'Washington Wizards': '华盛顿奇才',
  'Detroit Pistons': '底特律活塞',
  'Charlotte Hornets': '夏洛特黄蜂'
}

function getChineseTeamName(englishName: string): string {
  if (!englishName) return '未知球队'
  return TEAM_NAME_TO_CHINESE[englishName] || englishName
}

function toIntOrNull(v: unknown): number | null {
  if (v == null) return null
  if (typeof v === 'number') return Math.floor(v)
  const s = String(v).trim()
  if (s === '') return null
  const n = parseFloat(s)
  return isNaN(n) ? null : Math.floor(n)
}

export interface LinescorePeriod {
  period: number
  value: number
}

export interface NBAMatchFromFetch {
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
  homeTopScorer?: { name: string; points?: number; avatar?: string } | null
  homeTopRebounder?: { name: string; rebounds?: number; avatar?: string } | null
  homeTopAssister?: { name: string; assists?: number; avatar?: string } | null
  awayTopScorer?: { name: string; points?: number; avatar?: string } | null
  awayTopRebounder?: { name: string; rebounds?: number; avatar?: string } | null
  awayTopAssister?: { name: string; assists?: number; avatar?: string } | null
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9'
}

/** 获取美东时间某天的 YYYYMMDD（NBA 赛程以美东日期为准） */
function getETDateString(offsetDays: number): string {
  const etStr = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  const et = new Date(etStr)
  et.setDate(et.getDate() + offsetDays)
  const y = et.getFullYear()
  const m = String(et.getMonth() + 1).padStart(2, '0')
  const d = String(et.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/** 从 ESPN API 获取 NBA 赛程 */
export async function fetchNBAScheduleNode(): Promise<NBAMatchFromFetch[]> {
  const matches: NBAMatchFromFetch[] = []
  const dates: string[] = []

  for (let offset = -3; offset <= 3; offset++) {
    const dateStr = getETDateString(offset)
    if (!dates.includes(dateStr)) dates.push(dateStr)
  }

  for (const dateStr of dates) {
    try {
      const url = `https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
      if (!res.ok) continue

      const data = await res.json()
      const events = data.events || []

      for (const e of events) {
        try {
          const comp = (e.competitions || [{}])[0] || {}
          const comps = comp.competitors || []
          const home = comps.find((c: { homeAway: string }) => c.homeAway === 'home')
          const away = comps.find((c: { homeAway: string }) => c.homeAway === 'away')
          if (!home || !away) continue

          const homeTeam = getChineseTeamName((home.team || {}).displayName || '')
          const awayTeam = getChineseTeamName((away.team || {}).displayName || '')

          const gameId = e.id || (e.uid || '').split('~')[1] || ''
          const rawDate = e.date || e.competitions?.[0]?.date || ''
          const stEvent = e.status || comp.status
          const statusText = (stEvent?.type?.state || '').toUpperCase()
          const isCompleted = !!(stEvent?.type as { completed?: boolean })?.completed
          let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
          if (statusText === 'PRE' || statusText === 'POST') status = statusText === 'PRE' ? 'upcoming' : 'finished'
          else if (statusText === 'IN') status = 'live'
          else if (isCompleted) status = 'finished'

          const homeScore = toIntOrNull(home.score)
          const awayScore = toIntOrNull(away.score)
          // 进行中的比赛（IN）绝不能改为 finished
          if (status === 'live') {
            // 保持 live，不做任何覆盖
          } else {
            // 有完整比分且 API 标记已结束 → 确保为 finished（防止漏判）
            if (status === 'upcoming' && homeScore != null && awayScore != null && isCompleted) status = 'finished'
            // 有完整比分且开赛时间已过 → 视为 finished（仅当 status 仍为 upcoming 时）
            if (status === 'upcoming' && homeScore != null && awayScore != null && rawDate) {
              const gameTime = new Date(rawDate).getTime()
              if (gameTime < Date.now() - 60000) status = 'finished' // 开赛超过 1 分钟
            }
          }
          const dateObj = rawDate ? new Date(rawDate) : new Date()
          // 使用美东日期，与前端 convertETDateToBeijing 一致
          const dateStrOut = dateObj.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
          const st = e.status || {}
          let timeStr: string
          if (status === 'live') {
            const period = st.period ?? 0
            const displayClock = st.displayClock ?? ''
            const shortDetail = (st.type as { shortDetail?: string })?.shortDetail ?? ''
            if (shortDetail && (shortDetail.toLowerCase().includes('halftime') || shortDetail === 'Half')) {
              timeStr = 'Halftime'
            } else if (period > 0 && displayClock) {
              timeStr = `Q${period} ${displayClock}`
            } else {
              timeStr = shortDetail || 'Live'
            }
          } else {
            timeStr = rawDate ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'
          }

          const venue = comp.venue?.fullName || comp.venue?.address?.city || '未知场馆'

          const parseLinescores = (c: { linescores?: Array<{ period?: number; value?: number; displayValue?: string }> }) => {
            const arr = c.linescores || []
            return arr
              .map((s) => ({ period: s.period ?? 0, value: s.value != null ? Math.floor(s.value) : 0 }))
              .filter((s) => s.period > 0)
          }

          const takeLeader = (c: Record<string, unknown>, cat: string) => {
            const leaders = (c.leaders as Array<Record<string, unknown>>) || []
            const catLower = cat.toLowerCase()
            const abbrevMap: Record<string, string[]> = { points: ['pts', 'points'], rebounds: ['reb', 'rebounds'], assists: ['ast', 'assists'] }
            const catAliases = abbrevMap[catLower] || [catLower]
            for (const l of leaders) {
              const lName = String((l as Record<string, unknown>).name || '').toLowerCase()
              const lAbbr = String((l as Record<string, unknown>).abbreviation || '').toLowerCase()
              const matches = catAliases.some(a => lName === a || lName.includes(a) || lAbbr === a)
              if (!matches) continue
              const lLeaders = ((l as Record<string, unknown>).leaders as Array<Record<string, unknown>>) || []
              const first = lLeaders[0] || {}
              const athlete = (first.athlete as Record<string, unknown>) || {}
              const name = String(athlete.displayName || '').trim()
              let athleteId = String(athlete.id || '').trim()
              if (!athleteId) {
                const links = (athlete.links as Array<{ href?: string }>) || []
                const playerLink = links.find(lnk => lnk?.href?.includes('/player/_/id/'))
                const idMatch = playerLink?.href?.match(/\/id\/(\d+)/)
                if (idMatch) athleteId = idMatch[1]
              }
              let avatar: string | null = null
              const headshotRaw = athlete.headshot
              if (typeof headshotRaw === 'string' && headshotRaw.startsWith('http')) {
                avatar = headshotRaw
              } else if (headshotRaw && typeof headshotRaw === 'object') {
                const href = (headshotRaw as { href?: string }).href || null
                if (href) avatar = href.startsWith('http') ? href : `https://a.espncdn.com${href.startsWith('/') ? '' : '/'}${href}`
              }
              if (!avatar && athleteId) avatar = `https://a.espncdn.com/i/headshots/nba/players/full/${athleteId}.png`
              const value = toIntOrNull((first as Record<string, unknown>).value)
              if (!name) return null
              if (catLower === 'points') return { name, avatar: avatar || undefined, points: value ?? undefined }
              if (catLower === 'rebounds') return { name, avatar: avatar || undefined, rebounds: value ?? undefined }
              if (catLower === 'assists') return { name, avatar: avatar || undefined, assists: value ?? undefined }
            }
            return null
          }

          const homeLogo = typeof (home.team as { logo?: string })?.logo === 'string' ? (home.team as { logo: string }).logo : undefined
          const awayLogo = typeof (away.team as { logo?: string })?.logo === 'string' ? (away.team as { logo: string }).logo : undefined

          matches.push({
            id: gameId,
            homeTeam,
            awayTeam,
            homeTeamId: toIntOrNull(home.team?.id) ?? undefined,
            awayTeamId: toIntOrNull(away.team?.id) ?? undefined,
            homeLogo,
            awayLogo,
            homeScore,
            awayScore,
            status,
            date: dateStrOut,
            time: timeStr,
            league: 'NBA',
            venue,
            homeLinescores: parseLinescores(home),
            awayLinescores: parseLinescores(away),
            homeTopScorer: takeLeader(home, 'points'),
            homeTopRebounder: takeLeader(home, 'rebounds'),
            homeTopAssister: takeLeader(home, 'assists'),
            awayTopScorer: takeLeader(away, 'points'),
            awayTopRebounder: takeLeader(away, 'rebounds'),
            awayTopAssister: takeLeader(away, 'assists')
          })
        } catch (err) {
          continue
        }
      }
    } catch (err) {
      continue
    }
  }

  return matches
}
