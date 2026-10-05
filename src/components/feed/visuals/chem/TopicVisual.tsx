import React from 'react'
import { Caption, WHITE, YELLOW, ramp, useLoop } from '../../topicVisualKit'

// 화학 주제 카드 위쪽에 들어가는 움직이는 그림.
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

// ── 멘델레예프: 빈칸으로 남긴 자리에 예측대로 원소가 들어옴 ─────────────────────
const TABLE: (string | null)[][] = [
  ['B', 'C', 'N'],
  ['Al', 'Si', 'P'],
  [null, null, 'As'],
  ['In', 'Sn', 'Sb'],
]
const FOUND: Record<string, [string, string, number]> = {
  '2-1': ['Ge', '1886', 6],
  '2-0': ['Ga', '1875', 8],
}

function Mendeleev() {
  const { ref, t } = useLoop(12)
  const caption =
    t < 3.5 ? '성질이 비슷한 원소끼리 세로로' : t < 6 ? '맞는 원소가 없으면? 빈칸으로!' : t < 8 ? '에카규소 예측 72 → 저마늄 72.6' : '빈칸은 예측대로 채워졌다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {TABLE.map((row, r) =>
        row.map((symbol, c) => {
          const x = 104 + c * 66
          const y = 10 + r * 49
          const found = FOUND[`${r}-${c}`]
          const filled = found ? ramp(t, found[2], found[2] + 0.5) : 0
          return (
            <g key={`${r}-${c}`} opacity={ramp(t, 0.3 + (r * 3 + c) * 0.22, 0.6 + (r * 3 + c) * 0.22)}>
              <rect
                x={x}
                y={y}
                width={60}
                height={43}
                rx={7}
                fill={found ? YELLOW : WHITE}
                fillOpacity={found ? 0.1 + filled * 0.15 : 0.08}
                stroke={found ? YELLOW : WHITE}
                strokeOpacity={found ? 0.9 : 0.4}
                strokeDasharray={found && !filled ? '5 4' : undefined}
                strokeWidth={1.5}
              />
              {found && (
                <text x={x + 30} y={y + 30} textAnchor="middle" fontSize={24} fontWeight={800} fill={YELLOW} opacity={1 - filled}>
                  ?
                </text>
              )}
              <text x={x + 30} y={y + (found ? 25 : 29)} textAnchor="middle" fontSize={20} fontWeight={800} fill={found ? YELLOW : WHITE} opacity={found ? filled : 1}>
                {symbol || found?.[0]}
              </text>
              {found && (
                <text x={x + 30} y={y + 38} textAnchor="middle" fontSize={10} fontWeight={700} fill={YELLOW} opacity={filled}>
                  {found[1]}년 발견
                </text>
              )}
            </g>
          )
        })
      )}
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 아보가드로수: 자릿수가 23까지 올라가는 계수기 ─────────────────────────────
const SUPERSCRIPT = '⁰¹²³⁴⁵⁶⁷⁸⁹'
const superscript = (n: number) => String(n).split('').map((d) => SUPERSCRIPT[Number(d)]).join('')

function Avogadro() {
  const { ref, t } = useLoop(12)
  const power = Math.round(23 * smooth(ramp(t, 1, 8)))
  const dots = Math.round(160 * ramp(t, 1, 8))
  const done = power === 23

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 물 한 모금이 담긴 컵 */}
      <path d="M40 40 L52 190 Q54 200 64 200 L126 200 Q136 200 138 190 L150 40" fill="none" stroke={WHITE} strokeOpacity={0.7} strokeWidth={2.5} />
      <path d="M46 110 L52 190 Q54 198 64 198 L126 198 Q136 198 138 190 L144 110 Z" fill={BLUE} fillOpacity={0.3} />
      {Array.from({ length: dots }, (_, i) => (
        <circle key={i} cx={56 + rnd(i) * 78} cy={118 + rnd(i + 500) * 74} r={2} fill={WHITE} fillOpacity={0.85} />
      ))}
      <text x={95} y={30} textAnchor="middle" fontSize={13} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        물 18 g
      </text>

      <text x={275} y={105} textAnchor="middle" fontSize={40} fontWeight={800} fill={done ? YELLOW : WHITE}>
        {power === 0 ? '1' : `${done ? '6.02 × ' : ''}10${superscript(power)}`}
      </text>
      <text x={275} y={135} textAnchor="middle" fontSize={15} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        개의 물 분자
      </text>
      <text x={275} y={175} textAnchor="middle" fontSize={22} fontWeight={800} fill={YELLOW} opacity={ramp(t, 9, 9.6)}>
        = 1몰
      </text>
      <Caption>{t < 8.5 ? '물 한 모금 속 분자를 세어 보면' : '우주의 나이를 초로 세어도 못 미치는 수'}</Caption>
    </svg>
  )
}

// ── pH: 0~14 눈금 위를 움직이는 표시 ────────────────────────────────────────
const PH_COLORS = ['#dc2626', '#ef4444', '#f97316', '#fb923c', '#fbbf24', '#facc15', '#a3e635', '#22c55e', '#14b8a6', '#0ea5e9', '#3b82f6', '#4f46e5', '#6d28d9', '#7e22ce', '#6b21a8']
const PH_STOPS: [string, number][] = [
  ['레몬즙', 2],
  ['커피', 5],
  ['순수한 물', 7],
  ['바닷물', 8.1],
  ['비눗물', 10],
]

function PhScale() {
  const { ref, t } = useLoop(12)
  const step = Math.min(PH_STOPS.length - 1, Math.floor(t / 2))
  const prev = PH_STOPS[Math.max(0, step - 1)][1]
  const [name, value] = PH_STOPS[step]
  const ph = lerp(prev, value, smooth(ramp(t - step * 2, 0, 0.7)))
  const px = (v: number) => 20 + v * 24
  const ending = t >= 10

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <text x={200} y={44} textAnchor="middle" fontSize={30} fontWeight={800} fill={ending ? YELLOW : WHITE}>
        {ending ? 'pH 1 차이 = 10배' : `${name}  pH ${value}`}
      </text>
      <text x={200} y={72} textAnchor="middle" fontSize={14} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
        {ending ? '레몬즙은 커피보다 수소 이온이 1000배' : `수소 이온 농도 = 10^−${value} M`}
      </text>

      {PH_COLORS.map((color, i) => (
        <g key={i}>
          <rect x={px(i)} y={120} width={24} height={40} fill={color} />
          <text x={px(i) + 12} y={178} textAnchor="middle" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
            {i}
          </text>
        </g>
      ))}
      <polygon points={`${px(ph) + 12},116 ${px(ph) + 2},98 ${px(ph) + 22},98`} fill={WHITE} />
      <text x={20} y={198} fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.6}>
        산성
      </text>
      <text x={380} y={198} textAnchor="end" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.6}>
        염기성
      </text>
      <Caption>{ending ? '숫자가 작을수록 강한 산성' : '쇠렌센이 1909년에 만든 산성도의 자'}</Caption>
    </svg>
  )
}

// ── 하버-보슈: N₂ + 3H₂ → 2NH₃ ─────────────────────────────────────────────
const N_ATOMS: [number, number, number, number][] = [
  [78, 70, 285, 62],
  [104, 70, 285, 138],
]
// 수소 원자 6개: 처음에는 둘씩 짝지어 있다가, 질소 하나에 셋씩 붙음
const H_ATOMS: [number, number, number, number][] = [
  [60, 120, 263, 76],
  [76, 120, 307, 76],
  [106, 120, 285, 38],
  [122, 120, 263, 152],
  [83, 158, 307, 152],
  [99, 158, 285, 114],
]

function Haber() {
  const { ref, t } = useLoop(12)
  const p = smooth(ramp(t, 3, 6.5))
  const caption = t < 3 ? '질소 1분자 + 수소 3분자' : t < 7 ? '고온 · 고압 · 철 촉매' : t < 9.5 ? '암모니아 2분자' : '기체 4몰 → 2몰: 압력을 높이면 유리'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <text x={200} y={196} textAnchor="middle" fontSize={20} fontWeight={800} fill={WHITE} fillOpacity={0.9}>
        N₂ + 3H₂ ⇌ 2NH₃
      </text>
      <path d="M170 95 L225 95 M213 85 L225 95 L213 105" fill="none" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={ramp(t, 2, 3) * (1 - ramp(t, 6.5, 7.5))} />
      {H_ATOMS.map(([x0, y0, x1, y1], i) => (
        <circle key={i} cx={lerp(x0, x1, p)} cy={lerp(y0, y1, p)} r={9} fill={WHITE} />
      ))}
      {N_ATOMS.map(([x0, y0, x1, y1], i) => (
        <g key={i}>
          <circle cx={lerp(x0, x1, p)} cy={lerp(y0, y1, p)} r={17} fill={BLUE} />
          <text x={lerp(x0, x1, p)} y={lerp(y0, y1, p) + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill="#1e1b4b">
            N
          </text>
        </g>
      ))}
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 얼음: 물에 뜨는 얼음과 육각형 구조 ───────────────────────────────────────
function Ice() {
  const { ref, t } = useLoop(12)
  // 떨어져서 잠겼다가 떠오르며 자리를 잡음
  const drop = ramp(t, 0.5, 1.6)
  const bob = Math.exp(-Math.max(0, t - 1.6) * 1.2) * Math.sin((t - 1.6) * 5) * 14
  const top = t < 1.6 ? lerp(-70, 96, drop * drop) : 82 + bob
  const lattice = ramp(t, 5.5, 6.5)
  const ring = Array.from({ length: 6 }, (_, i) => [round1(300 + 46 * Math.cos((i * Math.PI) / 3)), round1(100 + 46 * Math.sin((i * Math.PI) / 3))])
  const caption = t < 4 ? '얼음은 가라앉지 않고 떠오른다' : t < 5.5 ? '밀도 0.917 g/cm³ — 약 92%만 잠김' : t < 9 ? '수소 결합이 만드는 육각형 구조' : '가운데가 비어 있어 물보다 가볍다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <rect x={24} y={90} width={196} height={110} fill={BLUE} fillOpacity={0.3} />
      <path d="M24 30 L24 200 L220 200 L220 30" fill="none" stroke={WHITE} strokeOpacity={0.7} strokeWidth={2.5} />
      <rect x={84} y={top} width={76} height={70} rx={8} fill={WHITE} fillOpacity={0.75} stroke={WHITE} strokeWidth={2} />
      <line x1={24} y1={90} x2={220} y2={90} stroke={BLUE} strokeWidth={2} />
      <g opacity={ramp(t, 4, 4.6)}>
        <text x={172} y={84} fontSize={12} fontWeight={800} fill={YELLOW}>
          8%
        </text>
        <text x={172} y={130} fontSize={12} fontWeight={800} fill={YELLOW}>
          92%
        </text>
      </g>

      <g opacity={lattice}>
        {ring.map(([x, y], i) => {
          const [nx, ny] = ring[(i + 1) % 6]
          return <line key={i} x1={x} y1={y} x2={nx} y2={ny} stroke={YELLOW} strokeWidth={2} strokeDasharray="5 4" />
        })}
        {ring.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={11} fill={RED} />
            <circle cx={round1(x + 11 * Math.cos((i * Math.PI) / 3 + 0.9))} cy={round1(y + 11 * Math.sin((i * Math.PI) / 3 + 0.9))} r={5} fill={WHITE} />
            <circle cx={round1(x + 11 * Math.cos((i * Math.PI) / 3 - 0.9))} cy={round1(y + 11 * Math.sin((i * Math.PI) / 3 - 0.9))} r={5} fill={WHITE} />
          </g>
        ))}
        <text x={300} y={105} textAnchor="middle" fontSize={13} fontWeight={800} fill={WHITE} fillOpacity={0.8}>
          빈 공간
        </text>
        <text x={300} y={180} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
          물 분자 6개의 고리
        </text>
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 탄소 동소체: 육각형 판 → 겹치면 흑연 → 한 층 떼면 그래핀 ─────────────────────
const HEX_EDGES = (() => {
  const edges: string[] = []
  const size = 20
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const cx = col * size * 1.732 + (row % 2) * size * 0.866
      const cy = row * size * 1.5
      const corner = (k: number) => `${(cx + size * Math.cos((Math.PI / 180) * (60 * k - 30))).toFixed(1)} ${(cy + size * Math.sin((Math.PI / 180) * (60 * k - 30))).toFixed(1)}`
      edges.push(`M${[0, 1, 2, 3, 4, 5].map(corner).join(' L')} Z`)
    }
  }
  return edges.join(' ')
})()

function CarbonSheet({ y, color, draw = 1, opacity = 1 }: { y: number; color: string; draw?: number; opacity?: number }) {
  // 비스듬히 눕혀 판처럼 보이게 함
  return (
    <g transform={`translate(118 ${y}) matrix(1 0 -0.55 0.5 0 0)`} opacity={opacity}>
      <path d={HEX_EDGES} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
    </g>
  )
}

function Carbon() {
  const { ref, t } = useLoop(12)
  const stack = ramp(t, 3.5, 4.5)
  const peel = smooth(ramp(t, 7.5, 9.5))
  const caption = t < 3.5 ? '탄소 원자가 육각형으로 이어진 판' : t < 7.5 ? '판이 겹겹이 쌓이면 흑연 (연필심)' : '한 층만 떼어 내면 그래핀'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <CarbonSheet y={150} color={WHITE} opacity={stack * 0.45} />
      <CarbonSheet y={122} color={WHITE} opacity={stack * 0.7} />
      <CarbonSheet y={94 - peel * 62} color={peel ? YELLOW : WHITE} draw={ramp(t, 0.4, 3)} />
      <text x={330} y={86} textAnchor="middle" fontSize={15} fontWeight={800} fill={YELLOW} opacity={ramp(t, 9.3, 9.8)}>
        원자 한 층
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 불꽃 반응: 원소마다 다른 불꽃색 ─────────────────────────────────────────
const FLAMES: [string, string, string, string][] = [
  ['Li', '리튬', '빨강', '#ef4444'],
  ['Na', '나트륨', '노랑', '#facc15'],
  ['K', '칼륨', '보라', '#a78bfa'],
  ['Ca', '칼슘', '주황', '#fb923c'],
  ['Sr', '스트론튬', '진한 빨강', '#dc2626'],
  ['Ba', '바륨', '황록', '#a3e635'],
  ['Cu', '구리', '청록', '#2dd4bf'],
]

function Flame() {
  const { ref, t } = useLoop(FLAMES.length * 1.7)
  const [symbol, name, colorName, color] = FLAMES[Math.min(FLAMES.length - 1, Math.floor(t / 1.7))]
  const flicker = Math.round((1 + 0.06 * Math.sin(t * 13) + 0.04 * Math.sin(t * 29)) * 1000) / 1000

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 버너 */}
      <rect x={118} y={176} width={24} height={26} rx={3} fill={WHITE} fillOpacity={0.5} />
      <rect x={100} y={198} width={60} height={8} rx={4} fill={WHITE} fillOpacity={0.5} />
      <g transform={`translate(130 176) scale(1 ${flicker})`}>
        <path d="M0 0 C-44 -30 -30 -84 0 -150 C30 -84 44 -30 0 0 Z" fill={color} fillOpacity={0.9} />
        <path d="M0 0 C-20 -18 -14 -48 0 -84 C14 -48 20 -18 0 0 Z" fill={WHITE} fillOpacity={0.55} />
      </g>

      <text x={282} y={98} textAnchor="middle" fontSize={64} fontWeight={800} fill={color}>
        {symbol}
      </text>
      <text x={282} y={132} textAnchor="middle" fontSize={18} fontWeight={800} fill={WHITE}>
        {name}
      </text>
      <text x={282} y={158} textAnchor="middle" fontSize={15} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
        {colorName}색 불꽃
      </text>
      <Caption>들뜬 전자가 돌아오며 내는 고유한 빛</Caption>
    </svg>
  )
}

// ── 탄소-14: 5730년마다 절반으로 줄어드는 곡선 ────────────────────────────────
const HALF_LIFE = 5730

function CarbonDating() {
  const { ref, t } = useLoop(12)
  const years = 4 * HALF_LIFE * ramp(t, 0.5, 9)
  const px = (y: number) => 52 + (y / (4 * HALF_LIFE)) * 320
  const py = (fraction: number) => 188 - fraction * 160
  const curve = Array.from({ length: 81 }, (_, i) => (4 * HALF_LIFE * i) / 80)
    .filter((y) => y <= years)
    .map((y, i) => `${i === 0 ? 'M' : 'L'}${px(y).toFixed(1)} ${py(0.5 ** (y / HALF_LIFE)).toFixed(1)}`)
    .join(' ')
  const passed = Math.floor(years / HALF_LIFE)

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <line x1={52} y1={188} x2={382} y2={188} stroke={WHITE} strokeOpacity={0.5} />
      <line x1={52} y1={22} x2={52} y2={188} stroke={WHITE} strokeOpacity={0.5} />
      <text x={46} y={32} textAnchor="end" fontSize={11} fill={WHITE} fillOpacity={0.7}>
        100%
      </text>
      {[1, 2, 3, 4].map((n) => (
        <g key={n} opacity={passed >= n ? 1 : 0.35}>
          <text x={px(n * HALF_LIFE)} y={203} textAnchor="middle" fontSize={10.5} fill={WHITE} fillOpacity={0.8}>
            {(n * HALF_LIFE).toLocaleString('en-US')}년
          </text>
          {passed >= n && (
            <>
              <line x1={px(n * HALF_LIFE)} y1={188} x2={px(n * HALF_LIFE)} y2={py(0.5 ** n)} stroke={YELLOW} strokeDasharray="4 3" />
              <circle cx={px(n * HALF_LIFE)} cy={py(0.5 ** n)} r={4.5} fill={YELLOW} />
              <text x={px(n * HALF_LIFE) + (n === 4 ? -34 : 8)} y={py(0.5 ** n) - 8} fontSize={13} fontWeight={800} fill={YELLOW}>
                1/{2 ** n}
              </text>
            </>
          )}
        </g>
      ))}
      <path d={curve} fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x={372} y={56} textAnchor="end" fontSize={28} fontWeight={800} fill={WHITE}>
        {(100 * 0.5 ** (years / HALF_LIFE)).toFixed(1)}%
      </text>
      <text x={372} y={76} textAnchor="end" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        남은 탄소-14
      </text>
      <Caption>{t < 3 ? '죽은 뒤부터 탄소-14 는 줄어든다' : t < 9.5 ? '5730년이 지날 때마다 절반' : '남은 비율로 나이를 거꾸로 계산'}</Caption>
    </svg>
  )
}

// ── 촉매: 활성화 에너지 언덕을 낮춤 ─────────────────────────────────────────
// 반응 경로의 에너지 곡선 (왼쪽 반응물 → 언덕 → 오른쪽 생성물)
const energyY = (x: number, hill: number) => lerp(128, 168, smooth(ramp(x, 120, 280))) - hill * Math.exp(-(((x - 200) / 48) ** 2))
const energyPath = (hill: number) =>
  Array.from({ length: 67 }, (_, i) => 40 + i * 5)
    .map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${energyY(x, hill).toFixed(1)}`)
    .join(' ')
const HILL = 96
const HILL_CATALYST = 44

function Catalyst() {
  const { ref, t } = useLoop(12)
  const withCatalyst = t >= 6
  const hill = withCatalyst ? HILL_CATALYST : HILL
  // 촉매가 있으면 같은 길을 훨씬 빨리 넘어감
  const ballX = withCatalyst ? lerp(60, 340, ramp(t, 7.2, 9)) : lerp(60, 340, ramp(t, 1, 5))
  const caption = t < 5.2 ? '반응하려면 에너지 언덕을 넘어야 한다' : t < 9.2 ? '촉매는 더 낮은 길을 열어 준다' : '출발점과 도착점은 그대로!'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <path d={energyPath(HILL)} fill="none" stroke={WHITE} strokeWidth={3} strokeOpacity={withCatalyst ? 0.35 : 1} />
      <path d={energyPath(HILL_CATALYST)} fill="none" stroke={YELLOW} strokeWidth={3} opacity={ramp(t, 5.4, 6)} />
      <circle cx={ballX} cy={energyY(ballX, hill) - 9} r={8} fill={withCatalyst ? YELLOW : WHITE} />
      <text x={60} y={150} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        반응물
      </text>
      <text x={340} y={190} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        생성물
      </text>
      <text x={200} y={22} textAnchor="middle" fontSize={13} fontWeight={800} fill={WHITE} fillOpacity={withCatalyst ? 0.4 : 0.9}>
        활성화 에너지
      </text>
      <text x={200} y={88} textAnchor="middle" fontSize={13} fontWeight={800} fill={YELLOW} opacity={ramp(t, 5.6, 6.2)}>
        촉매 사용
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 노벨 화학상: 교과서 속 수상 업적 ────────────────────────────────────────
const LAUREATES: [string, string, string][] = [
  ['1901', '판트호프', '화학 평형 · 삼투압'],
  ['1911', '마리 퀴리', '폴로늄 · 라듐 발견'],
  ['1918', '하버', '암모니아 합성'],
  ['1960', '리비', '탄소 연대 측정'],
  ['2019', '구디너프 · 휘팅엄 · 요시노', '리튬 이온 전지'],
  ['2024', '베이커 · 허사비스 · 점퍼', '단백질 설계와 구조 예측'],
  ['2025', '기타가와 · 롭슨 · 야기', '금속-유기 골격체(MOF)'],
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
        화학
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
      <Caption>1901년부터 이어진 화학의 가장 큰 상</Caption>
    </svg>
  )
}

// ── 리튬 이온 전지: 충전과 방전 때 이온이 오가는 모습 ───────────────────────────
function Battery() {
  const { ref, t } = useLoop(12)
  const charging = t < 6
  // 0 = 모두 양극(오른쪽), 1 = 모두 음극(왼쪽)
  const moved = charging ? ramp(t, 1, 5) : 1 - ramp(t, 7, 11)
  const glow = charging ? 0 : ramp(t, 7, 7.5) * (1 - ramp(t, 10.8, 11.4))

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 도선과 전구 */}
      <path d="M72 62 L72 30 L328 30 L328 62" fill="none" stroke={WHITE} strokeOpacity={0.6} strokeWidth={2.5} />
      <circle cx={200} cy={30} r={15} fill={YELLOW} fillOpacity={0.15 + glow * 0.85} stroke={YELLOW} strokeWidth={2} />
      <text x={200} y={35} textAnchor="middle" fontSize={12} fontWeight={800} fill={glow > 0.5 ? '#1e1b4b' : WHITE}>
        {charging ? '충전' : '방전'}
      </text>

      <rect x={40} y={62} width={64} height={130} rx={8} fill={WHITE} fillOpacity={0.15} stroke={WHITE} strokeOpacity={0.6} strokeWidth={2} />
      <rect x={296} y={62} width={64} height={130} rx={8} fill={BLUE} fillOpacity={0.25} stroke={BLUE} strokeWidth={2} />
      <text x={72} y={206} textAnchor="middle" fontSize={12} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        음극 (흑연)
      </text>
      <text x={328} y={206} textAnchor="middle" fontSize={12} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        양극
      </text>

      {Array.from({ length: 8 }, (_, i) => {
        // 이온마다 조금씩 시차를 두고 출발
        const p = smooth(ramp(moved * 1.7 - i * 0.1, 0, 1))
        const y = 82 + (i % 4) * 30
        const x = lerp(312 + Math.floor(i / 4) * 30, 56 + Math.floor(i / 4) * 30, p)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={10} fill={YELLOW} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#1e1b4b">
              Li⁺
            </text>
          </g>
        )
      })}
      <Caption>{charging ? '충전: 리튬 이온이 양극 → 음극으로' : '방전: 음극 → 양극, 전류가 흐른다'}</Caption>
    </svg>
  )
}

// ── 드라이아이스: 녹지 않고 기체로 사라지는 승화 ────────────────────────────────
function DryIce() {
  const { ref, t } = useLoop(12)
  const left = 1 - 0.6 * ramp(t, 1, 11)
  const width = 120 * left
  const height = 70 * left
  const caption = t < 4 ? '드라이아이스 = 고체 이산화 탄소' : t < 8 ? '액체를 거치지 않고 바로 기체로: 승화' : '1기압에서는 액체 상태가 없다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <line x1={50} y1={196} x2={270} y2={196} stroke={WHITE} strokeOpacity={0.5} strokeWidth={2} />
      {Array.from({ length: 26 }, (_, i) => {
        // 덩어리 위에서 생겨 흔들리며 올라가다 사라지는 기체 분자
        const life = (t * 0.35 + rnd(i)) % 1
        const x = round1(160 + (rnd(i + 40) - 0.5) * width + Math.sin(life * 6 + i) * 10)
        const y = 196 - height - life * 130
        return <circle key={i} cx={x} cy={y} r={4} fill={WHITE} fillOpacity={0.7 * (1 - life)} />
      })}
      <rect x={160 - width / 2} y={196 - height} width={width} height={height} rx={8} fill={WHITE} fillOpacity={0.85} />
      <text x={160} y={196 - height / 2 + 5} textAnchor="middle" fontSize={15 * left + 2} fontWeight={800} fill="#1e1b4b">
        CO₂
      </text>

      <text x={330} y={84} textAnchor="middle" fontSize={26} fontWeight={800} fill={YELLOW}>
        −78.5 ℃
      </text>
      <text x={330} y={108} textAnchor="middle" fontSize={13} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        승화하는 온도
      </text>
      <g opacity={ramp(t, 8, 8.6)}>
        <text x={330} y={150} textAnchor="middle" fontSize={13} fontWeight={800} fill={WHITE}>
          고체 → 기체
        </text>
        <text x={330} y={170} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
          액체는 5.1기압부터
        </text>
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

const VISUALS: Record<string, () => JSX.Element> = {
  'topic-mendeleev': Mendeleev,
  'topic-avogadro': Avogadro,
  'topic-ph': PhScale,
  'topic-haber': Haber,
  'topic-ice': Ice,
  'topic-carbon': Carbon,
  'topic-flame': Flame,
  'topic-c14': CarbonDating,
  'topic-catalyst': Catalyst,
  'topic-nobel': Nobel,
  'topic-battery': Battery,
  'topic-dryice': DryIce,
}

export const hasTopicVisual = (topicId: string) => topicId in VISUALS

export default function TopicVisual({ topicId }: { topicId: string }) {
  const Visual = VISUALS[topicId]
  return Visual ? <Visual /> : null
}
