import React from 'react'
import { Caption, WHITE, YELLOW, ramp, useLoop } from '../../topicVisualKit'

// 물리 주제 카드 위쪽에 들어가는 움직이는 그림.
// 모든 그림은 "시간 t(초)의 함수"로만 그려서, 나중에 같은 화면을 영상으로 찍어내기도 쉽게 함.

const BLUE = '#60a5fa'
const RED = '#f87171'
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const smooth = (p: number) => p * p * (3 - 2 * p)
// 번호마다 늘 같은 값이 나오는 0~1 난수 (입자 위치를 흩뿌릴 때 사용)
// 정수 연산만 써서 서버와 브라우저에서 값이 정확히 같게 함
const rnd = (i: number) => {
  let h = Math.imul(i + 1, 0x9e3779b1)
  h ^= h >>> 15
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}
// 삼각함수 결과는 환경마다 끝자리가 달라질 수 있어 소수 첫째 자리로 맞춤
const round1 = (x: number) => Math.round(x * 10) / 10
const DEG = Math.PI / 180

// ── 자유 낙하: 지구에서는 깃털이 늦고, 달에서는 함께 떨어짐 ─────────────────────
const DROP_TOP = 100
const GROUND = 196

function Hammer({ x, y }: { x: number; y: number }) {
  // (x, y) 는 망치의 아래 끝
  return (
    <g>
      <rect x={x - 3} y={y - 44} width={6} height={44} rx={2} fill="#d6a46a" />
      <rect x={x - 15} y={y - 52} width={30} height={13} rx={3} fill="#cbd5e1" />
    </g>
  )
}

function Feather({ x, y, tilt }: { x: number; y: number; tilt: number }) {
  return (
    <g transform={`rotate(${round1(tilt)} ${round1(x)} ${round1(y - 26)})`}>
      <path d={`M${round1(x)} ${y} C${round1(x - 11)} ${y - 18} ${round1(x - 9)} ${y - 40} ${round1(x)} ${y - 54} C${round1(x + 9)} ${y - 40} ${round1(x + 11)} ${y - 18} ${round1(x)} ${y} Z`} fill={WHITE} fillOpacity={0.9} />
      <line x1={round1(x)} y1={y + 4} x2={round1(x)} y2={y - 50} stroke="#94a3b8" strokeWidth={1.5} />
    </g>
  )
}

function FreeFall() {
  const { ref, t } = useLoop(12)
  const moon = t >= 6
  const s = moon ? t - 6 : t
  // 공기가 없으면 떨어진 거리가 시간의 제곱에 비례
  const fall = (start: number, duration: number) => lerp(DROP_TOP, GROUND, ramp(s, start, start + duration) ** 2)
  const hammerY = moon ? fall(1, 2.2) : fall(1, 0.9)
  const featherP = ramp(s, 1, 5)
  const featherY = moon ? hammerY : lerp(DROP_TOP, GROUND, featherP)
  const sway = moon || featherP <= 0 || featherP >= 1 ? 0 : Math.sin((s - 1) * 3.2) * 16
  const caption = moon ? (s < 3.4 ? '달: 공기가 없으면?' : '망치와 깃털이 동시에 닿는다') : s < 2 ? '지구: 망치가 먼저 떨어지고' : '깃털은 공기 때문에 하늘하늘'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <text x={200} y={28} textAnchor="middle" fontSize={15} fontWeight={800} fill={moon ? YELLOW : WHITE}>
        {moon ? '달 · 공기 없음 · g = 1.62 m/s²' : '지구 · 공기 있음 · g = 9.8 m/s²'}
      </text>
      {moon ? (
        <>
          <rect x={30} y={GROUND} width={340} height={12} fill="#9ca3af" fillOpacity={0.5} />
          <ellipse cx={90} cy={GROUND + 4} rx={22} ry={4} fill="#4b5563" />
          <ellipse cx={320} cy={GROUND + 5} rx={30} ry={4} fill="#4b5563" />
        </>
      ) : (
        <rect x={30} y={GROUND} width={340} height={12} fill="#22c55e" fillOpacity={0.5} />
      )}
      <Hammer x={150} y={hammerY} />
      <Feather x={250 + sway} y={featherY} tilt={sway * 1.2} />
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 뉴턴의 요람: 1개를 당기면 1개, 2개를 당기면 2개 ─────────────────────────────
const CRADLE_TOP = 26
const STRING = 128
const BALL = 16

function Cradle() {
  const { ref, t } = useLoop(12)
  const pulled = t < 6 ? 1 : 2
  // 진자 하나의 각도. 음수일 때는 왼쪽 공들이, 양수일 때는 오른쪽 공들이 흔들림
  const swing = 0.55 * Math.cos(Math.PI * t)
  const caption = t < 3 ? '공 1개를 당겼다 놓으면' : t < 6 ? '반대쪽 1개만 같은 높이로' : t < 9 ? '2개를 당기면 2개가' : '운동량 + 운동 에너지 보존'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <rect x={90} y={CRADLE_TOP - 8} width={220} height={8} rx={4} fill={WHITE} fillOpacity={0.6} />
      {Array.from({ length: 5 }, (_, i) => {
        const x0 = 136 + i * BALL * 2
        const angle = i < pulled ? Math.min(0, swing) : i >= 5 - pulled ? Math.max(0, swing) : 0
        const x = round1(x0 + STRING * Math.sin(angle))
        const y = round1(CRADLE_TOP + STRING * Math.cos(angle))
        return (
          <g key={i}>
            <line x1={x0} y1={CRADLE_TOP} x2={x} y2={y} stroke={WHITE} strokeOpacity={0.5} strokeWidth={1.5} />
            <circle cx={x} cy={y} r={BALL} fill={angle !== 0 ? YELLOW : '#cbd5e1'} />
            <circle cx={x - 5} cy={y - 5} r={4} fill={WHITE} fillOpacity={0.6} />
          </g>
        )
      })}
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── GPS 와 상대성: 위성 시계는 하루 38 μs 빨리 감 ──────────────────────────────
function Relativity() {
  const { ref, t } = useLoop(12)
  const hours = Math.floor(24 * ramp(t, 0.5, 9))
  const angle = t * 0.9
  const sx = round1(92 + 74 * Math.cos(angle))
  const sy = round1(112 + 74 * Math.sin(angle))
  const caption = t < 2.5 ? 'GPS 위성: 고도 2만 km, 초속 3.9 km' : t < 6.5 ? '빠르면 느려지고, 중력이 약하면 빨라지고' : t < 9 ? '위성 시계는 하루 38 μs 빨리 간다' : '그래서 발사 전에 일부러 느리게 맞춘다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <circle cx={92} cy={112} r={74} fill="none" stroke={WHITE} strokeOpacity={0.3} strokeDasharray="4 5" />
      <circle cx={92} cy={112} r={38} fill={BLUE} fillOpacity={0.55} />
      <path d="M70 96 Q84 86 96 100 T118 108 M74 126 Q90 120 102 132" fill="none" stroke="#86efac" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <g transform={`translate(${sx} ${sy})`}>
        <rect x={-6} y={-6} width={12} height={12} rx={2} fill={YELLOW} />
        <rect x={-20} y={-3} width={12} height={6} fill={BLUE} />
        <rect x={8} y={-3} width={12} height={6} fill={BLUE} />
      </g>

      <text x={297} y={38} textAnchor="middle" fontSize={15} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        {hours}시간 경과
      </text>
      <g opacity={ramp(t, 2.5, 3)}>
        <text x={210} y={76} fontSize={14} fontWeight={700} fill={WHITE} fillOpacity={0.85}>
          속도 효과 (특수)
        </text>
        <text x={384} y={76} textAnchor="end" fontSize={15} fontWeight={800} fill={RED}>
          −7 μs
        </text>
      </g>
      <g opacity={ramp(t, 4.5, 5)}>
        <text x={210} y={102} fontSize={14} fontWeight={700} fill={WHITE} fillOpacity={0.85}>
          중력 효과 (일반)
        </text>
        <text x={384} y={102} textAnchor="end" fontSize={15} fontWeight={800} fill="#86efac">
          +45 μs
        </text>
      </g>
      <g opacity={ramp(t, 6.5, 7)}>
        <line x1={210} y1={114} x2={384} y2={114} stroke={WHITE} strokeOpacity={0.4} />
        <text x={210} y={142} fontSize={15} fontWeight={800} fill={YELLOW}>
          하루 합계
        </text>
        <text x={384} y={144} textAnchor="end" fontSize={26} fontWeight={800} fill={YELLOW}>
          +38 μs
        </text>
      </g>
      <text x={297} y={180} textAnchor="middle" fontSize={14} fontWeight={800} fill={WHITE} opacity={ramp(t, 9, 9.5)}>
        안 고치면 하루 약 11 km 오차
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 핵융합: 수소 핵 4개 → 헬륨 핵 1개 + 에너지 ───────────────────────────────
const NUCLEONS: [number, number, number, number, boolean][] = [
  // 시작 x, y → 모인 뒤 x, y, 중성자로 바뀌는지
  [44, 44, 120, 100, false],
  [216, 44, 140, 100, true],
  [44, 176, 120, 120, true],
  [216, 176, 140, 120, false],
]

function Fusion() {
  const { ref, t } = useLoop(12)
  const p = smooth(ramp(t, 1, 4))
  const flash = ramp(t, 4, 4.3) * (1 - ramp(t, 4.6, 5.6))
  const rays = ramp(t, 4.2, 5)
  const caption = t < 4 ? '태양 중심, 1500만 K 의 핵융합' : t < 7.5 ? '수소 핵 4개 → 헬륨 핵 1개' : '사라진 질량 0.7% → E = mc²'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <g opacity={rays * (0.5 + 0.5 * Math.abs(Math.sin(t * 4)))}>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i * 36 + 18) * DEG
          return (
            <line
              key={i}
              x1={round1(130 + 34 * Math.cos(a))}
              y1={round1(110 + 34 * Math.sin(a))}
              x2={round1(130 + 70 * Math.cos(a))}
              y2={round1(110 + 70 * Math.sin(a))}
              stroke={YELLOW}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )
        })}
      </g>
      <circle cx={130} cy={110} r={20 + flash * 50} fill={YELLOW} fillOpacity={flash * 0.7} />
      {NUCLEONS.map(([x0, y0, x1, y1, becomesNeutron], i) => {
        const neutron = becomesNeutron && t >= 4.2
        const x = lerp(x0, x1, p)
        const y = lerp(y0, y1, p)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={13} fill={neutron ? '#94a3b8' : RED} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1e1b4b">
              {neutron ? 'n' : 'p'}
            </text>
          </g>
        )
      })}

      <text x={310} y={52} textAnchor="middle" fontSize={14} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        수소 원자핵 4개
      </text>
      <text x={310} y={80} textAnchor="middle" fontSize={24} fontWeight={800} fill={WHITE}>
        4.029 u
      </text>
      <g opacity={ramp(t, 5, 5.5)}>
        <text x={310} y={116} textAnchor="middle" fontSize={14} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
          헬륨 원자핵
        </text>
        <text x={310} y={144} textAnchor="middle" fontSize={24} fontWeight={800} fill={WHITE}>
          4.002 u
        </text>
      </g>
      <text x={310} y={186} textAnchor="middle" fontSize={22} fontWeight={800} fill={YELLOW} opacity={ramp(t, 7.5, 8)}>
        E = mc²
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 수소 스펙트럼: 전자가 계단을 내려올 때 나오는 네 줄 ────────────────────────
// 에너지 준위 n 의 높이 (n = 2 가 바닥, 위로 갈수록 촘촘)
const levelY = (n: number) => round1(176 - ((3.4 - 13.6 / n ** 2) / 3.4) * 140)
const LINES: [number, number, string, string][] = [
  // 출발 준위, 파장(nm), 색, 이름
  [3, 656, '#ef4444', '빨강'],
  [4, 486, '#22d3ee', '청록'],
  [5, 434, '#6366f1', '파랑'],
  [6, 410, '#a855f7', '보라'],
]
const SLOT = 2.5
const specX = (nm: number) => 206 + ((nm - 400) / 300) * 176

function Spectrum() {
  const { ref, t } = useLoop(12)
  const index = Math.min(LINES.length - 1, Math.floor(t / SLOT))
  const s = t - index * SLOT
  const [from, nm, color, name] = LINES[index]
  const drop = smooth(ramp(s, 0.8, 1.3))
  const done = t >= 10

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {[2, 3, 4, 5, 6].map((n) => (
        <g key={n}>
          <line x1={40} y1={levelY(n)} x2={176} y2={levelY(n)} stroke={WHITE} strokeOpacity={0.55} strokeWidth={1.5} />
          {n <= 4 && (
            <text x={34} y={levelY(n) + 4} textAnchor="end" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
              n={n}
            </text>
          )}
        </g>
      ))}
      {LINES.map(([n, , c], i) =>
        i < index || (i === index && drop > 0) ? (
          <line key={i} x1={64 + i * 28} y1={levelY(n)} x2={64 + i * 28} y2={levelY(2)} stroke={c} strokeWidth={3} opacity={i === index && !done ? drop : 0.6} />
        ) : null
      )}
      {!done && <circle cx={64 + index * 28} cy={lerp(levelY(from), levelY(2), drop)} r={7} fill={BLUE} stroke={WHITE} strokeWidth={1.5} />}

      <rect x={200} y={92} width={188} height={56} rx={4} fill="#000" stroke={WHITE} strokeOpacity={0.3} />
      {LINES.map(([, wave, c], i) => (
        <g key={i} opacity={i < index || (i === index && drop >= 1) || done ? 1 : 0}>
          <rect x={specX(wave) - 2} y={94} width={4} height={52} fill={c} />
          <text x={specX(wave)} y={164} textAnchor="middle" fontSize={10} fontWeight={700} fill={c}>
            {wave}
          </text>
        </g>
      ))}
      <text x={294} y={60} textAnchor="middle" fontSize={16} fontWeight={800} fill={done ? YELLOW : color}>
        {done ? '수소의 지문' : `n=${from} → 2 : ${name} ${nm} nm`}
      </text>
      <Caption>{done ? '띄엄띄엄한 계단 = 띄엄띄엄한 빛' : '전자가 계단을 내려오며 빛을 낸다'}</Caption>
    </svg>
  )
}

// ── LED: 전자와 양공이 만나 빛이 됨 ───────────────────────────────────────────
const LED_COLORS: [string, string, string][] = [
  ['빨강', '#ef4444', '띠 간격 1.9 eV'],
  ['초록', '#22c55e', '띠 간격 2.3 eV'],
  ['파랑', '#3b82f6', '띠 간격 2.7 eV (GaN)'],
]

function Led() {
  const { ref, t } = useLoop(12)
  const [name, color, gap] = LED_COLORS[Math.min(2, Math.floor(t / 4))]

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <rect x={30} y={120} width={170} height={60} fill={BLUE} fillOpacity={0.2} stroke={BLUE} strokeOpacity={0.6} />
      <rect x={200} y={120} width={170} height={60} fill={RED} fillOpacity={0.15} stroke={RED} strokeOpacity={0.6} />
      <line x1={200} y1={116} x2={200} y2={184} stroke={YELLOW} strokeWidth={2} strokeDasharray="4 3" />
      {Array.from({ length: 6 }, (_, i) => {
        const p = (t * 0.45 + rnd(i)) % 1
        const fade = 1 - ramp(p, 0.85, 1)
        return (
          <g key={i}>
            <circle cx={round1(lerp(40, 196, p))} cy={round1(130 + rnd(i + 20) * 40)} r={5} fill={BLUE} opacity={fade} />
            <circle cx={round1(lerp(360, 204, p))} cy={round1(130 + rnd(i + 40) * 40)} r={5} fill="none" stroke={WHITE} strokeWidth={2} opacity={fade} />
          </g>
        )
      })}
      {Array.from({ length: 4 }, (_, k) => {
        // 접합면에서 위로 올라가는 빛 (물결선)
        const p = (t * 0.6 + k / 4) % 1
        const x = 200 + (k - 1.5) * 16
        const y = 110 - p * 76
        const wave = Array.from({ length: 9 }, (_, j) => `${j === 0 ? 'M' : 'L'}${round1(x + Math.sin(j * 1.4) * 4)} ${round1(y - j * 3)}`).join(' ')
        return <path key={k} d={wave} fill="none" stroke={color} strokeWidth={2.5} opacity={1 - p} />
      })}
      <text x={115} y={198} textAnchor="middle" fontSize={12} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        n형 (전자)
      </text>
      <text x={285} y={198} textAnchor="middle" fontSize={12} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        p형 (양공)
      </text>
      <text x={330} y={52} textAnchor="middle" fontSize={22} fontWeight={800} fill={color}>
        {name}
      </text>
      <text x={330} y={76} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        {gap}
      </text>
      <Caption>{t < 8 ? '전자와 양공이 만나 빛이 된다' : '파랑이 생기자 흰색 LED 가 완성'}</Caption>
    </svg>
  )
}

// ── 전자기 유도: 자석이 움직일 때만 바늘이 움직임 ───────────────────────────────
const MAGNET_OUT = 24
const MAGNET_IN = 226
const magnetX = (t: number) => {
  if (t < 2) return MAGNET_OUT
  if (t < 3.5) return lerp(MAGNET_OUT, MAGNET_IN, smooth(ramp(t, 2, 3.5)))
  if (t < 5) return MAGNET_IN
  if (t < 6.5) return lerp(MAGNET_IN, MAGNET_OUT, smooth(ramp(t, 5, 6.5)))
  if (t < 8) return MAGNET_OUT
  if (t < 11.5) return MAGNET_OUT + (90 * (1 - Math.cos((2 * Math.PI * (t - 8)) / 1.75))) / 2
  return MAGNET_OUT
}

function Induction() {
  const { ref, t } = useLoop(12)
  const x = round1(magnetX(t))
  // 바늘은 자석의 속도(자기장이 변하는 빠르기)에 비례
  const speed = (magnetX(t + 0.02) - magnetX(t - 0.02)) / 0.04
  const needle = Math.max(-55, Math.min(55, speed * 0.32))
  const caption = t < 2 ? '자석이 멈춰 있으면 전류 0' : t < 3.5 ? '넣는 순간 전류가 흐른다' : t < 5 ? '안에서 멈추면 다시 0' : t < 6.5 ? '빼면 반대 방향으로' : t < 8 ? '핵심은 자기장의 "변화"' : '빨리 움직일수록 바늘이 크게'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 검류계 */}
      <path d="M232 124 L232 92 M362 124 L362 92" stroke="#f59e0b" strokeWidth={2} fill="none" />
      <rect x={232} y={14} width={130} height={78} rx={10} fill={WHITE} fillOpacity={0.08} stroke={WHITE} strokeOpacity={0.5} />
      <path d="M257 76 A40 40 0 0 1 337 76" fill="none" stroke={WHITE} strokeOpacity={0.5} strokeWidth={2} />
      <text x={297} y={30} textAnchor="middle" fontSize={11} fontWeight={800} fill={WHITE} fillOpacity={0.7}>
        0
      </text>
      <line x1={297} y1={82} x2={round1(297 + 44 * Math.sin(needle * DEG))} y2={round1(82 - 44 * Math.cos(needle * DEG))} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" />
      <circle cx={297} cy={82} r={4} fill={YELLOW} />

      {/* 자석 */}
      <rect x={x} y={140} width={46} height={26} fill={BLUE} />
      <rect x={x + 46} y={140} width={46} height={26} fill={RED} />
      <text x={x + 23} y={158} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1e1b4b">
        S
      </text>
      <text x={x + 69} y={158} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1e1b4b">
        N
      </text>
      {/* 코일 */}
      {Array.from({ length: 9 }, (_, i) => (
        <ellipse key={i} cx={232 + i * 16.25} cy={153} rx={7} ry={30} fill="none" stroke="#f59e0b" strokeWidth={3} opacity={0.9} />
      ))}
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 광섬유: 지그재그로 갇힌 빛, 그리고 임계각 ───────────────────────────────────
const ZIGZAG = 'M14 120 L50 96 L110 144 L170 96 L230 144 L290 96 L350 144 L386 120'
const CRITICAL = 41.8

function Fiber() {
  const { ref, t } = useLoop(12)
  const second = t >= 6
  const theta = lerp(22, 62, smooth(ramp(t, 6.5, 10.5)))
  const total = theta > CRITICAL
  const len = 90
  const hx = 200
  const hy = 130
  const sin = Math.sin(theta * DEG)
  const cos = Math.cos(theta * DEG)
  // 굴절: 1.5 sinθ = sinφ
  const phi = total ? 0 : Math.asin(1.5 * sin)
  const caption = !second ? '벽에 닿을 때마다 빛이 모두 반사' : total ? '42°를 넘으면 모두 반사: 전반사' : '임계각보다 작으면 일부가 빠져나간다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {!second ? (
        <>
          <rect x={6} y={80} width={388} height={80} rx={14} fill={BLUE} fillOpacity={0.15} />
          <rect x={6} y={94} width={388} height={52} fill={BLUE} fillOpacity={0.3} />
          <path d={ZIGZAG} fill="none" stroke={RED} strokeWidth={3} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ramp(t, 0.5, 4.5)} />
          <text x={200} y={72} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
            클래딩 (굴절률 작음)
          </text>
          <text x={200} y={180} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
            코어 (굴절률 큼)
          </text>
        </>
      ) : (
        <>
          <rect x={20} y={hy} width={360} height={70} fill={BLUE} fillOpacity={0.3} />
          <line x1={20} y1={hy} x2={380} y2={hy} stroke={BLUE} strokeWidth={2} />
          <line x1={hx} y1={40} x2={hx} y2={200} stroke={WHITE} strokeOpacity={0.35} strokeDasharray="4 4" />
          <text x={30} y={122} fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
            공기
          </text>
          <text x={30} y={194} fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
            유리
          </text>
          <line x1={round1(hx - len * sin)} y1={round1(hy + len * cos)} x2={hx} y2={hy} stroke={RED} strokeWidth={3} />
          <line x1={hx} y1={hy} x2={round1(hx + len * sin)} y2={round1(hy + len * cos)} stroke={RED} strokeWidth={3} opacity={total ? 1 : 0.35} />
          {!total && <line x1={hx} y1={hy} x2={round1(hx + len * Math.sin(phi))} y2={round1(hy - len * Math.cos(phi))} stroke={RED} strokeWidth={3} opacity={0.8} />}
          <text x={330} y={70} textAnchor="middle" fontSize={26} fontWeight={800} fill={total ? YELLOW : WHITE}>
            {theta.toFixed(0)}°
          </text>
          <text x={330} y={92} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
            입사각 (임계각 42°)
          </text>
        </>
      )}
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 이중 슬릿: 전자가 하나씩 쌓여 줄무늬가 됨 ─────────────────────────────────
const SCREEN = { x: 262, y: 34, w: 118, h: 166 }
// 간섭 무늬의 밝기(확률)에 맞춰 미리 뽑아 둔 점 위치 [가로, 세로] (0~1)
const HITS = (() => {
  const hits: [number, number][] = []
  for (let k = 0; hits.length < 700; k++) {
    const y = rnd(k * 2) * 2 - 1
    const intensity = Math.cos(Math.PI * y * 3.5) ** 2 * Math.exp(-y * y * 1.6)
    if (rnd(k * 2 + 1) < intensity) hits.push([rnd(hits.length + 5000), (y + 1) / 2])
  }
  return hits
})()

function DoubleSlit() {
  const { ref, t } = useLoop(12)
  const count = Math.round(HITS.length * ramp(t, 0.5, 10) ** 1.6)
  const flight = (t * 2.5) % 1
  const caption = t < 3 ? '전자를 한 번에 하나씩 쏘면' : t < 6.5 ? '점이 아무렇게나 찍히는 것 같지만' : '쌓이면 간섭 줄무늬가 나타난다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <rect x={16} y={106} width={34} height={22} rx={4} fill={WHITE} fillOpacity={0.6} />
      <text x={33} y={146} textAnchor="middle" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
        전자총
      </text>
      <path d="M160 34 L160 100 M160 110 L160 124 M160 134 L160 200" stroke={WHITE} strokeWidth={5} />
      {t < 10.5 && <circle cx={round1(lerp(52, SCREEN.x, flight))} cy={117} r={3.5} fill={YELLOW} />}
      <rect x={SCREEN.x} y={SCREEN.y} width={SCREEN.w} height={SCREEN.h} fill="#000" stroke={WHITE} strokeOpacity={0.35} />
      {HITS.slice(0, count).map(([u, v], i) => (
        <circle key={i} cx={round1(SCREEN.x + 3 + u * (SCREEN.w - 6))} cy={round1(SCREEN.y + 3 + v * (SCREEN.h - 6))} r={1.6} fill="#7dd3fc" />
      ))}
      <text x={SCREEN.x + SCREEN.w / 2} y={26} textAnchor="middle" fontSize={12} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        전자 {count.toLocaleString('en-US')}개
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 광전 효과: 밝은 빨간빛은 못 하고, 희미한 자외선은 해냄 ─────────────────────────
function Photoelectric() {
  const { ref, t } = useLoop(12)
  const uv = t >= 6
  const count = uv ? 3 : 9
  const color = uv ? '#a78bfa' : '#ef4444'
  const caption = !uv ? '빨간빛: 아무리 밝아도 전자가 안 나온다' : t < 9.5 ? '자외선: 희미해도 바로 튀어나온다' : '중요한 건 밝기가 아니라 진동수 (E = hf)'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <rect x={40} y={170} width={230} height={22} rx={3} fill="#cbd5e1" fillOpacity={0.75} />
      <text x={155} y={208} textAnchor="middle" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
        아연판 (일함수 4.3 eV)
      </text>
      {Array.from({ length: count }, (_, k) => {
        // 빛 알갱이가 0~0.6 동안 날아와 판에 닿고, 그 뒤 0.6~1 동안 전자가 튀어나가거나 흡수됨
        const p = (t * 0.7 + k / count + rnd(k) * 0.1) % 1
        const x0 = 30 + ((k * 53) % 170)
        const hit = ramp(p, 0, 0.6)
        const px = round1(lerp(x0, x0 + 70, hit))
        const py = round1(lerp(20, 168, hit))
        const e = ramp(p, 0.6, 1)
        return (
          <g key={k}>
            {p < 0.6 && <circle cx={px} cy={py} r={uv ? 6 : 5} fill={color} opacity={0.95} />}
            {!uv && p >= 0.6 && <circle cx={px} cy={168} r={round1(4 + e * 10)} fill={color} opacity={0.4 * (1 - e)} />}
            {uv && p >= 0.6 && (
              <g>
                <circle cx={round1(px + e * 60)} cy={round1(166 - e * 120)} r={7} fill={BLUE} />
                <text x={round1(px + e * 60)} y={round1(169.5 - e * 120)} textAnchor="middle" fontSize={9} fontWeight={800} fill="#1e1b4b">
                  e⁻
                </text>
              </g>
            )}
          </g>
        )
      })}
      <text x={334} y={60} textAnchor="middle" fontSize={19} fontWeight={800} fill={color}>
        {uv ? '자외선 (희미)' : '빨간빛 (밝게)'}
      </text>
      <text x={334} y={88} textAnchor="middle" fontSize={13} fontWeight={700} fill={WHITE} fillOpacity={0.85}>
        광자 하나 {uv ? '4.9' : '1.9'} eV
      </text>
      <text x={334} y={114} textAnchor="middle" fontSize={15} fontWeight={800} fill={uv ? YELLOW : WHITE} fillOpacity={uv ? 1 : 0.6}>
        {uv ? '> 4.3 eV 충분' : '< 4.3 eV 부족'}
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 중력파: 블랙홀 두 개가 돌며 합쳐지고, 아래에 처프 파형 ─────────────────────────
const MERGE = 8
// 합쳐지는 순간이 가까울수록 빨리 돎 (남은 시간의 5/8 제곱에 비례하는 위상)
const orbitPhase = (t: number) => 12 * (MERGE ** 0.625 - Math.max(0.02, MERGE - t) ** 0.625)
const strain = (t: number) => {
  if (t < MERGE) return Math.min(1, 0.32 * Math.max(0.02, MERGE - t) ** -0.35) * Math.cos(2 * orbitPhase(t))
  return Math.exp(-(t - MERGE) * 5) * Math.cos(2 * orbitPhase(MERGE) + (t - MERGE) * 40)
}
const WAVE_Y = 180

function GravWave() {
  const { ref, t } = useLoop(12)
  const merged = t >= MERGE
  const r = 46 * Math.max(0.02, (MERGE - t) / MERGE) ** 0.25
  const phase = orbitPhase(t)
  const end = Math.min(t, 10)
  const wave = Array.from({ length: 401 }, (_, i) => (10 * i) / 400)
    .filter((s) => s <= end)
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${round1(20 + s * 36)} ${round1(WAVE_Y - strain(s) * 22)}`)
    .join(' ')
  const caption = t < 5 ? '블랙홀 두 개가 서로를 돌며 다가간다' : t < MERGE ? '가까워질수록 빨라지고 파동이 커진다' : t < 10 ? '합쳐지며 태양 3개 질량이 중력파로' : '2015년 LIGO 가 처음 들은 소리'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {Array.from({ length: 4 }, (_, k) => {
        const rr = (t * 30 + k * 34) % 136
        return <circle key={k} cx={200} cy={78} r={round1(rr)} fill="none" stroke={BLUE} strokeOpacity={round1(4.5 * (1 - rr / 136)) / 10} strokeWidth={2} />
      })}
      {merged ? (
        <circle cx={200} cy={78} r={22} fill="#000" stroke={YELLOW} strokeWidth={2.5} />
      ) : (
        <>
          <circle cx={round1(200 + r * Math.cos(phase))} cy={round1(78 + r * 0.45 * Math.sin(phase))} r={15} fill="#000" stroke={YELLOW} strokeWidth={2} />
          <circle cx={round1(200 - r * Math.cos(phase))} cy={round1(78 - r * 0.45 * Math.sin(phase))} r={13} fill="#000" stroke={YELLOW} strokeWidth={2} />
        </>
      )}
      <text x={16} y={24} fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
        태양 질량 36 + 29 → 62
      </text>
      <line x1={20} y1={WAVE_Y} x2={380} y2={WAVE_Y} stroke={WHITE} strokeOpacity={0.2} />
      <path d={wave} fill="none" stroke={YELLOW} strokeWidth={2} strokeLinejoin="round" />
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 노벨 물리학상: 교과서 속 수상 업적 ───────────────────────────────────────
const LAUREATES: [string, string, string][] = [
  ['1901', '뢴트겐', 'X선 발견'],
  ['1903', '베크렐 · 퀴리 부부', '방사능 연구'],
  ['1921', '아인슈타인', '광전 효과'],
  ['1956', '쇼클리 · 바딘 · 브래튼', '트랜지스터'],
  ['2014', '아카사키 · 아마노 · 나카무라', '청색 LED'],
  ['2017', '와이스 · 배리시 · 손', '중력파 관측'],
  ['2025', '클라크 · 드보레 · 마티니스', '회로 속 양자 터널링'],
]

function Nobel() {
  const { ref, t } = useLoop(LAUREATES.length * 1.7)
  const index = Math.min(LAUREATES.length - 1, Math.floor(t / 1.7))
  const [year, who, what] = LAUREATES[index]
  const appear = ramp(t - index * 1.7, 0, 0.3)

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 메달 */}
      <path d="M62 10 L84 70 L100 70 L122 10" fill="none" stroke={RED} strokeWidth={10} strokeOpacity={0.8} />
      <circle cx={92} cy={112} r={50} fill="#eab308" />
      <circle cx={92} cy={112} r={41} fill="none" stroke="#fef9c3" strokeWidth={2} strokeOpacity={0.8} />
      <text x={92} y={120} textAnchor="middle" fontSize={22} fontWeight={800} fill="#713f12">
        물리
      </text>

      <g opacity={appear}>
        <text x={272} y={82} textAnchor="middle" fontSize={50} fontWeight={800} fill={YELLOW}>
          {year}
        </text>
        <text x={272} y={118} textAnchor="middle" fontSize={who.length > 10 ? 13.5 : 19} fontWeight={800} fill={WHITE}>
          {who}
        </text>
        <text x={272} y={146} textAnchor="middle" fontSize={15} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
          {what}
        </text>
      </g>
      {LAUREATES.map((_, i) => (
        <circle key={i} cx={272 + (i - 3) * 14} cy={176} r={3.5} fill={WHITE} fillOpacity={i === index ? 1 : 0.3} />
      ))}
      <Caption>1901년부터 이어진 물리학의 가장 큰 상</Caption>
    </svg>
  )
}

const VISUALS: Record<string, () => JSX.Element> = {
  'topic-freefall': FreeFall,
  'topic-cradle': Cradle,
  'topic-relativity': Relativity,
  'topic-fusion': Fusion,
  'topic-spectrum': Spectrum,
  'topic-led': Led,
  'topic-induction': Induction,
  'topic-fiber': Fiber,
  'topic-doubleslit': DoubleSlit,
  'topic-photoelectric': Photoelectric,
  'topic-gw': GravWave,
  'topic-nobel': Nobel,
}

export const hasTopicVisual = (topicId: string) => topicId in VISUALS

export default function TopicVisual({ topicId }: { topicId: string }) {
  const Visual = VISUALS[topicId]
  return Visual ? <Visual /> : null
}
