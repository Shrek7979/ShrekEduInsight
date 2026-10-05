import React from 'react'
import Link from 'next/link'
import { PlayIcon, StarIcon } from '@/components/icons'
import { FeedItem, SUBJECT, Topic, formatViews, timeAgo } from '@/lib/feed'

type BriefingProps = {
  items: FeedItem[]
  topic?: Topic
  isNew: (item: FeedItem) => boolean
  edition: string
  now: number | null
  savedIds: Set<string>
  readIds: Set<string>
  onSave: (id: string) => void
  onRead: (id: string) => void
  onOpenTopic: () => void
}

// 한눈에 보기: 최신 순으로 제목만 빠르게 훑는 목록
export default function Briefing(props: BriefingProps) {
  const { items, topic, isNew, edition, now, savedIds, readIds, onSave, onRead, onOpenTopic } = props
  // 릴스와 같은 순서(새로 들어온 카드가 맨 위). 날짜가 없는 바로가기 카드(인스타·페이스북)는 맨 아래
  const sorted = [...items].sort((a, b) => Number(a.evergreen || false) - Number(b.evergreen || false))

  return (
    <div className="h-full overflow-y-auto overscroll-contain">
      <div className="mx-auto max-w-2xl px-4 pb-[max(4rem,env(safe-area-inset-bottom))] pt-2">
        {topic && (
          <button
            onClick={onOpenTopic}
            className="mb-5 w-full rounded-3xl border border-white/[0.08] p-5 text-left transition hover:border-white/15"
            style={{ background: `radial-gradient(100% 140% at 0% 0%, ${SUBJECT[topic.subject].color}26, transparent 60%), rgba(255,255,255,0.03)` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Topic of the day</p>
            <p className={`mt-2 text-[12.5px] font-bold ${SUBJECT[topic.subject].accent}`}>
              {SUBJECT[topic.subject].name} · {topic.tag}
            </p>
            <p className="mt-1 break-keep text-[18px] font-bold leading-snug tracking-[-0.02em]">{topic.title}</p>
          </button>
        )}

        <p className="mb-1 px-1 text-[12px] font-semibold text-white/40">{edition}</p>

        {sorted.length === 0 && <p className="py-20 text-center text-white/60">표시할 소식이 없어요.</p>}

        <ul className="divide-y divide-white/[0.07]">
              {sorted.map((item) => {
                const read = readIds.has(item.id)
                const title = item.lang === 'en' && item.titleKo ? item.titleKo : item.title
                return (
                  <li key={item.id} className="flex items-start gap-3 py-3.5">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onRead(item.id)}
                      className={`flex min-w-0 flex-1 gap-3 ${read ? 'opacity-50' : ''}`}
                    >
                      {/* 섬네일이 없거나 못 불러오면 과목 이름 칸으로 */}
                      <span
                        className={`relative flex h-[68px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-bold ring-1 ring-white/[0.08] ${SUBJECT[item.subject].accent}`}
                        style={{ background: `${SUBJECT[item.subject].color}26` }}
                      >
                        {SUBJECT[item.subject].name}
                        {(item.thumb || item.image) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumb || item.image}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            // 섬네일이 없으면 원문 이미지로, 그것도 없으면 숨김
                            onError={(e) => {
                              const img = e.currentTarget
                              if (item.image && img.src !== item.image) img.src = item.image
                              else img.style.display = 'none'
                            }}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 break-keep text-[15px] font-semibold leading-snug tracking-[-0.01em]">
                          {isNew(item) && !read && (
                            <span className="mr-1.5 inline-block h-2 w-2 -translate-y-0.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]" />
                          )}
                          {item.kind === 'video' && <PlayIcon className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-white/60" />}
                          {title}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/45">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: SUBJECT[item.subject].color }} />
                          <span className="truncate">
                          <span className="font-semibold text-white/70">{SUBJECT[item.subject].name}</span>
                          {item.category !== '인기' && ` · ${item.category}`}
                          {' · '}
                          {item.source}
                          {item.views && ` · 조회 ${formatViews(item.views)}`}
                          {item.lang === 'en' && ' · 번역'}
                          {now && !item.evergreen && ` · ${timeAgo(item.publishedAt, now)}`}
                          </span>
                        </span>
                      </span>
                    </a>
                    <button
                      onClick={() => onSave(item.id)}
                      aria-label="저장"
                      aria-pressed={savedIds.has(item.id)}
                      className={`-mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center ${
                        savedIds.has(item.id) ? 'text-amber-300' : 'text-white/35 hover:text-white'
                      }`}
                    >
                      <StarIcon filled={savedIds.has(item.id)} className="h-[18px] w-[18px]" />
                    </button>
                  </li>
                )
              })}
        </ul>

        <p className="pt-8 text-center text-[12.5px] text-white/35">
          <Link href="/about/" className="underline-offset-4 hover:text-white hover:underline">
            사이트 소개 · 출처와 저작권 · 개인정보
          </Link>
          {' · '}
          <Link href="/stats/" className="underline-offset-4 hover:text-white hover:underline">
            방문 통계
          </Link>
        </p>
      </div>
    </div>
  )
}
