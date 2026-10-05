import { useCallback, useEffect, useState } from 'react'

export type FeedItem = {
  id: string
  subject: SubjectKey
  kind: 'news' | 'video'
  lang: 'ko' | 'en'
  title: string
  summary: string
  link: string
  source: string
  image?: string
  category: string
  publishedAt: string
  collectedAt: string
  views?: number
  likes?: string
  // 이 글이 소개하는 유튜브 영상 번호 (페이스북 게시물)
  refs?: string[]
  thumb?: string | null
  titleKo?: string
  summaryKo?: string
  translator?: 'claude' | 'google' | 'mymemory'
  // 날짜가 의미 없는 고정 카드 (인스타·페이스북 바로가기 등)
  evergreen?: boolean
}

export type Feed = { updatedAt: string | null; items: FeedItem[] }

export type Topic = {
  id: string
  subject: SubjectKey
  tag: string
  title: string
  slides: { heading: string; body: string }[]
}

export const SITE_NAME = 'Shrek Edu Insight'
export const TAGLINE = '오늘의 수학과학, 수업이 되는 뉴스'
export const DESCRIPTION = '수학·물리·화학·생명과학 교사를 위한 뉴스·영상·수업 주제, 1시간마다 업데이트'
// 소개 페이지 '문의'에 보여 줄 이메일 (비워 두면 이메일 없이 안내만)
export const CONTACT = 'heopx114@gmail.com'
// 방문자 통계 (GoatCounter, 쿠키·개인정보 없음). 가입할 때 정한 코드 — https://<코드>.goatcounter.com 에서 통계를 봄
// 비워 두면 통계를 보내지 않음
export const GOATCOUNTER = ''
// 공유 미리보기 이미지·대표 주소는 절대 주소여야 함. 배포 워크플로가 NEXT_PUBLIC_SITE_URL 을 넣어 줌
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3040').replace(/\/$/, '')

// 과목별 피드는 각자의 사이트(저장소)가 1시간마다 수집해 올림. 이 사이트는 그 데이터를 모아 한 피드로 보여 줌
export type SubjectKey = 'math' | 'phys' | 'chem' | 'bio'
export type Subject = { key: SubjectKey; name: string; repo: string; accent: string; color: string }
export const OWNER = 'Shrek7979'
export const SUBJECTS: Subject[] = [
  { key: 'math', name: '수학', repo: 'ShrekMathNews', accent: 'text-fuchsia-400', color: '#e879f9' },
  { key: 'phys', name: '물리', repo: 'JangPhysNews', accent: 'text-sky-400', color: '#38bdf8' },
  { key: 'chem', name: '화학', repo: 'SongChemNews', accent: 'text-amber-400', color: '#fbbf24' },
  { key: 'bio', name: '생명과학', repo: 'JangsBioNews', accent: 'text-emerald-400', color: '#34d399' },
]
export const SUBJECT = Object.fromEntries(SUBJECTS.map((s) => [s.key, s])) as Record<SubjectKey, Subject>

// 네 과목에 공통으로 있는 분류만 칩으로 보여 줌 (과목 고유 분류는 과목 칩 안에서 봄)
export const TOPIC_CHIP = '주제 카드'
export const CATEGORY_ORDER = ['교육', '입시', '연구', '대회·행사', '해외']

const KST = 'Asia/Seoul'
const dateFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, month: 'numeric', day: 'numeric', weekday: 'short' })
const shortDateFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, month: 'numeric', day: 'numeric' })

export const formatDate = (iso: string) => dateFormat.format(new Date(iso))

const timeFormat = new Intl.DateTimeFormat('ko-KR', { timeZone: KST, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

// "10. 4. 05:20 업데이트" — 마지막으로 수집한 시각
export function editionLabel(iso: string) {
  return `${shortDateFormat.format(new Date(iso))} ${timeFormat.format(new Date(iso))} 업데이트`
}

// 조회수를 '12.3만' 처럼 짧게
export function formatViews(views: number) {
  if (views >= 100_000_000) return `${(views / 100_000_000).toFixed(1)}억`
  if (views >= 10_000) return `${(views / 10_000).toFixed(views >= 1_000_000 ? 0 : 1)}만`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}천`
  return String(views)
}

export function timeAgo(iso: string, now: number) {
  const minutes = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)}시간 전`
  return `${Math.round(minutes / (60 * 24))}일 전`
}

// localStorage 에 보관되는 id 집합 (저장한 카드, 읽은 카드)
export function useStoredSet(key: string) {
  const [ids, setIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      setIds(new Set(JSON.parse(localStorage.getItem(key) || '[]')))
    } catch {}
  }, [key])

  const update = useCallback(
    (change: (next: Set<string>) => void) =>
      setIds((prev) => {
        const next = new Set(prev)
        change(next)
        try {
          localStorage.setItem(key, JSON.stringify(Array.from(next).slice(-500)))
        } catch {}
        return next
      }),
    [key]
  )

  const add = useCallback((id: string) => update((next) => next.add(id)), [update])
  const toggle = useCallback(
    (id: string) => update((next) => (next.has(id) ? next.delete(id) : next.add(id))),
    [update]
  )

  return { ids, add, toggle }
}

// 단톡방에 바로 붙여 넣을 수 있게 "제목 + 한 줄 설명 + 링크" 로 공유
export async function shareLink(title: string, summary: string, url: string): Promise<string | null> {
  const text = [title, summary].filter(Boolean).join('\n')
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return null
    }
    await navigator.clipboard.writeText(`${text}\n${url}`)
    return '제목과 링크를 복사했어요'
  } catch {
    return null
  }
}

// 인기 점수: 유튜브 조회수 또는 인스타그램 좋아요("105K", "1.2M", "761")
export function popularity(item: FeedItem) {
  if (item.views) return item.views
  const likes = item.likes?.match(/^([\d.,]+)([KM]?)$/)
  if (!likes) return 0
  return Number(likes[1].replace(/,/g, '')) * ({ K: 1_000, M: 1_000_000 }[likes[2]] || 1)
}

// 학교급: 제목·설명의 낱말로 추정. 어느 학교급인지 알 수 없는 글(연구, 해외 소식 등)은 빈 집합
export const LEVELS = ['초등', '중등', '고등'] as const
const LEVEL_PATTERNS: [string, RegExp][] = [
  ['초등', /초등|초[1-6]/],
  ['중등', /중학|중등|중[1-3]/],
  ['고등', /고등|고[1-3]|수능|모의고사|모평|대입|내신|입시/],
]
export function levelsOf(item: FeedItem) {
  const text = `${item.title} ${item.summary} ${item.titleKo || ''}`
  return new Set(LEVEL_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([level]) => level))
}
// 고른 학교급의 글 + 학교급과 무관한 글을 보여 주고, 다른 학교급 전용 글만 숨김
export function matchesLevel(item: FeedItem, level: string) {
  if (!level) return true
  const levels = levelsOf(item)
  return levels.size === 0 || levels.has(level)
}
