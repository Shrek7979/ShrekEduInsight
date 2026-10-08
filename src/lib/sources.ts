import { Feed, FeedItem, OWNER, SITE_URL, SUBJECTS, Subject, SubjectKey, Topic } from './feed'
import { isUnwanted, stripPromo } from './content-filter.mjs'

// 과목 하나의 원본 데이터 (subjects/<과목>/data/*.json — 과목별 수집기가 만듦)
type RawItem = Omit<FeedItem, 'subject'>
type RawTopic = Omit<Topic, 'subject'>
export type SubjectData = {
  subject: SubjectKey
  feed: { updatedAt: string | null; items: RawItem[] }
  posts: RawItem[] // 인스타그램·페이스북 게시물
  topics: RawTopic[]
}

export type Combined = Feed & { topics: Topic[] }

// 브라우저에서 최신 데이터 확인: raw.githubusercontent.com 은 누구나 읽을 수 있고, 저장소에 올라온 지 몇 분 안에 바뀜
export const REPO = 'ShrekEduInsight'
const rawUrl = (subject: Subject, file: string) =>
  `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/subjects/${subject.key}/data/${file}`
// 섬네일·SNS 그림은 이 사이트의 /s/<과목> 아래 (빌드 전에 scripts/prepare-assets.mjs 가 복사)
const assetUrl = (subject: Subject) => `${SITE_URL}/s/${subject.key}`

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    return res.ok ? await res.json() : fallback
  } catch {
    return fallback
  }
}

// 한 과목 데이터를 가져옴. 실패한 파일은 빈 것으로 두고, 피드 자체를 못 가져오면 null
export async function fetchSubject(subject: Subject): Promise<SubjectData | null> {
  const [feed, instagram, facebook, topics] = await Promise.all([
    getJson<SubjectData['feed'] | null>(rawUrl(subject, 'feed.json'), null),
    getJson<{ items: RawItem[] }>(rawUrl(subject, 'instagram.json'), { items: [] }),
    getJson<{ items: RawItem[] }>(rawUrl(subject, 'facebook.json'), { items: [] }),
    getJson<RawTopic[]>(rawUrl(subject, 'topics.json'), []),
  ])
  if (!feed?.items) return null
  return { subject: subject.key, feed, posts: [...(instagram.items || []), ...(facebook.items || [])], topics }
}

export async function fetchAll() {
  const results = await Promise.all(SUBJECTS.map(fetchSubject))
  return results.filter((r): r is SubjectData => r !== null)
}

// 원문 기사 이미지: https 로 (사이트는 https 라 http 그림은 막힘), 빙 뉴스 미리보기는 큰 크기로 요청
function articleImage(url?: string) {
  if (!url) return undefined
  const secure = url.replace(/^http:\/\//, 'https://')
  return /^https:\/\/www\.bing\.com\/th\?/.test(secure) && !/[?&]w=/.test(secure) ? `${secure}&w=800` : secure
}

const normalize = (text?: string) => (text || '').toLowerCase().replace(/[^0-9a-z가-힣]/g, '')
const videoId = (link: string) => link.match(/(?:v=|shorts\/|youtu\.be\/)([\w-]{11})/)?.[1]

// 네 과목을 한 피드로: 새로 수집된 카드가 앞. 같은 기사·영상이 여러 과목에 있으면 하나만 남김
export function combine(data: SubjectData[]): Combined {
  const seenTitles = new Set<string>()
  const seenLinks = new Set<string>()
  const videoIds = new Set<string>()
  const items: FeedItem[] = []

  const add = (subject: Subject, original: RawItem, isPost: boolean) => {
    // 광고·홍보성 글과 개인 소식은 싣지 않고, 설명의 홍보 문구(굿즈·멤버십 등)는 지움 (content-filter.mjs)
    if (isUnwanted(original)) return
    const raw = stripPromo(original)
    const titles = [normalize(raw.title), normalize(raw.titleKo)].filter((t) => t.length >= 6)
    // 인스타그램·페이스북 글이 이미 있는 유튜브 영상을 소개하는 것이면 뺌 (예: 같은 영상의 릴스)
    if (isPost && raw.refs?.some((id) => videoIds.has(id))) return
    if (seenLinks.has(raw.link) || titles.some((t) => seenTitles.has(t))) return
    seenLinks.add(raw.link)
    titles.forEach((t) => seenTitles.add(t))
    const id = videoId(raw.link)
    if (id) videoIds.add(id)
    items.push({
      ...raw,
      id: `${subject.key}:${raw.id}`,
      subject: subject.key,
      collectedAt: raw.collectedAt || raw.publishedAt,
      // 빌드 시 넘기는 데이터에 undefined 가 있으면 Next 가 거부하므로 있을 때만
      ...(raw.image ? { image: articleImage(raw.image) } : {}),
      thumb: raw.thumb ? (raw.thumb.startsWith('/') ? `${assetUrl(subject)}${raw.thumb}` : raw.thumb) : null,
    })
  }

  // 뉴스·유튜브를 먼저 넣어야 같은 영상을 알리는 SNS 글이 빠짐
  for (const d of data) for (const raw of d.feed.items) add(SUBJECTS.find((s) => s.key === d.subject)!, raw, false)
  for (const d of data) for (const raw of d.posts) add(SUBJECTS.find((s) => s.key === d.subject)!, raw, true)

  items.sort((a, b) => b.collectedAt.localeCompare(a.collectedAt) || b.publishedAt.localeCompare(a.publishedAt))

  const updatedAt = data.reduce<string | null>(
    (max, d) => (d.feed.updatedAt && (!max || d.feed.updatedAt > max) ? d.feed.updatedAt : max),
    null
  )
  const topics = data.flatMap((d) => d.topics.map((t) => ({ ...t, id: `${d.subject}:${t.id}`, subject: d.subject })))
  return { updatedAt, items, topics }
}

// 소개 페이지용: 과목마다 마지막 수집 시각과 카드 수만 가볍게 확인
export type SubjectStatus = { subject: Subject; updatedAt: string | null; count: number; ok: boolean }
export async function fetchStatus(): Promise<SubjectStatus[]> {
  return Promise.all(
    SUBJECTS.map(async (subject) => {
      const feed = await getJson<{ updatedAt: string | null; items: unknown[] } | null>(rawUrl(subject, 'feed.json'), null)
      return { subject, updatedAt: feed?.updatedAt ?? null, count: feed?.items?.length ?? 0, ok: Boolean(feed) }
    })
  )
}

