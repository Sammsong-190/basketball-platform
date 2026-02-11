#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NBA数据爬虫
从NBA官网获取比赛赛程和比分数据
"""

import json
import sys
import os
import requests
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

# NBA球队ID到中文名称的映射
TEAM_ID_TO_CHINESE = {
    1610612737: '亚特兰大老鹰',
    1610612738: '波士顿凯尔特人',
    1610612739: '克利夫兰骑士',
    1610612740: '新奥尔良鹈鹕',
    1610612741: '芝加哥公牛',
    1610612742: '达拉斯独行侠',
    1610612743: '丹佛掘金',
    1610612744: '金州勇士',
    1610612745: '休斯顿火箭',
    1610612746: '洛杉矶快船',
    1610612747: '洛杉矶湖人',
    1610612748: '迈阿密热火',
    1610612749: '密尔沃基雄鹿',
    1610612750: '明尼苏达森林狼',
    1610612751: '布鲁克林篮网',
    1610612752: '纽约尼克斯',
    1610612753: '奥兰多魔术',
    1610612754: '印第安纳步行者',
    1610612755: '费城76人',
    1610612756: '菲尼克斯太阳',
    1610612757: '波特兰开拓者',
    1610612758: '萨克拉门托国王',
    1610612759: '圣安东尼奥马刺',
    1610612760: '俄克拉荷马雷霆',
    1610612761: '多伦多猛龙',
    1610612762: '犹他爵士',
    1610612763: '孟菲斯灰熊',
    1610612764: '华盛顿奇才',
    1610612765: '底特律活塞',
    1610612766: '夏洛特黄蜂'
}

# 英文球队名称到中文名称的映射
TEAM_NAME_TO_CHINESE = {
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


def get_chinese_team_name(team_id: Optional[int], english_name: Optional[str]) -> str:
    """将英文球队名称转换为中文"""
    if team_id and team_id in TEAM_ID_TO_CHINESE:
        return TEAM_ID_TO_CHINESE[team_id]
    if english_name and english_name in TEAM_NAME_TO_CHINESE:
        return TEAM_NAME_TO_CHINESE[english_name]
    # 尝试部分匹配
    if english_name:
        for en, zh in TEAM_NAME_TO_CHINESE.items():
            if en in english_name or english_name in en:
                return zh
    return english_name or '未知球队'


def fetch_nba_schedule_for_date(date_offset: int) -> List[Dict]:
    """获取指定日期的NBA赛程（优先使用cdn.nba.com官方JSON，更稳定）"""
    # ✅ 按官网口径：以美东(ET)作为“日期分组/今天”的基准
    ny_tz = ZoneInfo("America/New_York")
    base_et = datetime.now(ny_tz) + timedelta(days=date_offset)
    yyyymmdd = base_et.strftime("%Y%m%d")

    def _fetch_with_cdn_scoreboard(yyyymmdd_str: str) -> List[Dict]:
        url = f"https://cdn.nba.com/static/json/liveData/scoreboard/scoreboard_{yyyymmdd_str}.json"
        headers = {
            # CDN也可能做了简单的反爬校验，这里尽量模拟浏览器请求头
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Origin": "https://www.nba.com",
            "Referer": "https://www.nba.com/games",
            "Connection": "keep-alive"
        }
        debug = os.getenv("NBA_DEBUG", "").strip() in (
            "1", "true", "TRUE", "yes", "YES")

        def _fetch_cdn_boxscore(game_id: str) -> Optional[Dict]:
            """
            从NBA CDN获取单场比赛 boxscore（包含球员统计）。
            参考：https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{gameId}.json
            返回值通常为 data["game"]（含 homeTeam/awayTeam/players 等）
            """
            if not game_id:
                return None
            box_url = f"https://cdn.nba.com/static/json/liveData/boxscore/boxscore_{game_id}.json"
            try:
                resp = requests.get(box_url, headers=headers, timeout=15)
                if resp.status_code != 200:
                    if debug:
                        print(
                            f"boxscore请求失败: {resp.status_code} {box_url}", file=sys.stderr)
                    return None
                data = resp.json() or {}
                # 绝大多数情况下是 { game: {...} }
                if isinstance(data, dict) and isinstance(data.get("game"), dict):
                    return data["game"]
                # 兜底
                return data if isinstance(data, dict) else None
            except Exception as e:
                if debug:
                    print(f"boxscore请求异常: {e} {box_url}", file=sys.stderr)
                return None

        print(f"正在尝试(CDN): {url}", file=sys.stderr)
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code != 200:
            print(f"CDN请求失败: {resp.status_code}", file=sys.stderr)
            return []
        data = resp.json()
        scoreboard = data.get("scoreboard") or {}
        games = scoreboard.get("games") or []
        out: List[Dict] = []

        for g in games:
            try:
                game_id = str(g.get("gameId") or "")
                if not game_id:
                    continue

                # gameStatus: 1=upcoming, 2=live, 3=finished
                gs = int(g.get("gameStatus") or 1)
                status = "upcoming"
                if gs == 2:
                    status = "live"
                elif gs == 3:
                    status = "finished"

                utc_str = g.get("gameTimeUTC") or ""
                # 统一以比赛开赛UTC时间换算到美东(ET)，确保日期/时间与官网一致
                date_str = base_et.strftime("%Y-%m-%d")
                time_str = "TBD"  # ET HH:MM
                if utc_str:
                    try:
                        utc_dt = datetime.fromisoformat(
                            utc_str.replace("Z", "+00:00"))
                        et_dt = utc_dt.astimezone(ny_tz)
                        date_str = et_dt.strftime("%Y-%m-%d")
                        time_str = et_dt.strftime("%H:%M")
                    except Exception:
                        pass

                home = g.get("homeTeam") or {}
                away = g.get("awayTeam") or {}
                arena = g.get("arena") or {}

                home_team_id = home.get("teamId")
                away_team_id = away.get("teamId")
                home_name = get_chinese_team_name(
                    int(home_team_id) if home_team_id else None, None)
                away_name = get_chinese_team_name(
                    int(away_team_id) if away_team_id else None, None)

                def _to_int_or_none(v):
                    try:
                        if v is None:
                            return None
                        return int(v)
                    except Exception:
                        return None

                # 获取比分：NBA API的比分可能在多个位置
                home_score = None
                away_score = None

                # 方法1：从 homeTeam/awayTeam 对象直接获取
                if "score" in home:
                    home_score = _to_int_or_none(home.get("score"))
                if "score" in away:
                    away_score = _to_int_or_none(away.get("score"))

                # 方法2：从 game 对象的 gameLeaders 或其他字段获取
                if home_score is None or away_score is None:
                    # 尝试从 game 对象获取
                    game_leaders = g.get("gameLeaders") or {}
                    home_leaders = game_leaders.get("homeLeaders") or {}
                    away_leaders = game_leaders.get("awayLeaders") or {}

                    # 有些API可能把比分放在这里
                    if home_score is None and "points" in home_leaders:
                        home_score = _to_int_or_none(
                            home_leaders.get("points"))
                    if away_score is None and "points" in away_leaders:
                        away_score = _to_int_or_none(
                            away_leaders.get("points"))

                # 方法3：从 boxScore 获取（如果有）
                box_score = g.get("boxScore") or {}
                if home_score is None:
                    home_score = _to_int_or_none(
                        box_score.get("homeTeam", {}).get("score"))
                if away_score is None:
                    away_score = _to_int_or_none(
                        box_score.get("awayTeam", {}).get("score"))

                # 获取球员统计数据（得分、篮板、助攻最多的球员）
                # 初始化变量
                home_top_scorer = None
                home_top_rebounder = None
                home_top_assister = None
                away_top_scorer = None
                away_top_rebounder = None
                away_top_assister = None

                # 方法1：从 gameLeaders 获取（通常只有得分最多的球员）
                game_leaders = g.get("gameLeaders") or {}
                home_leaders = game_leaders.get("homeLeaders") or {}
                away_leaders = game_leaders.get("awayLeaders") or {}

                # 调试：打印 gameLeaders 结构（仅debug时）
                if debug and status in ["live", "finished"]:
                    print(
                        f"比赛 {game_id} gameLeaders keys: {list(game_leaders.keys())}", file=sys.stderr)
                    print(f"  homeLeaders: {home_leaders}", file=sys.stderr)
                    print(f"  awayLeaders: {away_leaders}", file=sys.stderr)

                # 从 gameLeaders 获取得分最多的球员（即使没有 personId 也尝试获取）
                if home_leaders and (home_leaders.get("name") or home_leaders.get("personId")):
                    home_top_scorer = {
                        "name": home_leaders.get("name", ""),
                        "points": _to_int_or_none(home_leaders.get("points"))
                    }
                    # 如果 name 为空，尝试从其他字段获取
                    if not home_top_scorer["name"] and home_leaders.get("personId"):
                        home_top_scorer["name"] = f"Player {home_leaders.get('personId')}"

                if away_leaders and (away_leaders.get("name") or away_leaders.get("personId")):
                    away_top_scorer = {
                        "name": away_leaders.get("name", ""),
                        "points": _to_int_or_none(away_leaders.get("points"))
                    }
                    # 如果 name 为空，尝试从其他字段获取
                    if not away_top_scorer["name"] and away_leaders.get("personId"):
                        away_top_scorer["name"] = f"Player {away_leaders.get('personId')}"

                # 方法2：尝试从 boxScore 获取更详细的统计数据
                # 注意：scoreboard API 可能不包含 boxScore，需要单独请求
                box_score = g.get("boxScore") or {}

                # ✅ 关键：scoreboard一般不带boxScore；对 live/finished 补抓 boxscore_{gameId}.json
                if (not box_score) and status in ["live", "finished"]:
                    fetched_game = _fetch_cdn_boxscore(game_id)
                    if fetched_game and isinstance(fetched_game, dict):
                        # 这里返回的是 game 对象（含 homeTeam/awayTeam/players）
                        box_score = fetched_game
                        # 如果比分缺失，也可从 boxscore 里补
                        if home_score is None:
                            home_score = _to_int_or_none(
                                (box_score.get("homeTeam") or {}).get("score"))
                        if away_score is None:
                            away_score = _to_int_or_none(
                                (box_score.get("awayTeam") or {}).get("score"))
                    else:
                        if debug:
                            print(f"比赛 {game_id} 未获取到boxscore",
                                  file=sys.stderr)

                # 如果有 boxScore，获取球员列表
                if box_score:
                    home_players = box_score.get(
                        "homeTeam", {}).get("players", [])
                    away_players = box_score.get(
                        "awayTeam", {}).get("players", [])

                    if home_players and len(home_players) > 0:
                        try:
                            # 找到得分最多的球员
                            home_top_scorer_player = max(home_players, key=lambda p: _to_int_or_none(
                                p.get("statistics", {}).get("points")) or 0, default=None)
                            if home_top_scorer_player:
                                stats = home_top_scorer_player.get(
                                    "statistics", {})
                                first_name = home_top_scorer_player.get(
                                    "firstName", "")
                                family_name = home_top_scorer_player.get(
                                    "familyName", "")
                                home_top_scorer = {
                                    "name": f"{first_name} {family_name}".strip(),
                                    "points": _to_int_or_none(stats.get("points"))
                                }

                            # 篮板最多的球员
                            home_top_rebounder_player = max(home_players, key=lambda p: _to_int_or_none(
                                p.get("statistics", {}).get("reboundsTotal")) or 0, default=None)
                            if home_top_rebounder_player:
                                reb_stats = home_top_rebounder_player.get(
                                    "statistics", {})
                                first_name = home_top_rebounder_player.get(
                                    "firstName", "")
                                family_name = home_top_rebounder_player.get(
                                    "familyName", "")
                                home_top_rebounder = {
                                    "name": f"{first_name} {family_name}".strip(),
                                    "rebounds": _to_int_or_none(reb_stats.get("reboundsTotal"))
                                }

                            # 助攻最多的球员
                            home_top_assister_player = max(home_players, key=lambda p: _to_int_or_none(
                                p.get("statistics", {}).get("assists")) or 0, default=None)
                            if home_top_assister_player:
                                ast_stats = home_top_assister_player.get(
                                    "statistics", {})
                                first_name = home_top_assister_player.get(
                                    "firstName", "")
                                family_name = home_top_assister_player.get(
                                    "familyName", "")
                                home_top_assister = {
                                    "name": f"{first_name} {family_name}".strip(),
                                    "assists": _to_int_or_none(ast_stats.get("assists"))
                                }
                        except Exception as e:
                            print(f"处理主队球员统计失败: {e}", file=sys.stderr)

                    if away_players and len(away_players) > 0:
                        try:
                            # 找到得分最多的球员
                            away_top_scorer_player = max(away_players, key=lambda p: _to_int_or_none(
                                p.get("statistics", {}).get("points")) or 0, default=None)
                            if away_top_scorer_player:
                                stats = away_top_scorer_player.get(
                                    "statistics", {})
                                first_name = away_top_scorer_player.get(
                                    "firstName", "")
                                family_name = away_top_scorer_player.get(
                                    "familyName", "")
                                away_top_scorer = {
                                    "name": f"{first_name} {family_name}".strip(),
                                    "points": _to_int_or_none(stats.get("points"))
                                }

                            # 篮板最多的球员
                            away_top_rebounder_player = max(away_players, key=lambda p: _to_int_or_none(
                                p.get("statistics", {}).get("reboundsTotal")) or 0, default=None)
                            if away_top_rebounder_player:
                                reb_stats = away_top_rebounder_player.get(
                                    "statistics", {})
                                first_name = away_top_rebounder_player.get(
                                    "firstName", "")
                                family_name = away_top_rebounder_player.get(
                                    "familyName", "")
                                away_top_rebounder = {
                                    "name": f"{first_name} {family_name}".strip(),
                                    "rebounds": _to_int_or_none(reb_stats.get("reboundsTotal"))
                                }

                            # 助攻最多的球员
                            away_top_assister_player = max(away_players, key=lambda p: _to_int_or_none(
                                p.get("statistics", {}).get("assists")) or 0, default=None)
                            if away_top_assister_player:
                                ast_stats = away_top_assister_player.get(
                                    "statistics", {})
                                first_name = away_top_assister_player.get(
                                    "firstName", "")
                                family_name = away_top_assister_player.get(
                                    "familyName", "")
                                away_top_assister = {
                                    "name": f"{first_name} {family_name}".strip(),
                                    "assists": _to_int_or_none(ast_stats.get("assists"))
                                }
                        except Exception as e:
                            print(f"处理客队球员统计失败: {e}", file=sys.stderr)

                # 调试：打印球员统计数据
                if debug and status in ["live", "finished"]:
                    print(f"比赛 {game_id} 球员统计:", file=sys.stderr)
                    print(f"  主队得分王: {home_top_scorer}", file=sys.stderr)
                    print(f"  主队篮板王: {home_top_rebounder}", file=sys.stderr)
                    print(f"  主队助攻王: {home_top_assister}", file=sys.stderr)
                    print(f"  客队得分王: {away_top_scorer}", file=sys.stderr)
                    print(f"  客队篮板王: {away_top_rebounder}", file=sys.stderr)
                    print(f"  客队助攻王: {away_top_assister}", file=sys.stderr)

                # 调试：如果比分仍为None，打印调试信息
                if (home_score is None or away_score is None) and status in ["live", "finished"]:
                    print(
                        f"警告：比赛 {game_id} ({home_name} vs {away_name}) 状态为 {status}，但未获取到比分", file=sys.stderr)
                    print(
                        f"  home对象keys: {list(home.keys())}", file=sys.stderr)
                    print(
                        f"  away对象keys: {list(away.keys())}", file=sys.stderr)
                    print(
                        f"  game对象部分keys: {list(g.keys())[:10]}", file=sys.stderr)

                out.append({
                    "id": game_id,
                    "homeTeam": home_name,
                    "awayTeam": away_name,
                    "homeTeamId": _to_int_or_none(home_team_id),
                    "awayTeamId": _to_int_or_none(away_team_id),
                    "homeScore": home_score,
                    "awayScore": away_score,
                    "status": status,
                    "date": date_str,
                    "time": time_str,
                    "league": "NBA",
                    "venue": arena.get("arenaName") or "未知场馆",
                    # 球员统计数据
                    "homeTopScorer": home_top_scorer,
                    "homeTopRebounder": home_top_rebounder,
                    "homeTopAssister": home_top_assister,
                    "awayTopScorer": away_top_scorer,
                    "awayTopRebounder": away_top_rebounder,
                    "awayTopAssister": away_top_assister
                })
            except Exception as e:
                print(f"CDN处理单场比赛失败: {e}", file=sys.stderr)
                continue
        return out

    # 1) 优先CDN
    matches = _fetch_with_cdn_scoreboard(yyyymmdd)
    if matches:
        print(f"CDN成功获取 {len(matches)} 场比赛", file=sys.stderr)
        return matches

    # 2) 兜底：stats.nba.com（可能被拦）
    # 以NBA常用的美东时间作为“今天”的基准
    ny_tz = ZoneInfo("America/New_York")
    target_date = datetime.now(ny_tz) + timedelta(days=date_offset)
    year = target_date.year
    month = str(target_date.month).zfill(2)
    day = str(target_date.day).zfill(2)
    date_str = f"{month}/{day}/{year}"

    # 注意：scoreboardV2 同时传 DayOffset 和 gameDate 可能导致“再次偏移”出现日期错乱
    # 这里固定 DayOffset=0，仅用 gameDate 精确指定那一天的数据
    api_urls = [
        f"https://stats.nba.com/stats/scoreboardV2?DayOffset=0&LeagueID=00&gameDate={date_str}",
    ]
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.nba.com/',
        'Origin': 'https://www.nba.com',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
    }

    debug = os.getenv("NBA_DEBUG", "").strip() in (
        "1", "true", "TRUE", "yes", "YES")
    _boxscore_cache: Dict[str, Dict] = {}

    def _to_int_or_none(v):
        try:
            if v is None:
                return None
            # ESPN/Stats 有时会给 "40.0" 这种字符串或 float
            if isinstance(v, (float, int)):
                return int(v)
            s = str(v).strip()
            if s == "":
                return None
            return int(float(s))
        except Exception:
            return None

    def _fetch_stats_boxscore_leaders(game_id: str, home_team_id: Optional[int], away_team_id: Optional[int]) -> Dict:
        """
        从 stats.nba.com 获取单场球员数据，计算两队得分/篮板/助攻最高球员。
        使用 boxscoretraditionalv2（返回 PlayerStats resultSet）。
        """
        if not game_id or not home_team_id or not away_team_id:
            return {}
        if game_id in _boxscore_cache:
            return _boxscore_cache[game_id]

        url = (
            "https://stats.nba.com/stats/boxscoretraditionalv2"
            f"?GameID={game_id}&StartPeriod=0&EndPeriod=10&RangeType=0&StartRange=0&EndRange=0"
        )
        try:
            if debug:
                print(f"正在尝试(Stats BoxScore): {url}", file=sys.stderr)
            resp = requests.get(url, headers=headers, timeout=20)
            if resp.status_code != 200:
                if debug:
                    print(
                        f"Stats BoxScore请求失败: {resp.status_code} game={game_id}", file=sys.stderr)
                _boxscore_cache[game_id] = {}
                return {}
            data = resp.json() or {}
            result_sets = data.get("resultSets") or []
            player_rs = None
            # 可能是 list[dict] 或 dict
            if isinstance(result_sets, list):
                for rs in result_sets:
                    if rs.get("name") == "PlayerStats":
                        player_rs = rs
                        break
            if not player_rs:
                _boxscore_cache[game_id] = {}
                return {}

            headers_list = player_rs.get("headers") or []
            rows = player_rs.get("rowSet") or []

            def idx(col: str) -> int:
                return headers_list.index(col) if col in headers_list else -1

            team_id_i = idx("TEAM_ID")
            name_i = idx("PLAYER_NAME")
            pts_i = idx("PTS")
            reb_i = idx("REB")
            ast_i = idx("AST")
            min_i = idx("MIN")
            if team_id_i == -1 or name_i == -1:
                _boxscore_cache[game_id] = {}
                return {}

            def played(row) -> bool:
                # 有些 DNP 也会有行，MIN 为空或 "0"；尽量过滤掉
                if min_i == -1:
                    return True
                v = row[min_i]
                if v is None:
                    return False
                s = str(v).strip()
                if s == "" or s == "0" or s == "0:00":
                    return False
                return True

            def best_for(team_id: int, stat_idx: int, key: str) -> Optional[Dict]:
                if stat_idx == -1:
                    return None
                team_rows = [r for r in rows if _to_int_or_none(
                    r[team_id_i]) == team_id and played(r)]
                if not team_rows:
                    return None
                best_row = max(
                    team_rows, key=lambda r: _to_int_or_none(r[stat_idx]) or 0)
                val = _to_int_or_none(best_row[stat_idx])
                name = str(best_row[name_i] or "").strip()
                if not name:
                    return None
                return {"name": name, key: val}

            out = {
                "homeTopScorer": best_for(int(home_team_id), pts_i, "points"),
                "homeTopRebounder": best_for(int(home_team_id), reb_i, "rebounds"),
                "homeTopAssister": best_for(int(home_team_id), ast_i, "assists"),
                "awayTopScorer": best_for(int(away_team_id), pts_i, "points"),
                "awayTopRebounder": best_for(int(away_team_id), reb_i, "rebounds"),
                "awayTopAssister": best_for(int(away_team_id), ast_i, "assists"),
            }
            _boxscore_cache[game_id] = out
            return out
        except Exception as e:
            if debug:
                print(
                    f"Stats BoxScore请求/解析异常: {e} game={game_id}", file=sys.stderr)
            _boxscore_cache[game_id] = {}
            return {}

    def _fetch_espn_leaders_map(yyyymmdd_str: str) -> Dict:
        """
        使用 ESPN scoreboard，一次请求拿到当天所有比赛两队 points/rebounds/assists leaders。
        返回 {(homeZh, awayZh): {homeTopScorer, ...}} 的映射。
        """
        if not yyyymmdd_str:
            return {}
        url = (
            "https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
            f"?dates={yyyymmdd_str}"
        )
        try:
            resp = requests.get(url, timeout=20)
            if resp.status_code != 200:
                if debug:
                    print(
                        f"ESPN scoreboard请求失败: {resp.status_code} {url}", file=sys.stderr)
                return {}
            data = resp.json() or {}
            out: Dict = {}

            def take_leader(competitor: Dict, cat: str) -> Optional[Dict]:
                leaders = competitor.get("leaders") or []
                for l in leaders:
                    if l.get("name") != cat:
                        continue
                    first = (l.get("leaders") or [{}])[0] or {}
                    athlete = first.get("athlete") or {}
                    name = str(athlete.get("displayName") or "").strip()
                    athlete_id = str(athlete.get("id") or "").strip()
                    # ESPN 通常会给 headshot.href
                    headshot = athlete.get("headshot") or {}
                    avatar = headshot.get("href") if isinstance(
                        headshot, dict) else None
                    # 兜底：用 athlete id 拼 headshot
                    if not avatar and athlete_id:
                        avatar = f"https://a.espncdn.com/i/headshots/nba/players/full/{athlete_id}.png"
                    value = first.get("value")
                    iv = _to_int_or_none(value)
                    if not name:
                        return None
                    if cat == "points":
                        return {"name": name, "avatar": avatar, "points": iv}
                    if cat == "rebounds":
                        return {"name": name, "avatar": avatar, "rebounds": iv}
                    if cat == "assists":
                        return {"name": name, "avatar": avatar, "assists": iv}
                return None

            for e in data.get("events", []) or []:
                comp = (e.get("competitions") or [{}])[0] or {}
                comps = comp.get("competitors") or []
                home = next((c for c in comps if c.get(
                    "homeAway") == "home"), None)
                away = next((c for c in comps if c.get(
                    "homeAway") == "away"), None)
                if not home or not away:
                    continue

                home_en = ((home.get("team") or {}).get("displayName")) or ""
                away_en = ((away.get("team") or {}).get("displayName")) or ""
                home_zh = get_chinese_team_name(None, home_en)
                away_zh = get_chinese_team_name(None, away_en)

                leaders_obj = {
                    "homeTopScorer": take_leader(home, "points"),
                    "homeTopRebounder": take_leader(home, "rebounds"),
                    "homeTopAssister": take_leader(home, "assists"),
                    "awayTopScorer": take_leader(away, "points"),
                    "awayTopRebounder": take_leader(away, "rebounds"),
                    "awayTopAssister": take_leader(away, "assists"),
                }
                out[(home_zh, away_zh)] = leaders_obj
            return out
        except Exception as e:
            if debug:
                print(f"ESPN leaders抓取异常: {e}", file=sys.stderr)
            return {}

    matches = []
    for url in api_urls:
        try:
            print(f"正在尝试(Stats): {url}", file=sys.stderr)
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code != 200:
                print(f"Stats请求失败: {response.status_code}", file=sys.stderr)
                continue
            data = response.json()
            if not data or 'resultSets' not in data:
                continue

            game_header = None
            line_score = None
            for rs in data.get('resultSets', []):
                if rs.get('name') == 'GameHeader':
                    game_header = rs
                elif rs.get('name') == 'LineScore':
                    line_score = rs
            if not game_header or not line_score:
                continue

            headers_list = game_header.get('headers', [])
            rows = game_header.get('rowSet', [])
            line_score_headers = line_score.get('headers', [])
            line_score_rows = line_score.get('rowSet', [])

            game_id_idx = headers_list.index(
                'GAME_ID') if 'GAME_ID' in headers_list else -1
            game_status_idx = headers_list.index(
                'GAME_STATUS_TEXT') if 'GAME_STATUS_TEXT' in headers_list else -1
            game_status_id_idx = headers_list.index(
                'GAME_STATUS_ID') if 'GAME_STATUS_ID' in headers_list else -1
            game_date_idx = headers_list.index(
                'GAME_DATE_EST') if 'GAME_DATE_EST' in headers_list else -1
            home_team_id_idx = headers_list.index(
                'HOME_TEAM_ID') if 'HOME_TEAM_ID' in headers_list else -1
            visitor_team_id_idx = headers_list.index(
                'VISITOR_TEAM_ID') if 'VISITOR_TEAM_ID' in headers_list else -1
            arena_idx = headers_list.index(
                'ARENA_NAME') if 'ARENA_NAME' in headers_list else -1

            game_id_idx_ls = line_score_headers.index(
                'GAME_ID') if 'GAME_ID' in line_score_headers else -1
            team_id_idx_ls = line_score_headers.index(
                'TEAM_ID') if 'TEAM_ID' in line_score_headers else -1
            pts_idx_ls = line_score_headers.index(
                'PTS') if 'PTS' in line_score_headers else -1

            if game_id_idx == -1:
                continue

            for game in rows:
                try:
                    game_id = game[game_id_idx]
                    game_status = str(
                        game[game_status_idx] or '') if game_status_idx != -1 else ''
                    game_status_id = _to_int_or_none(
                        game[game_status_id_idx]) if game_status_id_idx != -1 else None
                    game_date = game[game_date_idx] if game_date_idx != - \
                        1 else date_str
                    home_team_id = game[home_team_id_idx] if home_team_id_idx != -1 else None
                    visitor_team_id = game[visitor_team_id_idx] if visitor_team_id_idx != -1 else None
                    arena = str(game[arena_idx]
                                or '未知场馆') if arena_idx != -1 else '未知场馆'

                    home_team_name = get_chinese_team_name(home_team_id, None)
                    away_team_name = get_chinese_team_name(
                        visitor_team_id, None)

                    home_score = None
                    away_score = None
                    if game_id_idx_ls != -1 and team_id_idx_ls != -1 and pts_idx_ls != -1:
                        home_team_data = next(
                            (row for row in line_score_rows if row[game_id_idx_ls] == game_id and row[team_id_idx_ls] == home_team_id), None)
                        away_team_data = next(
                            (row for row in line_score_rows if row[game_id_idx_ls] == game_id and row[team_id_idx_ls] == visitor_team_id), None)
                        if home_team_data and away_team_data:
                            home_pts = home_team_data[pts_idx_ls]
                            away_pts = away_team_data[pts_idx_ls]
                            home_score = int(
                                home_pts) if home_pts is not None else None
                            away_score = int(
                                away_pts) if away_pts is not None else None

                    # ✅ 使用 GAME_STATUS_ID 更可靠：1=upcoming, 2=live, 3=finished
                    status = 'upcoming'
                    if game_status_id == 2:
                        status = 'live'
                    elif game_status_id == 3:
                        status = 'finished'
                    elif game_status_id == 1:
                        status = 'upcoming'
                    else:
                        # 兜底：用文本判断
                        status_upper = game_status.upper().strip()
                        if 'FINAL' in status_upper:
                            status = 'finished'
                        elif status_upper == '' or 'ET' in status_upper or 'PM' in status_upper or 'AM' in status_upper:
                            status = 'upcoming'
                        else:
                            status = 'live'

                    game_date_str = game_date.split('T')[0] if 'T' in str(
                        game_date) else str(game_date).split()[0]
                    m = {
                        'id': str(game_id),
                        'homeTeam': home_team_name,
                        'awayTeam': away_team_name,
                        'homeTeamId': int(home_team_id) if home_team_id is not None else None,
                        'awayTeamId': int(visitor_team_id) if visitor_team_id is not None else None,
                        'homeScore': home_score,
                        'awayScore': away_score,
                        'status': status,
                        'date': game_date_str,
                        'time': game_status if game_status else 'TBD',
                        'league': 'NBA',
                        'venue': arena
                    }
                    matches.append(m)
                except Exception:
                    continue

            if matches:
                # ✅ 对 live/finished 补抓球员统计：优先 ESPN（稳定、单次请求）
                try:
                    yyyymmdd_target = target_date.strftime("%Y%m%d")
                    espn_map = _fetch_espn_leaders_map(yyyymmdd_target)
                    for i, mm in enumerate(matches):
                        if mm.get("status") not in ("live", "finished"):
                            continue
                        key = (mm.get("homeTeam"), mm.get("awayTeam"))
                        leaders = espn_map.get(key) or {}
                        # 如果ESPN没匹配上，再尝试 stats boxscore（可能被拦）
                        if not any(leaders.get(k) for k in ("homeTopScorer", "homeTopRebounder", "homeTopAssister", "awayTopScorer", "awayTopRebounder", "awayTopAssister")):
                            leaders = _fetch_stats_boxscore_leaders(
                                str(mm.get("id")), mm.get("homeTeamId"), mm.get("awayTeamId")) or {}
                        if leaders:
                            matches[i].update(leaders)
                except Exception as e:
                    if debug:
                        print(f"补抓球员统计失败(ESPN/Stats): {e}", file=sys.stderr)
                return matches
        except Exception as e:
            print(f"Stats请求/解析异常: {e}", file=sys.stderr)
            continue

    return matches


def fetch_nba_schedule_multi_day() -> List[Dict]:
    """获取多天的NBA赛程（过去2天、今天、未来3天）- 优化：使用并发请求
    例如：如果今天是2月11号，会爬取9号、10号、11号、12号、13号、14号的数据
    已结束的比赛：只显示往前2天和往前1天的数据（9号和10号）
    """
    all_matches: List[Dict] = []
    seen_ids = set()

    # 优化：使用线程池并发请求多天数据，而不是串行请求
    def fetch_one_day(offset: int) -> tuple[int, List[Dict]]:
        """获取单天数据，返回 (offset, matches)"""
        try:
            matches = fetch_nba_schedule_for_date(offset)
            print(
                f"DayOffset={offset}: 获取到 {len(matches)} 场比赛", file=sys.stderr)
            return (offset, matches)
        except Exception as e:
            print(f"获取DayOffset={offset}的数据失败: {e}", file=sys.stderr)
            return (offset, [])

    # 使用线程池并发执行，最多3个线程同时请求
    # range(-3, 4) 表示：往前3天、往前2天、往前1天、今天、未来1天、未来2天、未来3天
    # 扩展范围以确保能覆盖时区差异（北京时间往前2天可能对应美东时区的往前3天）
    with ThreadPoolExecutor(max_workers=3) as executor:
        # 提交所有任务
        future_to_offset = {
            executor.submit(fetch_one_day, offset): offset
            for offset in range(-3, 4)
        }

        # 按完成顺序收集结果（先完成的先处理）
        for future in as_completed(future_to_offset):
            offset, matches = future.result()
            # 去重（防止不同 offset 下偶发返回重复 GAME_ID）
            for m in matches:
                mid = m.get('id')
                if not mid or mid in seen_ids:
                    continue
                seen_ids.add(mid)
                all_matches.append(m)

    return all_matches


def main():
    """主函数"""
    try:
        matches = fetch_nba_schedule_multi_day()
        result = {
            'matches': matches,
            'count': len(matches),
            'error': False
        }
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        error_result = {
            'matches': [],
            'count': 0,
            'error': True,
            'message': str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
