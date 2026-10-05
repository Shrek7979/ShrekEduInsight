import React from 'react'
import Link from 'next/link'
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
            className="mb-5 w-full rounded-2xl bg-white/[0.06] p-4 text-left"
          >
            <p className={`text-xs font-semibold ${SUBJECT[topic.subject].accent}`}>
              오늘의 주제 · {SUBJECT[topic.subject].name} · {topic.tag}
            </p>
            <p className="mt-1 break-keep text-[17px] font-bold leading-snug">{topic.title}</p>
          </button>
        )}

        <p className="mb-2 text-xs text-white/50">{edition}</p>

        {sorted.length === 0 && <p className="py-20 text-center text-white/60">표시할 소식이 없어요.</p>}

        <ul className="border-t border-white/10">
              {sorted.map((item) => {
                const read = readIds.has(item.id)
                const title = item.lang === 'en' && item.titleKo ? item.titleKo : item.title
                return (
                  <li key={item.id} className="flex items-start gap-3 border-b border-white/10 py-3">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onRead(item.id)}
                      className={`flex min-w-0 flex-1 gap-3 ${read ? 'opacity-50' : ''}`}
                    >
                      {/* 섬네일이 없거나 못 불러오면 과목 이름 칸으로 */}
                      <span
                        className={`relative flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold ${SUBJECT[item.subject].accent}`}
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
                        <span className="line-clamp-2 break-keep text-[15px] font-semibold leading-snug">
                          {isNew(item) && !read && (
                            <span className="mr-1.5 inline-block h-2 w-2 -translate-y-0.5 rounded-full bg-yellow-300" />
                          )}
                          {item.kind === 'video' && '▶ '}
                          {title}
                        </span>
                        <span className="mt-1 block text-xs text-white/50">
                          <span className={`font-semibold ${SUBJECT[item.subject].accent}`}>{SUBJECT[item.subject].name}</span>
                          {item.category !== '인기' && ` · ${item.category}`}
                          {' · '}
                          {item.source}
                          {item.views && ` · 조회 ${formatViews(item.views)}`}
                          {item.lang === 'en' && ' · 번역'}
                          {now && !item.evergreen && ` · ${timeAgo(item.publishedAt, now)}`}
                        </span>
                      </span>
                    </a>
                    <button
                      onClick={() => onSave(item.id)}
                      aria-label="저장"
                      aria-pressed={savedIds.has(item.id)}
                      className={`-mr-2 min-h-[44px] min-w-[44px] text-xl ${
                        savedIds.has(item.id) ? 'text-yellow-300' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {savedIds.has(item.id) ? '★' : '☆'}
                    </button>
                  </li>
                )
              })}
        </ul>

        <p className="pt-6 text-center text-[13px] text-white/40">
          <Link href="/about/" className="underline hover:text-white">
            사이트 소개 · 출처와 저작권 · 개인정보
          </Link>
        </p>
      </div>
    </div>
  )
}
