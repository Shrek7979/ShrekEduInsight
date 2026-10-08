import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { FeedItem, SUBJECT, SubjectKey, Topic, formatDate, formatViews } from '@/lib/feed'
import { saveTopicImage } from '@/lib/topicImage'
import { ArrowIcon, DownloadIcon, ExternalIcon, PlayIcon, ShareIcon, StarIcon } from '@/components/icons'
import TopicVisual, { hasTopicVisual } from './TopicVisual'

// 카드 바탕은 모두 같은 어두운 면. 과목은 배지의 점과 글자 색으로만 구분해 읽는 데 집중하게 함
function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className="h-full snap-start snap-always sm:py-2.5">
      <div className={`card-surface flex h-full flex-col overflow-hidden sm:rounded-[28px] ${className}`}>{children}</div>
    </section>
  )
}

// 섬네일 위에 얹는 과목 배지 (반투명 유리 느낌)
function SubjectBadge({ subject, extra }: { subject: SubjectKey; extra?: string }) {
  const s = SUBJECT[subject]
  return (
    <span className="absolute left-3 top-3 z-[1] inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[12px] font-bold text-white backdrop-blur-md">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
      {s.name}
      {extra && <span className="font-semibold text-white/60">· {extra}</span>}
    </span>
  )
}

// "교육 · 충남일보 · 10. 2. (금)" 한 줄
function MetaLine({ subject, details, isNew }: { subject: SubjectKey; details: string[]; isNew?: boolean }) {
  const [first, ...rest] = details
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-[13px] font-semibold tracking-tight">
      {isNew && <span className="mr-0.5 rounded-md bg-amber-300 px-1.5 py-px text-[10.5px] font-extrabold tracking-wide text-neutral-900">NEW</span>}
      {first && <span className={SUBJECT[subject].accent}>{first}</span>}
      {rest.map((detail) => (
        <span key={detail} className="text-white/45">
          · {detail}
        </span>
      ))}
    </p>
  )
}

function IconButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`flex min-h-[50px] min-w-[50px] items-center justify-center rounded-2xl border transition active:scale-95 ${
        active
          ? 'border-amber-300/40 bg-amber-300/15 text-amber-300'
          : 'border-white/10 bg-white/[0.06] text-white/85 hover:border-white/20 hover:bg-white/[0.12]'
      }`}
    >
      {children}
    </button>
  )
}

const primaryClass =
  'flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-bold text-neutral-900 shadow-[0_6px_20px_-6px_rgba(255,255,255,0.35)] transition hover:bg-white/90 active:scale-[0.98]'

// 섬네일이 없을 때: 과목 색 바탕에 제목을 크게 쓴 글자 섬네일
function TitleThumb({ item, title }: { item: FeedItem; title: string }) {
  const subject = SUBJECT[item.subject]
  return (
    <div
      className="flex h-full flex-col justify-center px-7 pt-6"
      style={{ background: `radial-gradient(120% 90% at 0% 0%, ${subject.color}40, transparent 60%), linear-gradient(160deg, ${subject.color}1f, #0f1013 75%)` }}
    >
      <p className="line-clamp-4 break-keep text-[1.45rem] font-extrabold leading-snug tracking-tight [text-wrap:balance]">{title}</p>
    </div>
  )
}

// 섬네일: 카드 위쪽 42% 를 차지
// 과목 사이트의 섬네일 → 원문 기사 이미지 → 제목 글자 섬네일 순서로 대체
function Thumbnail({ item, title, eager }: { item: FeedItem; title: string; eager?: boolean }) {
  const sources = [item.thumb, item.image].filter(Boolean) as string[]
  const [index, setIndex] = useState(0)
  const hasImage = index < sources.length
  // 사진·섬네일을 잘라 내면 좁은 폰 화면에서 글자나 얼굴이 잘림 → 항상 그림 전체를 보여 줌.
  // 남는 자리는 같은 그림을 흐리게 깔아 채워 띠처럼 보이지 않게 함
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer" className="relative block h-[42%] max-h-[420px] min-h-[140px] shrink-0 overflow-hidden bg-[#0f1013]">
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sources[index]} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" referrerPolicy="no-referrer" loading={eager ? 'eager' : 'lazy'} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={sources[index]}
            src={sources[index]}
            alt=""
            className="relative h-full w-full object-contain"
            // 첫 화면의 그림은 바로, 나머지는 넘겨 볼 때 불러옴
            loading={eager ? 'eager' : 'lazy'}
            referrerPolicy="no-referrer"
            onError={() => setIndex((i) => i + 1)}
            // 아이콘만 한 작은 그림은 크게 늘리면 뭉개짐 → 다음 후보로
            onLoad={(e) => e.currentTarget.naturalWidth < 200 && setIndex((i) => i + 1)}
          />
        </>
      ) : (
        <TitleThumb item={item} title={title} />
      )}
      {/* 아래쪽을 카드 바탕색으로 자연스럽게 이어 줌 */}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#111215] to-transparent" />
      <SubjectBadge subject={item.subject} />
      {item.kind === 'video' && (
        <span className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/50 pl-1 text-white backdrop-blur-md">
          <PlayIcon className="h-7 w-7" />
        </span>
      )}
    </a>
  )
}

type NewsCardProps = {
  item: FeedItem
  isNew: boolean
  saved: boolean
  onSave: () => void
  onShare: () => void
  eager?: boolean
}

export function NewsCard({ item, isNew, saved, onSave, onShare, eager }: NewsCardProps) {
  const isVideo = item.kind === 'video'
  const translated = item.lang === 'en' && item.titleKo
  const title = translated ? item.titleKo! : item.title
  // 긴 설명(2~3줄)이 있으면 그것을, 없으면 한 줄 설명
  const summary = translated ? item.detailKo || item.summaryKo || item.summary : item.detail || item.summary
  const details = [
    item.category !== '인기' ? item.category : '인기',
    item.source,
    !item.evergreen && formatDate(item.publishedAt),
    item.views && `조회 ${formatViews(item.views)}`,
    item.likes && `좋아요 ${item.likes}`,
    item.lang === 'en' && (translated ? (item.translator === 'claude' ? '번역' : '자동 번역') : '영문'),
  ].filter(Boolean) as string[]

  return (
    <CardShell>
      <Thumbnail item={item} title={title} eager={eager} />

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-3">
        <MetaLine subject={item.subject} details={details} isNew={isNew} />

        <div className="mt-2 min-h-0 flex-1 overflow-hidden">
          <h2 className="line-clamp-3 break-keep text-[1.5rem] font-bold leading-[1.36] tracking-[-0.02em] [text-wrap:balance]">{title}</h2>
          {translated && <p className="mt-1.5 line-clamp-1 text-[13px] text-white/35">{item.title}</p>}
          {summary && (
            <p className={`mt-3 break-keep text-[15px] leading-relaxed text-white/60 ${item.lesson ? 'line-clamp-2' : 'line-clamp-3'}`}>{summary}</p>
          )}
          {item.lesson && (
            <p className="mt-3 line-clamp-3 break-keep rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-[14px] leading-relaxed text-white/75">
              <span className="mr-1.5 font-semibold text-amber-300">💡 수업 활용</span>
              {item.lesson}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <a href={item.link} target="_blank" rel="noopener noreferrer" className={primaryClass}>
            {isVideo ? <PlayIcon className="h-4 w-4" /> : <ExternalIcon className="h-4 w-4" />}
            {isVideo ? '영상 보기' : item.evergreen ? `${item.source}에서 보기` : '원문 보기'}
          </a>
          <IconButton onClick={onSave} active={saved} label={saved ? '저장 취소' : '저장'}>
            <StarIcon filled={saved} />
          </IconButton>
          <IconButton onClick={onShare} label="공유">
            <ShareIcon />
          </IconButton>
        </div>
      </div>
    </CardShell>
  )
}

// 주제 카드: 좌우로 넘기는 카드뉴스
export function TopicCard({ topic, saved, onSave }: { topic: Topic; saved: boolean; onSave: () => void }) {
  const slidesRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const last = topic.slides.length - 1
  const animated = hasTopicVisual(topic)
  const color = SUBJECT[topic.subject].color

  const goTo = (index: number) => {
    const el = slidesRef.current
    if (el) el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' })
  }

  return (
    <CardShell className="topic-card">
      {animated && (
        <div
          ref={visualRef}
          className="topic-visual relative h-[30%] max-h-[300px] min-h-[130px] shrink-0 px-2 pt-2"
          style={{ background: `radial-gradient(90% 120% at 50% 0%, ${color}26, transparent 70%), #1e1b4b` }}
        >
          <SubjectBadge subject={topic.subject} extra="주제 카드" />
          <TopicVisual topic={topic} />
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-4">
        <MetaLine subject={topic.subject} details={animated ? [topic.tag] : [`${SUBJECT[topic.subject].name} 주제`, topic.tag]} />
        <h2 className="topic-title mt-1.5 break-keep text-[1.3rem] font-bold leading-[1.3] tracking-[-0.02em] [text-wrap:balance]">{topic.title}</h2>

        <div
          ref={slidesRef}
          onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar -mx-5 mt-3 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
        >
          {topic.slides.map((s, i) => (
            <div key={i} className="w-full shrink-0 snap-center px-5">
              {/* 설명은 위에서부터 채움. 본문의 빈 줄은 문단으로 나눔 */}
              <div className="no-scrollbar h-full overflow-y-auto rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                <h3 className="topic-slide-heading break-keep text-[17px] font-bold leading-snug" style={{ color }}>
                  {s.heading}
                </h3>
                {s.body.split(/\n{2,}/).map((paragraph, k) => (
                  <p key={k} className="topic-slide-text mt-2 whitespace-pre-line break-keep text-[14px] leading-[1.65] text-white/75">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          {topic.slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6' : 'w-1.5 bg-white/25'}`}
              style={i === slide ? { background: color } : undefined}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <IconButton onClick={() => goTo(slide - 1)} label="이전 슬라이드">
            <ArrowIcon dir="left" />
          </IconButton>
          <button onClick={() => goTo(slide === last ? 0 : slide + 1)} className={primaryClass}>
            {slide === last ? '처음으로' : '다음'}
            {slide !== last && <ArrowIcon dir="right" className="h-4 w-4" />}
          </button>
          <IconButton onClick={onSave} active={saved} label={saved ? '저장 취소' : '저장'}>
            <StarIcon filled={saved} />
          </IconButton>
          {/* 지금 보이는 그림과 설명을 PNG 한 장으로 저장 (학습지·수업 자료용) */}
          <IconButton onClick={() => saveTopicImage(topic, slide, visualRef.current?.querySelector('svg') ?? null)} label="이미지로 저장">
            <DownloadIcon />
          </IconButton>
        </div>
      </div>
    </CardShell>
  )
}

export function EndCard({ onRestart, empty }: { onRestart: () => void; empty: boolean }) {
  return (
    <section className="h-full snap-start sm:py-2.5">
      <div className="card-surface flex h-full flex-col items-center justify-center gap-4 p-8 text-center sm:rounded-[28px]">
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-amber-300/80">{empty ? 'Empty' : 'The End'}</p>
        <h2 className="text-[26px] font-extrabold tracking-tight">{empty ? '아직 카드가 없어요' : '오늘 소식은 여기까지'}</h2>
        <p className="break-keep leading-relaxed text-white/55">{empty ? '다른 칩을 골라 보세요.' : '1시간마다 새 카드가 들어옵니다.'}</p>
        {!empty && (
          <button onClick={onRestart} className="mt-2 flex min-h-[50px] items-center gap-2 rounded-2xl bg-white px-6 font-bold text-neutral-900">
            <ArrowIcon dir="up" className="h-4 w-4" />
            처음부터 다시 보기
          </button>
        )}
        <Link href="/about/" className="mt-3 text-[13px] font-semibold text-white/45 underline-offset-4 hover:text-white hover:underline">
          사이트 소개 · 출처와 저작권
        </Link>
      </div>
    </section>
  )
}
