// 교사 일정 D-day 띠 (헤더·한눈에 보기). 공식 발표로 확인된 날짜만 넣음
// - date: 하루짜리 일정 / date + end: 기간 일정 / month: 날짜가 아직 안 나온 일정 ("3월 중")
// - 지난 일정은 저절로 숨겨짐. 학력평가·모의평가처럼 날짜가 발표되면 여기에 더하면 됨 (매년 2~3월에 한 번 손보기)
export type ScheduleEvent = {
  title: string
  tag: '입시' | '학교' | '대회' | '수학'
  date?: string // YYYY-MM-DD (한국 시간)
  end?: string
  month?: string // YYYY-MM
  note?: string
  link: string
}

const SUNEUNG = 'https://www.suneung.org/'
const ADIGA = 'https://www.adiga.kr/'
const KMO = 'https://www.kmo.or.kr/kmo/sub01.html'

export const SCHEDULE: ScheduleEvent[] = [
  { date: '2026-12-11', title: '2027 수능 성적 통지', tag: '입시', link: SUNEUNG },
  { date: '2027-01-04', end: '2027-01-07', title: '정시 원서접수', tag: '입시', note: '대학마다 이 기간 중 3일 이상', link: ADIGA },
  { date: '2027-02-05', title: '정시 최초 합격자 발표 마감', tag: '입시', link: ADIGA },
  { date: '2027-03-02', title: '새 학년 시작', tag: '학교', link: 'https://www.moe.go.kr/' },
  { month: '2027-03', title: 'KMO 최종시험', tag: '대회', note: '날짜는 KMO 공지', link: KMO },
  { month: '2027-03', title: '2028 수능 시행 기본계획 공고', tag: '입시', note: '평가원', link: SUNEUNG },
  { date: '2027-03-14', title: '국제 수학의 날 (π Day)', tag: '수학', note: '수학 축제·행사 하기 좋은 날', link: 'https://www.idm314.org/' },
  { month: '2027-05', title: 'KMO 1차시험', tag: '대회', note: '중등부·고등부, 날짜는 KMO 공지', link: KMO },
  { month: '2027-11', title: 'KMO 2차시험', tag: '대회', note: '날짜는 KMO 공지', link: KMO },
  { date: '2027-11-18', title: '2028 수능', tag: '입시', note: '선택과목 없는 통합형 첫 수능', link: 'https://www.korea.kr/news/policyNewsView.do?newsId=148943916' },
  { date: '2027-12-10', title: '2028 수능 성적 통지', tag: '입시', link: SUNEUNG },
]

const kstDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' })
const dayNumber = (ymd: string) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10)) / 86_400_000
const weekday = ['일', '월', '화', '수', '목', '금', '토']
const short = (ymd: string) => `${+ymd.slice(5, 7)}.${+ymd.slice(8, 10)}(${weekday[new Date(`${ymd}T00:00:00Z`).getUTCDay()]})`
const lastDay = (month: string) => {
  const d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7), 0))
  return `${month}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export type UpcomingEvent = ScheduleEvent & { when: string; badge: string; soon: boolean }

// 오늘(한국 시간) 이후의 일정을 가까운 순으로. badge: 'D-7' · 'D-DAY' · '진행 중' · '3월 중'
export function upcomingEvents(now: number, limit = SCHEDULE.length): UpcomingEvent[] {
  const today = dayNumber(kstDay.format(now))
  return SCHEDULE.map((event) => {
    const start = event.date ? event.date : `${event.month}-01`
    const finish = event.end || event.date || lastDay(event.month!)
    return { event, start, finish }
  })
    .filter(({ finish }) => dayNumber(finish) >= today)
    // 'O월 중' 일정은 그달의 날짜가 정해진 일정 뒤에
    .sort((a, b) => {
      const key = (x: typeof a) => (x.event.month ? `${x.finish}~` : x.start)
      return key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0
    })
    .slice(0, limit)
    .map(({ event, start, finish }) => {
      const days = dayNumber(start) - today
      let badge: string
      if (event.month) badge = `${+event.month.slice(5, 7)}월 중`
      else if (days > 0) badge = `D-${days}`
      else badge = finish === start ? 'D-DAY' : '진행 중'
      const when = event.month ? `${event.month.slice(0, 4)}년 ${+event.month.slice(5, 7)}월 중` : event.end ? `${short(start)} ~ ${short(finish)}` : short(start)
      return { ...event, when, badge, soon: !event.month && days <= 14 }
    })
}
