/**
 * Node.js NBA schedule fetcher - works on Vercel (no Python required)
 * Fetches from ESPN API and NBA CDN
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

export interface NBAMatchFromFetch {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId?: number
  awayTeamId?: number
  homeScore: number | null
  awayScore: number | null
  status: 'upcoming' | 'live' | 'finished'
  date: string
  time: string
  league: string
  venue: string
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

/** Fetch NBA schedule from ESPN API - works on Vercel */
export async function fetchNBAScheduleNode(): Promise<NBAMatchFromFetch[]> {
  const matches: NBAMatchFromFetch[] = []
  const dates: string[] = []

  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''))
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
          const statusText = (e.status?.type?.state || '').toUpperCase()
          let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
          if (statusText === 'pre' || statusText === 'post') status = statusText === 'pre' ? 'upcoming' : 'finished'
          else if (statusText === 'in') status = 'live'

          const homeScore = toIntOrNull(home.score)
          const awayScore = toIntOrNull(away.score)

          const rawDate = e.date || e.competitions?.[0]?.date || ''
          const dateObj = rawDate ? new Date(rawDate) : new Date()
          const dateStrOut = dateObj.toISOString().slice(0, 10)
          const timeStr = rawDate ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBD'

          const venue = comp.venue?.fullName || comp.venue?.address?.city || '未知场馆'

          const takeLeader = (c: Record<string, unknown>, cat: string) => {
            const leaders = (c.leaders as Array<Record<string, unknown>>) || []
            const catLower = cat.toLowerCase()
            for (const l of leaders) {
              const lName = String((l as Record<string, unknown>).name || '').toLowerCase()
              if (lName !== catLower && !lName.includes(catLower)) continue
              const lLeaders = ((l as Record<string, unknown>).leaders as Array<Record<string, unknown>>) || []
              const first = lLeaders[0] || {}
              const athlete = (first.athlete as Record<string, unknown>) || {}
              const name = String(athlete.displayName || '').trim()
              const athleteId = String(athlete.id || '').trim()
              const headshot = (athlete.headshot as Record<string, unknown>) || {}
              let avatar: string | null = typeof headshot === 'object' && headshot ? (headshot.href as string) || null : null
              if (!avatar && athleteId) avatar = `https://a.espncdn.com/i/headshots/nba/players/full/${athleteId}.png`
              const value = toIntOrNull((first as Record<string, unknown>).value)
              if (!name) return null
              if (catLower === 'points') return { name, avatar: avatar || undefined, points: value ?? undefined }
              if (catLower === 'rebounds') return { name, avatar: avatar || undefined, rebounds: value ?? undefined }
              if (catLower === 'assists') return { name, avatar: avatar || undefined, assists: value ?? undefined }
            }
            return null
          }

          matches.push({
            id: gameId,
            homeTeam,
            awayTeam,
            homeTeamId: toIntOrNull(home.team?.id) ?? undefined,
            awayTeamId: toIntOrNull(away.team?.id) ?? undefined,
            homeScore,
            awayScore,
            status,
            date: dateStrOut,
            time: timeStr,
            league: 'NBA',
            venue,
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
