import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { GetStaticProps } from 'next'
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
import { Combined, combine, fetchAll } from '@/lib/sources'

type Props = { initial: Combined; dayIndex: number }
type Card = { key: string; item?: FeedItem; topic?: Topic }

const ALL = '전체'
const POPULAR = '인기'
const SAVED = '★ 저장'
const TOPIC_EVERY = 5
const AUTO_SECONDS = 8
// 페이지를 연 뒤에도 이 간격으로 과목 사이트의 새 데이터를 확인
const CHECK_MINUTES = 10
const SUBJECT_BY_NAME = Object.fromEntries(SUBJECTS.map((s) => [s.name, s.key])) as Record<string, SubjectKey>

// 빌드(배포) 시점에 네 과목 사이트의 데이터를 받아 첫 화면을 만듦. 브라우저에서 연 뒤에는 최신 데이터로 다시 바꿈
export const getStaticProps: GetStaticProps<Props> = async () => ({
  props: {
    initial: combine(await fetchAll()),
    dayIndex: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
  },
})

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
  const [now, setNow] = useState<number | null>(null)
  const saved = useStoredSet('edu-hub:saved')
  const read = useStoredSet('edu-hub:read')

  useEffect(() => {
    setNow(Date.now())
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
        `${item.title} ${item.titleKo || ''} ${item.summary} ${item.summaryKo || ''} ${item.source}`.toLowerCase().includes(keyword)
      )
    }
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
  }, [feed.items, category, subjectFilter, saved.ids, keyword, level])

  const cards = useMemo<Card[]>(() => {
    const newsCards: Card[] = visibleItems.map((item) => ({ key: item.id, item }))
    if (keyword) {
      const found = mixedTopics.filter((topic) =>
        `${topic.title} ${topic.tag} ${topic.slides.map((s) => `${s.heading} ${s.body}`).join(' ')}`.toLowerCase().includes(keyword)
      )
      return [...found.map((topic) => ({ key: topic.id, topic })), ...newsCards]
    }
    if (category === TOPIC_CHIP) return mixedTopics.map((topic) => ({ key: topic.id, topic }))
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
    const check = async () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck.current < 60_000) return
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
    check()
    const timer = setInterval(check, CHECK_MINUTES * 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
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
  const unreadCount = feed.items.filter((item) => !read.ids.has(item.id)).length
  const edition = feed.updatedAt ? editionLabel(feed.updatedAt) : '아직 수집 전'

  return (
    <>
      <SiteMeta />

      <div className="fixed inset-0 flex flex-col bg-neutral-950 text-white [padding-top:env(safe-area-inset-top)]">
        <header className={`mx-auto w-full max-w-2xl shrink-0 px-4 pt-2 ${fullscreen ? 'hidden' : ''}`}>
          <div className="flex items-center gap-2">
            <h1 className="min-w-0 flex-1 truncate text-[17px] font-extrabold leading-tight">
              <button onClick={goHome} aria-label="처음 화면으로" className="max-w-full truncate text-left">
                <span className="text-emerald-400">Shrek</span> Edu <span className="text-amber-300">Insight</span>
              </button>
            </h1>
            <div className="flex rounded-full bg-white/10 p-0.5 text-[13px] font-bold">
              {(['reels', 'briefing'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  className={`min-h-[36px] rounded-full px-3 transition ${
                    view === v ? 'bg-white text-neutral-900' : 'text-white/70'
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
              className={`min-h-[36px] rounded-full px-3 text-[13px] font-bold ${
                searchOpen || keyword || level ? 'bg-white text-neutral-900' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              검색
            </button>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <button onClick={goHome} className="min-w-0 flex-1 truncate text-left text-[14px] font-bold text-white/85">
              {TAGLINE}
            </button>
            <Link href="/about/" className="shrink-0 text-[12px] font-bold text-white/50 underline-offset-2 hover:text-white hover:underline">
              소개
            </Link>
          </div>

          {searchOpen && (
            <div className="mt-2 flex items-center gap-1.5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목·출처 검색"
                aria-label="검색어"
                className="min-h-[36px] min-w-0 flex-1 rounded-full bg-white/10 px-4 text-[14px] text-white placeholder-white/40 outline-none focus:bg-white/15"
              />
              {['', ...LEVELS].map((l) => (
                <button
                  key={l}
                  onClick={() => selectLevel(l)}
                  aria-pressed={level === l}
                  className={`min-h-[36px] shrink-0 rounded-full px-2.5 text-[13px] font-bold ${
                    level === l ? 'bg-white text-neutral-900' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {l || '모두'}
                </button>
              ))}
            </div>
          )}

          <nav className="no-scrollbar -mx-4 mt-2 flex gap-1.5 overflow-x-auto px-4 pb-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                className={`min-h-[34px] shrink-0 rounded-full px-3.5 text-[13px] font-bold transition ${
                  category === c && !keyword ? 'bg-white text-neutral-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {c}
              </button>
            ))}
          </nav>
        </header>

        <main className="relative min-h-0 flex-1">
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
                    className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-lg font-bold backdrop-blur"
                  >
                    ☰
                  </button>
                </>
              )}
              {/* 진행 표시: 카드 위치 + 자동 넘김 타이머 */}
              <div className={`shrink-0 px-3 sm:px-5 ${fullscreen ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-white/70">
                  <span className="truncate">
                    {Math.min(active + 1, cards.length)} / {cards.length} · {edition}
                  </span>
                  <button
                    onClick={() => setAuto((on) => !on)}
                    title="자동 넘김 (스페이스)"
                    className={`min-h-[28px] rounded-full px-2.5 ${
                      auto ? 'bg-white text-neutral-900' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {auto ? '❚❚ 자동 넘김 중' : '▶ 자동 넘김'}
                  </button>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/20">
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
                {cards.map((card) =>
                  card.item ? (
                    <NewsCard
                      key={card.key}
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
                <button onClick={() => goTo(active - 1)} title="이전 (↑)" className="h-12 w-12 rounded-full bg-white/10 text-lg hover:bg-white/20">
                  ↑
                </button>
                <button onClick={() => goTo(active + 1)} title="다음 (↓)" className="h-12 w-12 rounded-full bg-white/10 text-lg hover:bg-white/20">
                  ↓
                </button>
              </div>
            </div>
          )}

          {pending && pendingCount > 0 && (
            <button
              onClick={applyPending}
              className="absolute left-1/2 top-3 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-yellow-300 px-4 py-2 text-sm font-bold text-neutral-900 shadow-lg"
            >
              ↑ 새 소식 {pendingCount}건 보기
            </button>
          )}

          {toast && (
            <p className="absolute bottom-24 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-bold text-neutral-900 shadow-lg">
              {toast}
            </p>
          )}
        </main>
      </div>
    </>
  )
}
