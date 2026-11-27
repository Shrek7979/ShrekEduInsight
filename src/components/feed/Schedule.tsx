import React, { useEffect, useRef, useState } from 'react'
import { UpcomingEvent, upcomingEvents } from '@/lib/schedule'

const TAG_COLOR: Record<UpcomingEvent['tag'], string> = {
  입시: '#fbbf24',
  학교: '#34d399',
  대회: '#38bdf8',
  수학: '#e879f9',
}

function Row({ event }: { event: UpcomingEvent }) {
  return (
    <li>
      <a
        href={event.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.06]"
      >
        <span
          className={`w-[62px] shrink-0 rounded-lg py-1 text-center text-[12px] font-extrabold tabular-nums ${
            event.soon ? 'bg-amber-300 text-neutral-900' : 'bg-white/[0.07] text-white/80'
          }`}
        >
          {event.badge}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-keep text-[14px] font-bold leading-snug">{event.title}</span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-white/45">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TAG_COLOR[event.tag] }} />
            <span className="truncate">
              {event.tag} · {event.when}
              {event.note && ` · ${event.note}`}
            </span>
          </span>
        </span>
      </a>
    </li>
  )
}

// 헤더 오른쪽: 가장 가까운 일정 하나. 누르면 앞으로의 일정 목록이 펼쳐짐
export function ScheduleButton({ now }: { now: number | null }) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  if (!now) return null
  const events = upcomingEvents(now)
  if (events.length === 0) return null
  const next = events[0]

  return (
    <div ref={boxRef} className="relative min-w-0 shrink">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="다가오는 일정"
        className="flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-1 pr-2.5 text-[12px] font-bold transition hover:bg-white/[0.12]"
      >
        <span className={`shrink-0 rounded-full px-1.5 py-px tabular-nums ${next.soon ? 'bg-amber-300 text-neutral-900' : 'bg-white/15 text-white'}`}>
          {next.badge}
        </span>
        <span className="truncate text-white/80">{next.title}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#121317]/95 p-2 shadow-2xl backdrop-blur-xl">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40">다가오는 일정</p>
          <ul>
            {events.map((event) => (
              <Row key={event.title + event.when} event={event} />
            ))}
          </ul>
          <p className="px-2.5 pb-1.5 pt-2 text-[11px] leading-relaxed text-white/35">
            누르면 공식 안내 페이지로 갑니다. 날짜가 발표되지 않은 일정은 &lsquo;O월 중&rsquo;으로 표시해요.
          </p>
        </div>
      )}
    </div>
  )
}

// 한눈에 보기 맨 위: 가까운 일정 4개
export function ScheduleList({ now }: { now: number | null }) {
  if (!now) return null
  const events = upcomingEvents(now, 4)
  if (events.length === 0) return null
  return (
    <section className="mb-5 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-2.5">
      <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">Upcoming</p>
      <ul>
        {events.map((event) => (
          <Row key={event.title + event.when} event={event} />
        ))}
      </ul>
    </section>
  )
}
