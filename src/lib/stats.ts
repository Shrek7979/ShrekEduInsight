// 방문 통계: 가입 없이 쓰는 무료 카운터(Abacus)에 숫자만 올리고 읽음. 쿠키·개인정보 없음
// - 방문자: 한 브라우저당 하루 한 번 / 조회: 사이트를 열 때마다(같은 창 새로고침은 한 번만)
// - 이 PC 의 로컬 실행(localhost)은 세지 않음
const API = 'https://abacus.jasoncameron.dev'
const NS = 'shrek-edu-insight'

const kstDay = (time: number) => new Date(time + 9 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '')

const hit = (key: string) => fetch(`${API}/hit/${NS}/${key}`).catch(() => {})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 카운터 서버는 10초에 30번까지만 받음 → 넘치면(429) 잠시 기다렸다 다시
async function get(key: string): Promise<number> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${API}/get/${NS}/${key}`, { cache: 'no-store' })
      if (res.status === 429) {
        await sleep(3000)
        continue
      }
      return res.ok ? (await res.json()).value ?? 0 : 0 // 아직 한 번도 안 센 날은 404 → 0
    } catch {
      await sleep(1000)
    }
  }
  throw new Error('통계를 불러오지 못했어요')
}

// 한꺼번에 보내지 않고 몇 개씩 나눠서
async function getAll(keys: string[], batch = 6) {
  const values: number[] = []
  for (let i = 0; i < keys.length; i += batch) values.push(...(await Promise.all(keys.slice(i, i + batch).map(get))))
  return values
}

export function recordVisit() {
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) return
  const today = kstDay(Date.now())
  try {
    if (!sessionStorage.getItem('edu-hub:viewed')) {
      sessionStorage.setItem('edu-hub:viewed', '1')
      hit('views-total')
      hit(`views-${today}`)
    }
    if (localStorage.getItem('edu-hub:visited') !== today) {
      localStorage.setItem('edu-hub:visited', today)
      hit('visitors-total')
      hit(`visitors-${today}`)
    }
  } catch {}
}

export type DayStat = { day: string; label: string; visitors: number; views: number }
export type Stats = { totalVisitors: number; totalViews: number; days: DayStat[] }

// 최근 며칠 치
export async function readStats(dayCount = 14): Promise<Stats> {
  const now = Date.now()
  const days = Array.from({ length: dayCount }, (_, i) => kstDay(now - (dayCount - 1 - i) * 86400_000))
  const [totalVisitors, totalViews, ...counts] = await getAll([
    'visitors-total',
    'views-total',
    ...days.flatMap((day) => [`visitors-${day}`, `views-${day}`]),
  ])
  return {
    totalVisitors,
    totalViews,
    days: days.map((day, i) => ({
      day,
      label: `${Number(day.slice(4, 6))}/${Number(day.slice(6, 8))}`,
      visitors: counts[i * 2],
      views: counts[i * 2 + 1],
    })),
  }
}
