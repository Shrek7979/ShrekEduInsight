import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
import { readFile } from 'fs/promises'
import path from 'path'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SiteMeta from '@/components/SiteMeta'
import Briefing from '@/components/feed/Briefing'
import { EndCard, NewsCard, TopicCard } from '@/components/feed/ReelCard'
import {
  CATEGORY_ORDER,
  FeedItem,
  LEVELS,
  SITE_NAME,
  SUBJECT,
  SUBJECTS,
  SubjectKey,
  TAGLINE,
  TOPIC_CHIP,
  Topic,
  editionLabel,
  matchesLevel,
  popularity,
  shareLink,
  useStoredSet,
} from '@/lib/feed'
import { Combined, SubjectData, combine, fetchAll } from '@/lib/sources'
import { ArrowIcon, MenuIcon, PauseIcon, PlayIcon, SearchIcon } from '@/components/icons'

type Props = { initial: Combined; dayIndex: number }
type Card = { key: string; item?: FeedItem; topic?: Topic }

const ALL = '전체'
const POPULAR = '인기'
const SAVED = '★ 저장'
// 상단 과목 동그라미(인스타 스토리처럼)를 눌렀을 때: 그 과목의 최근 24시간 새 소식만 넘겨 봄 (칩에는 없는 보기)
const STORY = '__story__'
const STORY_HOURS = 24
const TOPIC_EVERY = 5
const AUTO_SECONDS = 8
// 페이지를 연 뒤에도 이 간격으로 과목 사이트의 새 데이터를 확인
const CHECK_MINUTES = 10
const SUBJECT_BY_NAME = Object.fromEntries(SUBJECTS.map((s) => [s.name, s.key])) as Record<string, SubjectKey>

// 빌드(배포) 시점에 subjects/<과목>/data 의 수집 결과로 첫 화면을 만듦. 브라우저에서 연 뒤에는 최신 데이터로 다시 바꿈
export const getStaticProps: GetStaticProps<Props> = async () => {
  const read = async <T,>(subject: string, file: string, fallback: T): Promise<T> => {
    try {
      return JSON.parse(await readFile(path.join(process.cwd(), 'subjects', subject, 'data', file), 'utf8'))
    } catch {
      return fallback
    }
  }
  const data: SubjectData[] = await Promise.all(
    SUBJECTS.map(async ({ key }) => ({
      subject: key,
      feed: await read<SubjectData['feed']>(key, 'feed.json', { updatedAt: null, items: [] }),
      posts: [
        ...(await read<{ items: SubjectData['posts'] }>(key, 'instagram.json', { items: [] })).items,
        ...(await read<{ items: SubjectData['posts'] }>(key, 'facebook.json', { items: [] })).items,
      ],
      topics: await read<SubjectData['topics']>(key, 'topics.json', []),
      lessons: (await read<{ lessons: SubjectData['lessons'] }>(key, 'lessons.json', { lessons: {} })).lessons,
    }))
  )
  return { props: { initial: combine(data), dayIndex: Math.floor(Date.now() / (24 * 60 * 60 * 1000)) } }
}

const signature = (data: Combined) => `${data.updatedAt}|${data.items.map((item) => item.id).join(',')}`

// 뉴스 카드 사이사이에 주제 카드를 한 장씩 끼움
function withTopics(cards: Card[], topics: Topic[]) {
  const mixed: Card[] = []
  cards.forEach((card, i) => {
    mixed.push(card)
    const topic = topics[Math.floor(i / TOPIC_EVERY)]
    if ((i + 1) % TOPIC_EVERY === 0 && topic) mixed.push({ key: topic.id, topic })
  })
  return mixed
}

export default function ReelsPage({ initial, dayIndex }: Props) {
  const router = useRouter()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [feed, setFeed] = useState(initial)
  // 보고 있는 도중에 들어온 새 데이터는 바로 바꾸지 않고 '새 소식' 버튼으로 알림 (카드가 갑자기 바뀌지 않게)
  const [pending, setPending] = useState<Combined | null>(null)
  const [view, setView] = useState<'reels' | 'briefing'>('reels')
  const [category, setCategory] = useState(ALL)
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(false)
  // 인스타 릴스처럼: 아래로 넘기기 시작하면 상단 메뉴를 숨겨 카드가 화면을 꽉 채움
  const [immersive, setImmersive] = useState(false)
  const [toast, setToast] = useState('')
  // 검색·학교급 필터 (돋보기 버튼으로 여닫음)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('')
  // 스토리로 볼 카드 (누른 순간의 목록을 고정해, 보는 사이 읽음 처리돼도 카드가 빠지지 않게)
  const [storyIds, setStoryIds] = useState<Set<string>>(new Set())
  const [now, setNow] = useState<number | null>(null)
  const saved = useStoredSet('edu-hub:saved')
  const read = useStoredSet('edu-hub:read')

  useEffect(() => {
    setNow(Date.now())
    // 예전 과목 사이트에서 넘어온 주소(?s=math 등)면 그 과목을 바로 보여 줌
    const fromSubject = SUBJECTS.find((s) => s.key === new URLSearchParams(window.location.search).get('s'))
    if (fromSubject) setCategory(fromSubject.name)
    try {
      const last = localStorage.getItem('edu-hub:view')
      if (last === 'briefing') setView('briefing')
      const lastLevel = localStorage.getItem('edu-hub:level')
      if (lastLevel) {
        setLevel(lastLevel)
        setSearchOpen(true)
      }
    } catch {}
  }, [])

  const switchView = (next: 'reels' | 'briefing') => {
    setView(next)
    try {
      localStorage.setItem('edu-hub:view', next)
    } catch {}
  }

  // 주제 카드는 날마다 다른 것부터. 전체 보기에서는 과목을 번갈아 가며 나옴
  const topicsBySubject = useMemo(() => {
    const result = {} as Record<SubjectKey, Topic[]>
    for (const s of SUBJECTS) {
      const list = feed.topics.filter((topic) => topic.subject === s.key)
      result[s.key] = list.map((_, i) => list[(i + dayIndex) % list.length])
    }
    return result
  }, [feed.topics, dayIndex])
  const mixedTopics = useMemo(() => {
    const lists = SUBJECTS.map((_, i) => topicsBySubject[SUBJECTS[(i + dayIndex) % SUBJECTS.length].key])
    const longest = Math.max(0, ...lists.map((list) => list.length))
    return Array.from({ length: longest }, (_, i) => lists.map((list) => list[i]).filter(Boolean)).flat()
  }, [topicsBySubject, dayIndex])

  // NEW 표시: 과목마다 가장 최근 수집분
  const latestBatch = useMemo(() => {
    const latest: Partial<Record<SubjectKey, string>> = {}
    for (const item of feed.items) {
      if (!latest[item.subject] || item.collectedAt > latest[item.subject]!) latest[item.subject] = item.collectedAt
    }
    return latest
  }, [feed.items])
  const isNew = useCallback(
    (item: FeedItem) => item.collectedAt === latestBatch[item.subject] && !read.ids.has(item.id),
    [latestBatch, read.ids]
  )

  const keyword = query.trim().toLowerCase()
  const subjectFilter = SUBJECT_BY_NAME[category]
  const visibleItems = useMemo(() => {
    const inLevel = feed.items.filter((item) => matchesLevel(item, level))
    // 검색어가 있으면 칩과 상관없이 전체에서 찾음
    if (keyword) {
      return inLevel.filter((item) =>
        `${item.title} ${item.titleKo || ''} ${item.summary} ${item.summaryKo || ''} ${item.detail || ''} ${item.detailKo || ''} ${item.lesson || ''} ${item.source}`.toLowerCase().includes(keyword)
      )
    }
    if (category === STORY) return inLevel.filter((item) => storyIds.has(item.id))
    if (category === ALL) return inLevel
    if (category === TOPIC_CHIP) return []
    if (category === SAVED) return inLevel.filter((item) => saved.ids.has(item.id))
    if (subjectFilter) return inLevel.filter((item) => item.subject === subjectFilter)
    // 인기: 조회수·좋아요가 있는 카드 전부를 많은 순으로
    if (category === POPULAR) {
      return inLevel
        .filter((item) => item.category === POPULAR || popularity(item) > 0)
        .sort((a, b) => popularity(b) - popularity(a))
    }
    return inLevel.filter((item) => item.category === category)
  }, [feed.items, category, subjectFilter, saved.ids, keyword, level, storyIds])

  const cards = useMemo<Card[]>(() => {
    const newsCards: Card[] = visibleItems.map((item) => ({ key: item.id, item }))
    if (keyword) {
      const found = mixedTopics.filter((topic) =>
        `${topic.title} ${topic.tag} ${topic.slides.map((s) => `${s.heading} ${s.body}`).join(' ')}`.toLowerCase().includes(keyword)
      )
      return [...found.map((topic) => ({ key: topic.id, topic })), ...newsCards]
    }
    if (category === TOPIC_CHIP) return mixedTopics.map((topic) => ({ key: topic.id, topic }))
    if (category === STORY) return newsCards
    if (category === SAVED) {
      const savedTopics = mixedTopics.filter((topic) => saved.ids.has(topic.id))
      return [...newsCards, ...savedTopics.map((topic) => ({ key: topic.id, topic }))]
    }
    if (subjectFilter) return withTopics(newsCards, topicsBySubject[subjectFilter])
    if (category === ALL) return withTopics(newsCards, mixedTopics)
    return newsCards
    // 저장 목록은 탭을 바꿀 때만 다시 계산해, 저장 해제 시 카드가 바로 사라지지 않게 함
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleItems, mixedTopics, topicsBySubject, category, subjectFilter, keyword])

  // 전체 · 인기 · 수학 · 물리 · 화학 · 생명과학 · 주제 카드 · 교육 · 입시 · … · 저장
  const categories = useMemo(() => {
    const present = CATEGORY_ORDER.filter((c) => feed.items.some((item) => item.category === c))
    return [ALL, POPULAR, ...SUBJECTS.map((s) => s.name), TOPIC_CHIP, ...present, SAVED]
  }, [feed.items])

  // 부드러운 스크롤이 끝나기 전에 키를 연달아 눌러도 밀리지 않도록 목표 위치를 따로 기억
  const target = useRef(0)
  const settled = useRef(0) // 마지막으로 멈춰 선 카드 번호
  const settleTimer = useRef<ReturnType<typeof setTimeout>>()
  const goTo = useCallback((index: number, smooth = true) => {
    const el = scrollerRef.current
    if (!el) return
    target.current = Math.max(0, Math.min(index, el.children.length - 1))
    el.scrollTo({ top: el.clientHeight * target.current, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const index = Math.round(el.scrollTop / el.clientHeight)
    setActive(index)
    // 손가락/휠로 직접 넘긴 경우: 스크롤이 카드 경계에 멈추면 목표도 따라감
    if (Math.abs(el.scrollTop - el.clientHeight * index) < 2) target.current = index
    // 스크롤이 완전히 멈춘 뒤에만 전체화면을 켜고 끔: 아래로 넘기면 켜지고, 위로 올리거나 첫 카드면 꺼짐
    // (움직이는 도중에 메뉴를 숨기면 카드 높이가 바뀌어 스크롤이 튐)
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      const stopped = Math.round(el.scrollTop / el.clientHeight)
      if (stopped === settled.current) return
      setImmersive(stopped > settled.current && stopped > 0)
      settled.current = stopped
    }, 180)
  }

  // 메뉴가 사라지거나 나타나면 카드 높이가 바뀌므로, 화면에 그리기 전에 스크롤 위치를 다시 맞춤
  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollTo({ top: el.clientHeight * settled.current, behavior: 'auto' })
  }, [immersive])

  // 마우스 휠/트랙패드: 한 번 굴리면 정확히 카드 한 장만 이동 (브라우저 기본 동작은 조금씩 밀려 여러 번 굴려야 함)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || view !== 'reels') return
    let lockedUntil = 0
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 4) return
      e.preventDefault()
      const now = Date.now()
      if (now < lockedUntil) return
      lockedUntil = now + 800
      goTo(target.current + (e.deltaY > 0 ? 1 : -1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [view, goTo])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }

  const selectLevel = (next: string) => {
    setLevel(next)
    try {
      localStorage.setItem('edu-hub:level', next)
    } catch {}
  }

  // 검색어·학교급이 바뀌면 목록이 달라지므로 첫 카드로 돌아감
  useEffect(() => {
    setActive(0)
    setImmersive(false)
    settled.current = 0
    goTo(0, false)
  }, [keyword, level, goTo])

  const selectCategory = (next: string) => {
    setQuery('')
    setCategory(next)
    setActive(0)
    setImmersive(false)
    settled.current = 0
    goTo(0, false)
  }

  const openTopic = () => {
    switchView('reels')
    selectCategory(TOPIC_CHIP)
  }

  // 지금 보고 있는 카드를 읽음 처리
  const activeKey = view === 'reels' ? cards[active]?.item?.id : undefined
  const markRead = read.add
  useEffect(() => {
    if (activeKey) markRead(activeKey)
  }, [activeKey, markRead])

  // 자동 넘김
  useEffect(() => {
    if (!auto || view !== 'reels') return
    if (active >= cards.length) return setAuto(false)
    const timer = setTimeout(() => goTo(active + 1), AUTO_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [auto, view, active, cards.length, goTo])

  // 키보드: ↑↓ 또는 j/k 로 이동, 스페이스로 자동 넘김
  useEffect(() => {
    if (view !== 'reels') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') goTo(target.current + 1)
      else if (e.key === 'ArrowUp' || e.key === 'k') goTo(target.current - 1)
      else if (e.key === ' ') setAuto((on) => !on)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, goTo])

  // 과목 사이트들의 최신 데이터 확인: 처음 열 때, 다른 앱에 갔다가 돌아올 때, 열어 둔 채로 10분마다
  const lastCheck = useRef(0)
  const feedRef = useRef(feed)
  feedRef.current = feed
  useEffect(() => {
    // 처음 열 때는 화면이 가려져 있어도(뒤쪽 탭) 바로 확인, 그 뒤로는 보고 있을 때만
    const check = async (first = false) => {
      if (!first && (document.visibilityState !== 'visible' || Date.now() - lastCheck.current < 60_000)) return
      lastCheck.current = Date.now()
      const data = await fetchAll()
      // 한 과목이라도 못 가져왔으면 지금 화면을 그대로 둠 (카드가 통째로 사라지지 않게)
      if (data.length < SUBJECTS.length) {
        if (data.length === 0) showToast(navigator.onLine ? '최신 소식을 불러오지 못해 저장된 소식을 보여 줘요' : '인터넷 연결이 없어 저장된 소식을 보여 줘요')
        return
      }
      const fresh = combine(data)
      if (signature(fresh) === signature(feedRef.current)) return setPending(null)
      // 맨 첫 카드에 있으면 바로 바꾸고, 넘겨 보는 중이면 버튼으로 알림
      if (settled.current === 0 && target.current === 0) {
        setFeed(fresh)
        setPending(null)
      } else setPending(fresh)
    }
    const later = () => check()
    check(true)
    const timer = setInterval(later, CHECK_MINUTES * 60_000)
    document.addEventListener('visibilitychange', later)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', later)
    }
  }, [])

  const pendingCount = useMemo(() => {
    if (!pending) return 0
    const ids = new Set(feed.items.map((item) => item.id))
    return pending.items.filter((item) => !ids.has(item.id)).length
  }, [pending, feed.items])

  // 사이트명·제목을 누르면 처음 화면으로: 릴스 · 전체 · 첫 카드 (검색은 지우고, 새 소식이 있으면 반영)
  const goHome = () => {
    if (pending) {
      setFeed(pending)
      setPending(null)
    }
    setAuto(false)
    setSearchOpen(false)
    switchView('reels')
    selectCategory(ALL)
  }

  const applyPending = () => {
    if (!pending) return
    setFeed(pending)
    setPending(null)
    selectCategory(category)
  }

  const fullscreen = immersive && view === 'reels'

  // 과목 스토리: 최근 24시간 소식 중 아직 안 본 것이 있으면 색 링 + 개수
  const stories = useMemo(
    () =>
      SUBJECTS.map((subject) => {
        const recent = now
          ? feed.items.filter((item) => item.subject === subject.key && now - new Date(item.collectedAt).getTime() < STORY_HOURS * 3600_000)
          : []
        return { subject, recent, unread: recent.filter((item) => !read.ids.has(item.id)) }
      }),
    [feed.items, read.ids, now]
  )
  const [storySubject, setStorySubject] = useState<SubjectKey | null>(null)
  const openStory = ({ subject, recent, unread }: (typeof stories)[number]) => {
    // 안 본 소식이 있으면 그것만, 다 봤으면 최근 소식 전체를 다시, 최근 소식이 없으면 그 과목 칩으로
    const list = unread.length ? unread : recent
    setAuto(false)
    switchView('reels')
    if (!list.length) return selectCategory(subject.name)
    setStoryIds(new Set(list.map((item) => item.id)))
    setStorySubject(subject.key)
    selectCategory(STORY)
  }

  // 고른 칩이 화면 밖에 있으면 가운데로 끌어옴 (PC 왼쪽 패널에서 과목을 골랐을 때 등)
  const chipsRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const nav = chipsRef.current
    const chip = nav?.querySelector<HTMLElement>('[data-on]')
    if (nav && chip) nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2 })
  }, [category])
  const activeCard = cards[active]
  const glowSubject = view === 'reels' ? activeCard?.item?.subject ?? activeCard?.topic?.subject : subjectFilter
  const recentCounts = useMemo(() => {
    const counts = { math: 0, phys: 0, chem: 0, bio: 0 } as Record<SubjectKey, number>
    if (!now) return counts
    for (const item of feed.items) if (now - new Date(item.collectedAt).getTime() < 24 * 3600_000) counts[item.subject]++
    return counts
  }, [feed.items, now])
  const unreadCount = feed.items.filter((item) => !read.ids.has(item.id)).length
  const edition = feed.updatedAt ? editionLabel(feed.updatedAt) : '아직 수집 전'

  return (
    <>
      <SiteMeta />

      <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#08090b] text-white [padding-top:env(safe-area-inset-top)]">
        {/* 배경: 지금 보는 카드의 과목 색이 은은하게 번짐 */}
        {SUBJECTS.map((s) => (
          <div
            key={s.key}
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{
              opacity: glowSubject === s.key ? 1 : 0,
              background: `radial-gradient(60% 40% at 50% 0%, ${s.color}24, transparent 70%), radial-gradient(45% 35% at 50% 100%, ${s.color}14, transparent 70%)`,
            }}
          />
        ))}

        <header className={`relative z-10 mx-auto w-full max-w-2xl shrink-0 px-4 pt-2.5 ${fullscreen ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 flex-1">
              <button onClick={goHome} aria-label="처음 화면으로" className="flex max-w-full items-center gap-2 text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${router.basePath}/icon-180.png?v=2`} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
                <span className="truncate text-[16.5px] font-extrabold tracking-[-0.02em]">
                  <span className="text-emerald-400">Shrek</span> Edu <span className="text-amber-300">Insight</span>
                </span>
              </button>
            </h1>
            <div className="flex rounded-full border border-white/10 bg-white/[0.05] p-0.5 text-[13px] font-bold">
              {(['reels', 'briefing'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  className={`min-h-[34px] rounded-full px-3 transition ${
                    view === v ? 'bg-white text-neutral-900 shadow-sm' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {v === 'reels' ? '릴스' : '한눈에'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSearchOpen((open) => !open)}
              aria-label="검색·학교급"
              aria-pressed={searchOpen}
              title="검색·학교급"
              className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border transition ${
                searchOpen || keyword || level
                  ? 'border-white bg-white text-neutral-900'
                  : 'border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/[0.12]'
              }`}
            >
              <SearchIcon className="h-[18px] w-[18px]" />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <button onClick={goHome} className="min-w-0 flex-1 truncate text-left text-[14px] font-bold tracking-[-0.01em] text-white/80">
              {TAGLINE}
            </button>
            <Link href="/about/" className="shrink-0 text-[12px] font-semibold text-white/45 underline-offset-4 hover:text-white hover:underline">
              소개
            </Link>
          </div>

          <div className="mt-2 flex items-center gap-3" aria-label="과목별 새 소식">
            {stories.map((story) => {
              const { subject, unread } = story
              const on = category === STORY && storySubject === subject.key && !keyword
              return (
                <button
                  key={subject.key}
                  onClick={() => openStory(story)}
                  aria-label={`${subject.name} 새 소식 ${unread.length}건`}
                  title={`${subject.name} 최근 ${STORY_HOURS}시간 새 소식`}
                  className="relative shrink-0 rounded-full transition active:scale-95"
                >
                  <span
                    className="block rounded-full p-[2.5px]"
                    style={{
                      background: unread.length
                        ? `conic-gradient(from 210deg, ${subject.color}, #fde68a, ${subject.color})`
                        : 'rgba(255,255,255,0.16)',
                    }}
                  >
                    <span
                      className={`flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 text-[12.5px] font-extrabold tracking-[-0.03em] ${
                        on ? 'border-white bg-white text-neutral-900' : 'border-[#08090b] bg-[#16171b]'
                      }`}
                      style={on ? undefined : { color: unread.length ? subject.color : 'rgba(255,255,255,0.45)' }}
                    >
                      {subject.name.slice(0, 2)}
                    </span>
                  </span>
                  {unread.length > 0 && (
                    <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full border-2 border-[#08090b] bg-amber-300 px-1 text-center text-[10.5px] font-extrabold leading-[16px] text-neutral-900">
                      {unread.length > 99 ? '99+' : unread.length}
                    </span>
                  )}
                </button>
              )
            })}
            <p className="min-w-0 flex-1 text-[11.5px] font-semibold leading-tight text-white/40">
              {category === STORY && storySubject && !keyword
                ? `${SUBJECT[storySubject].name} 새 소식 ${cards.length}건`
                : `최근 ${STORY_HOURS}시간 새 소식`}
            </p>
          </div>

          {searchOpen && (
            <div className="mt-2 flex items-center gap-1.5">
              <label className="flex min-h-[38px] min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 focus-within:border-white/25">
                <SearchIcon className="h-4 w-4 shrink-0 text-white/45" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="제목·출처 검색"
                  aria-label="검색어"
                  className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder-white/35 outline-none"
                />
              </label>
              {['', ...LEVELS].map((l) => (
                <button
                  key={l}
                  onClick={() => selectLevel(l)}
                  aria-pressed={level === l}
                  className={`min-h-[38px] shrink-0 rounded-full border px-2.5 text-[13px] font-bold transition ${
                    level === l ? 'border-white bg-white text-neutral-900' : 'border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.1]'
                  }`}
                >
                  {l || '모두'}
                </button>
              ))}
            </div>
          )}

          <nav ref={chipsRef} className="no-scrollbar -mx-4 mt-2.5 flex gap-1.5 overflow-x-auto scroll-smooth px-4 pb-2.5">
            {categories.map((c) => {
              const dot = SUBJECT_BY_NAME[c] && SUBJECT[SUBJECT_BY_NAME[c]].color
              const on = category === c && !keyword
              return (
                <button
                  key={c}
                  onClick={() => selectCategory(c)}
                  data-on={on || undefined}
                  className={`flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-bold transition ${
                    on ? 'border-white bg-white text-neutral-900' : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
                  {c}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="relative z-0 min-h-0 flex-1">
          {/* 넓은 PC 화면: 왼쪽 빈자리에 과목별 소식 수 · 오늘의 주제 · 링크 */}
          {view === 'reels' && (
            <aside className="absolute bottom-6 left-[max(1.5rem,calc(50%-560px))] top-2 hidden w-[260px] flex-col gap-3 overflow-y-auto xl:flex">
              <div className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5">
                <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/40">Today</p>
                <p className="mt-1 text-[15px] font-bold">최근 24시간 새 소식</p>
                <ul className="mt-3 space-y-1">
                  {SUBJECTS.map((s) => (
                    <li key={s.key}>
                      <button
                        onClick={() => selectCategory(s.name)}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.06] ${
                          category === s.name ? 'bg-white/[0.08]' : ''
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                        <span className="flex-1 text-[14px] font-semibold text-white/85">{s.name}</span>
                        <span className="text-[14px] font-bold tabular-nums">{recentCounts[s.key]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              {mixedTopics[0] && (
                <button onClick={openTopic} className="rounded-3xl border border-white/[0.07] bg-white/[0.03] p-5 text-left transition hover:bg-white/[0.06]">
                  <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/40">Topic of the day</p>
                  <p className={`mt-2 text-[12.5px] font-bold ${SUBJECT[mixedTopics[0].subject].accent}`}>
                    {SUBJECT[mixedTopics[0].subject].name} · {mixedTopics[0].tag}
                  </p>
                  <p className="mt-1 break-keep text-[15px] font-bold leading-snug">{mixedTopics[0].title}</p>
                </button>
              )}
              <p className="px-2 text-[12px] leading-relaxed text-white/40">
                {edition}
                <br />
                <Link href="/about/" className="underline-offset-4 hover:text-white hover:underline">
                  소개
                </Link>
                {' · '}
                <Link href="/stats/" className="underline-offset-4 hover:text-white hover:underline">
                  방문 통계
                </Link>
                {' · '}↑↓ 키로 넘기기
              </p>
            </aside>
          )}

          {view === 'briefing' ? (
            <Briefing
              items={visibleItems}
              topic={subjectFilter ? topicsBySubject[subjectFilter][0] : mixedTopics[0]}
              isNew={isNew}
              edition={feed.updatedAt ? `${edition} · 안 읽음 ${unreadCount}` : edition}
              now={now}
              savedIds={saved.ids}
              readIds={read.ids}
              onSave={saved.toggle}
              onRead={read.add}
              onOpenTopic={openTopic}
            />
          ) : (
            <div className="relative mx-auto flex h-full max-h-[900px] w-full max-w-[460px] flex-col pb-[env(safe-area-inset-bottom)]">
              {/* 전체화면일 때: 얇은 진행 선과 메뉴 다시 열기 버튼만 카드 위에 겹쳐 보여 줌 */}
              {fullscreen && (
                <>
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-white/20">
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${(Math.min(active + 1, cards.length) / Math.max(cards.length, 1)) * 100}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setImmersive(false)}
                    aria-label="메뉴 보기"
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/45 backdrop-blur-md"
                  >
                    <MenuIcon className="h-[18px] w-[18px]" />
                  </button>
                </>
              )}
              {/* 진행 표시: 카드 위치 + 자동 넘김 타이머 */}
              <div className={`shrink-0 px-3 sm:px-5 ${fullscreen ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between gap-2 pb-1.5 text-[11.5px] font-semibold text-white/45">
                  <span className="truncate tabular-nums">
                    <b className="font-bold text-white">{Math.min(active + 1, cards.length)}</b> / {cards.length}
                    <span className="mx-1.5 text-white/20">|</span>
                    {edition}
                  </span>
                  <button
                    onClick={() => setAuto((on) => !on)}
                    title="자동 넘김 (스페이스)"
                    className={`flex min-h-[28px] shrink-0 items-center gap-1 rounded-full border px-2.5 font-bold transition ${
                      auto ? 'border-white bg-white text-neutral-900' : 'border-white/10 bg-white/[0.05] text-white/80 hover:bg-white/[0.12]'
                    }`}
                  >
                    {auto ? <PauseIcon className="h-3 w-3" /> : <PlayIcon className="h-3 w-3" />}
                    {auto ? '자동 넘김 중' : '자동 넘김'}
                  </button>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
                  {auto ? (
                    <div key={active} className="reel-timer h-full bg-white" style={{ animationDuration: `${AUTO_SECONDS}s` }} />
                  ) : (
                    <div
                      className="h-full bg-white transition-all"
                      style={{ width: `${(Math.min(active + 1, cards.length) / Math.max(cards.length, 1)) * 100}%` }}
                    />
                  )}
                </div>
              </div>

              <div
                ref={scrollerRef}
                onScroll={onScroll}
                className="no-scrollbar min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain"
              >
                {cards.map((card, i) =>
                  card.item ? (
                    <NewsCard
                      key={card.key}
                      eager={i < 2}
                      active={i === active}
                      onPlay={() => setAuto(false)}
                      item={card.item}
                      isNew={isNew(card.item)}
                      saved={saved.ids.has(card.key)}
                      onSave={() => saved.toggle(card.key)}
                      onShare={async () => {
                        const item = card.item!
                        const translated = item.lang === 'en' && item.titleKo
                        const message = await shareLink(
                          translated ? item.titleKo! : item.title,
                          (translated ? item.summaryKo : item.summary) || '',
                          item.link
                        )
                        if (message) showToast(message)
                      }}
                    />
                  ) : (
                    <TopicCard
                      key={card.key}
                      topic={card.topic!}
                      saved={saved.ids.has(card.key)}
                      onSave={() => saved.toggle(card.key)}
                    />
                  )
                )}
                <EndCard empty={cards.length === 0} onRestart={() => goTo(0)} />
              </div>

              {/* 넓은 화면용 이동 버튼 */}
              <div className="absolute -right-16 bottom-6 hidden flex-col gap-2 md:flex">
                <button onClick={() => goTo(active - 1)} title="이전 (↑)" aria-label="이전 카드" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] transition hover:bg-white/[0.12]">
                  <ArrowIcon dir="up" />
                </button>
                <button onClick={() => goTo(active + 1)} title="다음 (↓)" aria-label="다음 카드" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] transition hover:bg-white/[0.12]">
                  <ArrowIcon dir="down" />
                </button>
              </div>
            </div>
          )}

          {pending && pendingCount > 0 && (
            <button
              onClick={applyPending}
              className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-neutral-900 shadow-[0_10px_30px_-8px_rgba(252,211,77,0.6)]"
            >
              <ArrowIcon dir="up" className="h-4 w-4" />새 소식 {pendingCount}건 보기
            </button>
          )}

          {toast && (
            <p className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-neutral-800/90 px-4 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-md">
              {toast}
            </p>
          )}
        </main>
      </div>
    </>
  )
}
