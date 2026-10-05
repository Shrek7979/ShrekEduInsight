import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import SiteMeta from '@/components/SiteMeta'
import { CONTACT, SITE_NAME, SUBJECTS, TAGLINE, editionLabel, timeAgo } from '@/lib/feed'
import { SubjectStatus, fetchStatus, siteUrl } from '@/lib/sources'

// 과목 사이트가 이 시간보다 오래 업데이트되지 않았으면 '지연'으로 표시
const STALE_HOURS = 3

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-white/10 py-6">
      <h2 className="text-[19px] font-bold">{title}</h2>
      <div className="mt-3 space-y-3 break-keep text-[15px] leading-relaxed text-white/75">{children}</div>
    </section>
  )
}

export default function AboutPage() {
  const [status, setStatus] = useState<SubjectStatus[] | null>(null)
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    fetchStatus().then(setStatus)
  }, [])

  return (
    <>
      <SiteMeta title="소개" path="/about/" />
      <div className="min-h-screen bg-neutral-950 text-white [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto max-w-2xl px-4 pb-16 pt-3">
          <Link href="/" className="inline-flex min-h-[44px] items-center text-[15px] font-bold text-white/70 hover:text-white">
            ← 피드로 돌아가기
          </Link>

          <header className="pb-6 pt-2">
            <h1 className="text-[26px] font-extrabold leading-tight">
              <span className="text-emerald-400">Shrek</span> Edu <span className="text-amber-300">Insight</span>
            </h1>
            <p className="mt-1 text-[17px] font-bold text-white/85">{TAGLINE}</p>
            <p className="mt-3 break-keep text-[15px] leading-relaxed text-white/70">
              수학·물리·화학·생명과학 선생님을 위한 교육 뉴스 피드입니다. 국내외 뉴스, 인기 영상, SNS 게시물, 수업에 바로 쓸 수
              있는 주제 카드를 1시간마다 모아 한 화면에서 넘겨 볼 수 있게 했습니다.
            </p>
          </header>

          <Section id="how" title="이용 방법">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <b className="text-white">릴스</b>는 카드를 한 장씩 넘겨 보고, <b className="text-white">한눈에</b>는 제목만 빠르게 훑어봅니다.
              </li>
              <li>위쪽 칩으로 과목(수학·물리·화학·생명과학)이나 분류(교육·입시·연구 등)를 고릅니다.</li>
              <li>
                <b className="text-white">검색</b>을 누르면 낱말로 찾거나 학교급(초등·중등·고등)으로 거를 수 있습니다.
              </li>
              <li>☆ 를 누르면 저장되고, ‘★ 저장’ 칩에서 다시 볼 수 있습니다. 공유는 제목·한 줄 설명·링크를 함께 보냅니다.</li>
              <li>주제 카드는 좌우로 넘기는 카드뉴스이고, ⤓ 로 지금 장면을 그림 파일로 저장해 학습지에 쓸 수 있습니다.</li>
              <li>컴퓨터에서는 ↑↓ 키로 넘기고 스페이스로 자동 넘김을 켭니다. 사이트 이름을 누르면 처음 화면으로 돌아갑니다.</li>
              <li>휴대폰에서는 브라우저 메뉴의 ‘홈 화면에 추가’로 앱처럼 쓸 수 있습니다.</li>
            </ul>
          </Section>

          <Section id="status" title="과목별 업데이트 상태">
            <p>각 과목 소식은 과목 사이트가 1시간마다 모으고, 이 사이트는 열 때마다 그 최신 내용을 가져옵니다.</p>
            <ul className="divide-y divide-white/10 rounded-2xl bg-white/[0.04]">
              {SUBJECTS.map((subject) => {
                const s = status?.find((x) => x.subject.key === subject.key)
                const stale = s?.updatedAt ? now - new Date(s.updatedAt).getTime() > STALE_HOURS * 3600_000 : false
                return (
                  <li key={subject.key} className="flex items-center gap-3 px-4 py-3">
                    <span className={`w-16 shrink-0 font-bold ${subject.accent}`}>{subject.name}</span>
                    <span className="min-w-0 flex-1 text-[14px] text-white/60">
                      {!status
                        ? '확인 중…'
                        : !s?.ok
                          ? '불러오지 못함'
                          : s.updatedAt
                            ? `${editionLabel(s.updatedAt)} (${timeAgo(s.updatedAt, now)}) · 기사 ${s.count}건`
                            : '아직 수집 전'}
                    </span>
                    {status && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold ${
                          s?.ok && !stale ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-300/15 text-amber-300'
                        }`}
                      >
                        {s?.ok && !stale ? '정상' : '지연'}
                      </span>
                    )}
                    <a href={`${siteUrl(subject)}/`} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[13px] font-bold text-white/60 underline hover:text-white">
                      과목 사이트
                    </a>
                  </li>
                )
              })}
            </ul>
          </Section>

          <Section id="copyright" title="출처와 저작권">
            <p>
              이 사이트는 기사·영상·게시물의 <b className="text-white">제목, 짧은 설명, 대표 이미지와 원문 링크</b>만 보여 줍니다. 본문은
              ‘원문 보기’를 눌러 원래 사이트에서 읽어 주세요. 각 콘텐츠의 저작권은 해당 언론사·기관·게시자에게 있습니다.
            </p>
            <p>해외 기사의 제목과 설명은 자동 번역이라 뜻이 조금 다를 수 있습니다. 정확한 내용은 원문을 확인해 주세요.</p>
            <p>권리자가 게시 중단을 원하시면 아래 문의로 알려 주시면 바로 내리겠습니다.</p>
          </Section>

          <Section id="privacy" title="개인정보">
            <ul className="list-disc space-y-2 pl-5">
              <li>회원가입·로그인이 없고, 이름이나 연락처 같은 개인정보를 받지 않습니다.</li>
              <li>
                방문자 수를 세려고, 사이트를 열 때 숫자만 올리는 무료 카운터(Abacus)를 씁니다. 이름·IP 주소 같은 개인정보는 보내지 않고,
                쿠키나 광고·추적 도구도 쓰지 않습니다. 오늘 이미 방문했는지는 이 기기의 브라우저에만 기록합니다.{' '}
                <Link href="/stats/" className="font-bold text-white underline">
                  방문 통계 보기
                </Link>
              </li>
              <li>저장한 카드, 읽은 카드, 마지막으로 고른 보기는 이 기기의 브라우저에만 저장되며 어디에도 전송되지 않습니다.</li>
              <li>섬네일 그림은 원래 사이트에서 직접 불러오므로, 그 사이트에 일반적인 접속 기록이 남을 수 있습니다.</li>
            </ul>
          </Section>

          <Section id="contact" title="문의">
            {CONTACT ? (
              <p>
                고칠 점, 추가했으면 하는 출처, 게시 중단 요청은{' '}
                <a href={`mailto:${CONTACT}`} className="font-bold text-white underline">
                  {CONTACT}
                </a>
                로 보내 주세요.
              </p>
            ) : (
              <p>고칠 점이나 게시 중단 요청은 운영자에게 직접 알려 주세요.</p>
            )}
          </Section>

          <p className="border-t border-white/10 pt-6 text-[13px] text-white/40">© {new Date().getFullYear()} {SITE_NAME}</p>
        </div>
      </div>
    </>
  )
}
