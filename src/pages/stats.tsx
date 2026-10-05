import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import SiteMeta from '@/components/SiteMeta'
import { Stats, readStats } from '@/lib/stats'

const BAR = '#34d399' // 사이트의 초록 (방문자 한 계열만 그리므로 범례 없이 제목이 계열 이름)
const CHART_HEIGHT = 160

function Tile({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-white/[0.05] p-4">
      <p className="text-[13px] font-semibold text-white/55">{label}</p>
      <p className="mt-1 text-[28px] font-extrabold tabular-nums leading-none">{value === null ? '–' : value.toLocaleString('ko-KR')}</p>
    </div>
  )
}

// 최근 14일 방문자: 막대 하나에 하루. 막대에 손가락·마우스를 대면 그날 숫자가 뜸
function VisitorChart({ days }: { days: Stats['days'] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(1, ...days.map((d) => d.visitors))
  const shown = hover ?? days.length - 1 // 아무것도 안 가리킬 때는 오늘
  return (
    <figure className="rounded-2xl bg-white/[0.05] p-4">
      <figcaption className="flex items-baseline justify-between">
        <span className="text-[15px] font-bold">최근 14일 방문자</span>
        <span className="text-[13px] text-white/60">
          {days[shown].label} · <b className="text-white">{days[shown].visitors.toLocaleString('ko-KR')}명</b>
        </span>
      </figcaption>
      <div className="relative mt-4" style={{ height: CHART_HEIGHT }} onMouseLeave={() => setHover(null)}>
        {/* 가장 큰 값 기준선 하나만 옅게 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-white/10" />
        <span className="pointer-events-none absolute -top-4 right-0 text-[11px] text-white/45">{max}명</span>
        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-white/25">
          {days.map((d, i) => (
            <button
              key={d.day}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              onClick={() => setHover(i)}
              aria-label={`${d.label} 방문자 ${d.visitors}명`}
              className="flex h-full flex-1 items-end outline-none"
            >
              <span
                className="w-full rounded-t-[4px] transition-opacity"
                style={{
                  height: `${(d.visitors / max) * 100}%`,
                  minHeight: d.visitors ? 2 : 0,
                  background: BAR,
                  opacity: hover === null || hover === i ? 1 : 0.45,
                }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-white/45">
        <span>{days[0].label}</span>
        <span>오늘</span>
      </div>
    </figure>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    readStats()
      .then(setStats)
      .catch(() => setFailed(true))
  }, [])

  const today = stats?.days[stats.days.length - 1]

  return (
    <>
      <SiteMeta title="방문 통계" path="/stats/" />
      <div className="min-h-screen bg-[#08090b] text-white [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center text-[15px] font-bold text-white/70 hover:text-white">
            ← 피드로 돌아가기
          </Link>
          <h1 className="pt-2 text-[24px] font-extrabold">방문 통계</h1>
          <p className="mt-1 break-keep text-[14px] text-white/60">
            방문자는 한 브라우저당 하루 한 번, 조회는 사이트를 열 때마다 셉니다. 2026년 10월 5일부터 세기 시작했습니다.
          </p>

          {failed && <p className="mt-6 text-amber-300">통계를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Tile label="오늘 방문자" value={today?.visitors ?? null} />
            <Tile label="오늘 조회" value={today?.views ?? null} />
            <Tile label="누적 방문자" value={stats?.totalVisitors ?? null} />
            <Tile label="누적 조회" value={stats?.totalViews ?? null} />
          </div>

          {stats && (
            <>
              <div className="mt-3">
                <VisitorChart days={stats.days} />
              </div>

              <table className="mt-5 w-full text-[14px] tabular-nums">
                <caption className="pb-2 text-left text-[15px] font-bold">날짜별</caption>
                <thead>
                  <tr className="border-b border-white/15 text-white/55">
                    <th className="py-2 text-left font-semibold">날짜</th>
                    <th className="py-2 text-right font-semibold">방문자</th>
                    <th className="py-2 text-right font-semibold">조회</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.days].reverse().map((d, i) => (
                    <tr key={d.day} className="border-b border-white/10">
                      <td className="py-2 text-white/75">{i === 0 ? `${d.label} (오늘)` : d.label}</td>
                      <td className="py-2 text-right">{d.visitors.toLocaleString('ko-KR')}</td>
                      <td className="py-2 text-right text-white/75">{d.views.toLocaleString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  )
}
