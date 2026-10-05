import React from 'react'
import { Caption, WHITE, YELLOW, ramp, useLoop } from '../../topicVisualKit'

// 생명과학 주제 카드 위쪽에 들어가는 움직이는 그림.
// 모든 그림은 "시간 t(초)의 함수"로만 그려서, 나중에 같은 화면을 영상으로 찍어내기도 쉽게 함.

const BLUE = '#60a5fa'
const RED = '#f87171'
const GREEN = '#4ade80'
const PURPLE = '#a78bfa'
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

// ── DNA: 돌아가는 이중 나선과 염기쌍 ────────────────────────────────────────
const BASES = 'ATGCGTACGA'
const PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }
const BASE_COLOR: Record<string, string> = { A: RED, T: BLUE, G: YELLOW, C: GREEN }

function Dna() {
  const { ref, t } = useLoop(12)
  const phase = t * 1.4
  const helixY = (x: number, side: number) => round1(80 + side * 46 * Math.sin(x * 0.034 + phase))
  const strand = (side: number) =>
    Array.from({ length: 69 }, (_, i) => 30 + i * 5)
      .map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${helixY(x, side)}`)
      .join(' ')
  const letters = ramp(t, 4, 4.6)
  // 마지막 장면: 아래 가닥 글자를 지웠다가 짝 규칙대로 다시 채움
  const complement = t < 8 ? 1 : ramp(t, 9, 9.6)
  const caption = t < 4 ? '두 가닥이 꼬인 이중 나선' : t < 8 ? 'A는 T와, G는 C와 짝을 짓는다' : '한 가닥만 알면 나머지가 정해진다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {BASES.split('').map((base, i) => {
        const x = 46 + i * 34
        const top = helixY(x, 1)
        const bottom = helixY(x, -1)
        const mid = (top + bottom) / 2
        return (
          <g key={i}>
            <line x1={x} y1={top} x2={x} y2={mid} stroke={BASE_COLOR[base]} strokeWidth={5} strokeLinecap="round" />
            <line x1={x} y1={mid} x2={x} y2={bottom} stroke={BASE_COLOR[PAIR[base]]} strokeWidth={5} strokeLinecap="round" />
          </g>
        )
      })}
      <path d={strand(1)} fill="none" stroke={WHITE} strokeWidth={3.5} strokeLinecap="round" />
      <path d={strand(-1)} fill="none" stroke={WHITE} strokeWidth={3.5} strokeLinecap="round" strokeOpacity={0.6} />

      {BASES.split('').map((base, i) => {
        const x = 46 + i * 34
        return (
          <g key={i} opacity={letters}>
            <text x={x} y={162} textAnchor="middle" fontSize={17} fontWeight={800} fill={BASE_COLOR[base]}>
              {base}
            </text>
            <text x={x} y={190} textAnchor="middle" fontSize={17} fontWeight={800} fill={BASE_COLOR[PAIR[base]]} opacity={complement}>
              {PAIR[base]}
            </text>
          </g>
        )
      })}
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 멘델: Rr × Rr 의 네 칸이 차례로 채워지고 3 : 1 ───────────────────────────
// 주름진 완두: 둘레가 울퉁불퉁한 원
const wrinkled = (cx: number, cy: number, r: number) =>
  Array.from({ length: 33 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2
    const rr = r * (1 + 0.13 * Math.sin(a * 7))
    return `${i === 0 ? 'M' : 'L'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`
  }).join(' ') + ' Z'

const PUNNETT: [string, number, number][] = [
  ['RR', 0, 0],
  ['Rr', 1, 0],
  ['Rr', 0, 1],
  ['rr', 1, 1],
]

function Mendel() {
  const { ref, t } = useLoop(12)
  const cell = (c: number, r: number) => [112 + c * 74, 46 + r * 64]
  const ratio = ramp(t, 6.5, 7.1)
  const real = ramp(t, 8.8, 9.4)
  const caption = t < 1.5 ? '둥근 잡종(Rr)끼리 교배하면' : t < 6.5 ? '부모에게서 인자를 하나씩 받는다' : t < 8.8 ? '둥근 것 : 주름진 것 = 3 : 1' : '멘델의 실제 결과도 2.96 : 1'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <text x={149} y={34} textAnchor="middle" fontSize={17} fontWeight={800} fill={YELLOW}>
        R
      </text>
      <text x={223} y={34} textAnchor="middle" fontSize={17} fontWeight={800} fill={WHITE}>
        r
      </text>
      <text x={98} y={82} textAnchor="end" fontSize={17} fontWeight={800} fill={YELLOW}>
        R
      </text>
      <text x={98} y={146} textAnchor="end" fontSize={17} fontWeight={800} fill={WHITE}>
        r
      </text>
      {PUNNETT.map(([genes, c, r], i) => {
        const [x, y] = cell(c, r)
        const show = ramp(t, 1.5 + i * 1.1, 2.1 + i * 1.1)
        return (
          <g key={i}>
            <rect x={x} y={y} width={70} height={60} rx={8} fill={WHITE} fillOpacity={0.06} stroke={WHITE} strokeOpacity={0.4} strokeWidth={1.5} />
            <g opacity={show}>
              {genes === 'rr' ? <path d={wrinkled(x + 22, y + 30, 12)} fill="#65a30d" /> : <circle cx={x + 22} cy={y + 30} r={13} fill="#bef264" />}
              <text x={x + 52} y={y + 36} textAnchor="middle" fontSize={16} fontWeight={800} fill={WHITE}>
                {genes}
              </text>
            </g>
          </g>
        )
      })}
      <g opacity={ratio}>
        <text x={332} y={86} textAnchor="middle" fontSize={40} fontWeight={800} fill={YELLOW}>
          3 : 1
        </text>
        <text x={332} y={110} textAnchor="middle" fontSize={13} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
          둥근 완두 : 주름진 완두
        </text>
      </g>
      <g opacity={real}>
        <text x={332} y={150} textAnchor="middle" fontSize={17} fontWeight={800} fill={WHITE}>
          5474 : 1850
        </text>
        <text x={332} y={170} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
          멘델이 센 2대 완두
        </text>
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 세포 분열: 염색체가 가운데 모였다가 양쪽으로, 세포가 둘로 ───────────────────
const CHROMOSOME_COLORS = [RED, BLUE, YELLOW, PURPLE]

function Mitosis() {
  const { ref, t } = useLoop(12)
  const gather = smooth(ramp(t, 1.5, 3.5))
  const split = smooth(ramp(t, 5, 7.2))
  const divide = smooth(ramp(t, 7, 9.5))
  const offset = 64 * divide
  const radius = lerp(84, 60, divide)
  const cells = [200 - offset, 200 + offset]
  const caption = t < 2.5 ? '간기: 분열 전에 DNA 를 복제한다' : t < 5 ? '중기: 염색체가 가운데에 늘어선다' : t < 7.5 ? '후기: 염색 분체가 양쪽 끝으로' : '말기: 똑같은 두 딸세포'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 세포막을 먼저 그리고 세포질로 덮어, 두 원이 겹친 부분에는 막이 안 보이게 함 */}
      {cells.map((cx, i) => (
        <circle key={`m${i}`} cx={cx} cy={102} r={radius} fill={GREEN} />
      ))}
      {cells.map((cx, i) => (
        <circle key={`c${i}`} cx={cx} cy={102} r={radius - 3.5} fill="#14532d" />
      ))}
      <circle cx={200} cy={102} r={40} fill={PURPLE} fillOpacity={0.18} stroke={PURPLE} strokeOpacity={0.7} strokeWidth={2} opacity={1 - ramp(t, 2, 3)} />

      {CHROMOSOME_COLORS.map((color, i) => {
        const y0 = round1(84 + rnd(i) * 36)
        const x0 = round1(178 + rnd(i + 10) * 44)
        const y = lerp(y0, 66 + i * 24, gather)
        const x = lerp(x0, 200, gather)
        const gap = 3 + split * 58 + divide * 10
        return (
          <g key={i}>
            <rect x={x - gap - 16} y={y - 4} width={16} height={8} rx={4} fill={color} />
            <rect x={x + gap} y={y - 4} width={16} height={8} rx={4} fill={color} />
          </g>
        )
      })}
      <g opacity={ramp(t, 9.5, 10)}>
        {cells.map((cx, i) => (
          <text key={i} x={cx} y={198} textAnchor="middle" fontSize={13} fontWeight={800} fill={YELLOW}>
            염색체 46개
          </text>
        ))}
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 광합성: 잎이 이산화 탄소를 받아 산소를 내보냄 ─────────────────────────────
function Photosynthesis() {
  const { ref, t } = useLoop(12)
  const sun = round1(1 + 0.08 * Math.sin(t * 3))
  const sugar = ramp(t, 4, 4.8)
  const equation = ramp(t, 8, 8.6)
  const hexagon = Array.from({ length: 6 }, (_, k) => `${round1(212 + 15 * Math.cos((k * Math.PI) / 3))},${round1(104 + 15 * Math.sin((k * Math.PI) / 3))}`).join(' ')
  const caption = t < 4 ? '빛을 받은 잎이 이산화 탄소를 받아들여' : t < 8 ? '포도당을 만들고 산소를 내놓는다' : '나무의 몸은 대부분 공기에서 왔다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      {/* 해 */}
      <g transform={`translate(56 40) scale(${sun})`}>
        {Array.from({ length: 8 }, (_, k) => (
          <line key={k} x1={0} y1={-26} x2={0} y2={-36} stroke={YELLOW} strokeWidth={3} strokeLinecap="round" transform={`rotate(${k * 45})`} />
        ))}
        <circle r={19} fill={YELLOW} />
      </g>
      <line x1={80} y1={60} x2={160} y2={92} stroke={YELLOW} strokeWidth={2} strokeDasharray="5 5" strokeDashoffset={round1(-t * 20)} opacity={0.7} />

      {/* 잎 */}
      <path d="M130 112 Q205 28 290 112 Q205 196 130 112 Z" fill="#16a34a" stroke={GREEN} strokeWidth={2.5} />
      <path d="M130 112 L290 112" stroke={GREEN} strokeWidth={2} opacity={0.8} />
      <g opacity={sugar}>
        <polygon points={hexagon} fill="none" stroke={WHITE} strokeWidth={2.5} />
        <text x={212} y={140} textAnchor="middle" fontSize={11} fontWeight={800} fill={WHITE}>
          포도당
        </text>
      </g>

      {/* 들어오는 CO₂, 나가는 O₂ */}
      {Array.from({ length: 3 }, (_, i) => {
        const life = (t * 0.3 + i / 3) % 1
        return (
          <text key={`c${i}`} x={round1(lerp(18, 140, life))} y={150 + i * 16} fontSize={13} fontWeight={800} fill={WHITE} opacity={round1(Math.min(1, (1 - life) * 3))}>
            CO₂
          </text>
        )
      })}
      {Array.from({ length: 3 }, (_, i) => {
        const life = (t * 0.3 + i / 3 + 0.15) % 1
        return (
          <text key={`o${i}`} x={round1(lerp(286, 370, life))} y={round1(lerp(100, 44, life) + i * 18)} fontSize={13} fontWeight={800} fill={BLUE} opacity={ramp(t, 3, 3.6) * round1(Math.min(1, (1 - life) * 3))}>
            O₂
          </text>
        )
      })}
      <text x={200} y={204} textAnchor="middle" fontSize={14.5} fontWeight={800} fill={YELLOW} opacity={equation}>
        6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 효소: 활성 부위에 꼭 맞는 기질만 분해 ───────────────────────────────────
const ENZYME_PATH =
  'M102 132 L170 132 L170 147 L200 164 L230 147 L230 132 L298 132 Q310 132 310 144 L310 186 Q310 198 298 198 L102 198 Q90 198 90 186 L90 144 Q90 132 102 132 Z'
// 기질의 왼쪽·오른쪽 조각 (아래 꼭짓점이 (0,0))
const LEFT_HALF = '-30,-36 0,-36 0,0 -30,-17'
const RIGHT_HALF = '0,-36 30,-36 30,-17 0,0'

function Enzyme() {
  const { ref, t } = useLoop(12)
  const tipY = lerp(0, 164, smooth(ramp(t, 0.8, 3)))
  const apart = smooth(ramp(t, 5, 7))
  const fade = 1 - ramp(t, 7.2, 7.8)
  // 모양이 다른 기질: 다가왔다가 튕겨 나감
  const wrongY = t < 9.5 ? lerp(-30, 108, smooth(ramp(t, 8.2, 9.4))) : lerp(108, -30, smooth(ramp(t, 9.6, 11)))
  const glow = ramp(t, 3, 3.4) * (1 - ramp(t, 5, 5.4))
  const caption = t < 3.2 ? '기질이 효소의 활성 부위로' : t < 5 ? '자물쇠에 맞는 열쇠처럼 꼭 맞게' : t < 8 ? '분해된 뒤에도 효소는 그대로' : '모양이 맞지 않으면 반응하지 않는다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <path d={ENZYME_PATH} fill={PURPLE} fillOpacity={0.35} stroke={PURPLE} strokeWidth={2.5} />
      <path d="M170 132 L170 147 L200 164 L230 147 L230 132" fill="none" stroke={YELLOW} strokeWidth={4} opacity={glow} strokeLinejoin="round" />
      <text x={200} y={188} textAnchor="middle" fontSize={15} fontWeight={800} fill={WHITE}>
        효소 (아밀레이스)
      </text>

      <g opacity={fade}>
        <polygon points={LEFT_HALF} fill={YELLOW} transform={`translate(${200 - apart * 90} ${tipY - apart * 70})`} />
        <polygon points={RIGHT_HALF} fill={YELLOW} transform={`translate(${200 + apart * 90} ${tipY - apart * 70})`} />
        <text x={200} y={tipY - 46} textAnchor="middle" fontSize={13} fontWeight={800} fill={YELLOW} opacity={1 - apart}>
          기질 (녹말)
        </text>
        <text x={200} y={60} textAnchor="middle" fontSize={13} fontWeight={800} fill={YELLOW} opacity={apart}>
          생성물 (엿당)
        </text>
      </g>

      <g opacity={ramp(t, 8, 8.2)}>
        <circle cx={200} cy={wrongY} r={20} fill={RED} />
        <text x={200} y={wrongY + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#1e1b4b">
          ?
        </text>
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 신경: 활동 전위 그래프와 도약 전도 ─────────────────────────────────────
// τ(ms)에 따른 막전위(mV)
const membrane = (tau: number) => {
  if (tau < 1) return -70
  if (tau < 1.6) return -70 + 100 * smooth((tau - 1) / 0.6)
  if (tau < 2.6) return 30 - 110 * smooth((tau - 1.6) / 1)
  if (tau < 4) return -80 + 10 * smooth((tau - 2.6) / 1.4)
  return -70
}
const NODES = [52, 128, 204, 280, 356]

function Neuron() {
  const { ref, t } = useLoop(12)
  const shown = 5 * ramp(t, 0.5, 6.5)
  const px = (tau: number) => 62 + tau * 62
  const py = (v: number) => 124 - ((v + 80) / 120) * 104
  const curve = Array.from({ length: 101 }, (_, i) => (5 * i) / 100)
    .filter((tau) => tau <= shown)
    .map((tau, i) => `${i === 0 ? 'M' : 'L'}${px(tau).toFixed(1)} ${py(membrane(tau)).toFixed(1)}`)
    .join(' ')
  const hop = Math.floor((t * 2.5) % NODES.length)
  const caption = t < 3 ? '쉬는 뉴런의 안쪽은 −70 mV' : t < 7 ? 'Na⁺ 가 들어오며 +30 mV 로 뒤집힌다' : '말이집 사이를 건너뛰는 도약 전도'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <line x1={62} y1={py(-70)} x2={372} y2={py(-70)} stroke={WHITE} strokeOpacity={0.25} strokeDasharray="4 4" />
      <line x1={62} y1={14} x2={62} y2={128} stroke={WHITE} strokeOpacity={0.5} />
      <text x={56} y={py(-70) + 4} textAnchor="end" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        −70
      </text>
      <text x={56} y={py(30) + 4} textAnchor="end" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        +30
      </text>
      <text x={56} y={14} textAnchor="end" fontSize={10} fill={WHITE} fillOpacity={0.6}>
        mV
      </text>
      <path d={curve} fill="none" stroke={YELLOW} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x={px(1.25) - 6} y={py(-10)} textAnchor="end" fontSize={12} fontWeight={800} fill={YELLOW} opacity={ramp(t, 2.5, 3)}>
        Na⁺ 유입
      </text>
      <text x={px(2.2) + 8} y={py(-10)} fontSize={12} fontWeight={800} fill={BLUE} opacity={ramp(t, 3.6, 4.1)}>
        K⁺ 유출
      </text>

      {/* 축삭: 말이집과 랑비에 결절 */}
      <g opacity={ramp(t, 6.5, 7)}>
        <line x1={30} y1={172} x2={380} y2={172} stroke={WHITE} strokeOpacity={0.6} strokeWidth={3} />
        {NODES.slice(0, -1).map((x, i) => (
          <rect key={i} x={x + 7} y={162} width={62} height={20} rx={10} fill={WHITE} fillOpacity={0.25} stroke={WHITE} strokeOpacity={0.5} />
        ))}
        <circle cx={NODES[hop]} cy={172} r={9} fill={YELLOW} />
        <circle cx={NODES[hop]} cy={172} r={16} fill={YELLOW} fillOpacity={0.25} />
        <text x={200} y={204} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
          말이집 신경: 초속 100 m 이상
        </text>
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 페니실린: 곰팡이 주변만 세균이 사라짐 ───────────────────────────────────
const DISH = { x: 122, y: 106, r: 84 }
const MOLD = { x: 146, y: 88 }
const COLONIES = Array.from({ length: 80 }, (_, i) => {
  const r = 76 * Math.sqrt(rnd(i))
  const a = 2 * Math.PI * rnd(i + 300)
  return [round1(DISH.x + r * Math.cos(a)), round1(DISH.y + r * Math.sin(a))]
})

function Antibiotic() {
  const { ref, t } = useLoop(12)
  const mold = ramp(t, 3, 4)
  const zone = 48 * smooth(ramp(t, 4.2, 7))
  const caption = t < 3 ? '포도상 구균을 기르던 배양 접시' : t < 4.2 ? '푸른곰팡이가 날아들었다' : t < 7.5 ? '곰팡이 주변만 세균이 자라지 않는다' : '1928년, 페니실린의 발견'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <circle cx={DISH.x} cy={DISH.y} r={DISH.r + 6} fill="none" stroke={WHITE} strokeOpacity={0.5} strokeWidth={2} />
      <circle cx={DISH.x} cy={DISH.y} r={DISH.r} fill="#fef3c7" fillOpacity={0.12} stroke={WHITE} strokeOpacity={0.7} strokeWidth={2} />
      {COLONIES.map(([x, y], i) => {
        const killed = Math.hypot(x - MOLD.x, y - MOLD.y) < zone
        return <circle key={i} cx={x} cy={y} r={3.4} fill="#fde68a" opacity={killed ? 0 : ramp(t, 0.3 + rnd(i + 900) * 2, 0.8 + rnd(i + 900) * 2)} />
      })}
      <circle cx={MOLD.x} cy={MOLD.y} r={zone} fill="none" stroke={YELLOW} strokeDasharray="4 4" strokeWidth={1.5} opacity={zone > 1 ? 0.8 : 0} />
      <g opacity={mold}>
        {[0, 1, 2, 3, 4].map((k) => (
          <circle key={k} cx={round1(MOLD.x + 8 * Math.cos(k * 1.3))} cy={round1(MOLD.y + 8 * Math.sin(k * 1.3))} r={9} fill="#2dd4bf" />
        ))}
      </g>

      <g opacity={ramp(t, 4.5, 5) * (1 - ramp(t, 7.3, 7.6))}>
        <text x={310} y={100} textAnchor="middle" fontSize={14} fontWeight={800} fill="#2dd4bf">
          푸른곰팡이
        </text>
        <text x={310} y={122} textAnchor="middle" fontSize={13} fontWeight={700} fill={YELLOW}>
          세균이 사라진 고리
        </text>
      </g>
      <g opacity={ramp(t, 7.5, 8.1)}>
        <text x={310} y={86} textAnchor="middle" fontSize={34} fontWeight={800} fill={YELLOW}>
          1928
        </text>
        <text x={310} y={116} textAnchor="middle" fontSize={20} fontWeight={800} fill={WHITE}>
          페니실린
        </text>
        <text x={310} y={140} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.75}>
          세계 최초의 항생제
        </text>
      </g>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 회색가지나방: 나무껍질 색에 따라 바뀌는 나방의 비율 ─────────────────────────
const MOTH_ORDER = Array.from({ length: 20 }, (_, i) => i).sort((a, b) => rnd(a + 50) - rnd(b + 50))
const mixColor = (light: number[], dark: number[], p: number) => `rgb(${light.map((c, i) => Math.round(lerp(c, dark[i], p))).join(',')})`

function Moth() {
  const { ref, t } = useLoop(12)
  const soot = ramp(t, 3.5, 5.5) * (1 - ramp(t, 8.5, 10.5))
  const dark = Math.round(t < 4 ? 1 : t < 8.5 ? lerp(1, 19, ramp(t, 4, 7.5)) : lerp(19, 2, ramp(t, 8.5, 11)))
  const year = t < 4 ? '1848년' : t < 8.5 ? '1895년' : '1956년 이후'
  const caption = t < 4 ? '밝은 나무껍질: 흰 나방이 눈에 덜 띈다' : t < 8.5 ? '매연에 그을린 나무: 검은 나방이 살아남는다' : '공기가 깨끗해지자 다시 흰 나방이 늘었다'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <rect x={30} y={14} width={210} height={190} rx={10} fill={mixColor([214, 211, 209], [52, 52, 58], soot)} />
      {MOTH_ORDER.map((order, i) => {
        const x = 54 + (i % 5) * 40
        const y = 38 + Math.floor(i / 5) * 46
        const black = order < dark
        const wing = black ? '#18181b' : '#f5f5f4'
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cx={-7} cy={-1} rx={9} ry={6.5} fill={wing} stroke="#71717a" strokeWidth={0.8} transform="rotate(-20 -7 -1)" />
            <ellipse cx={7} cy={-1} rx={9} ry={6.5} fill={wing} stroke="#71717a" strokeWidth={0.8} transform="rotate(20 7 -1)" />
            {!black && (
              <>
                <circle cx={-8} cy={-1} r={1.5} fill="#3f3f46" />
                <circle cx={8} cy={0} r={1.5} fill="#3f3f46" />
              </>
            )}
            <ellipse cx={0} cy={1} rx={2.2} ry={7} fill="#44403c" />
          </g>
        )
      })}

      <text x={320} y={78} textAnchor="middle" fontSize={26} fontWeight={800} fill={YELLOW}>
        {year}
      </text>
      <text x={320} y={118} textAnchor="middle" fontSize={34} fontWeight={800} fill={WHITE}>
        {dark * 5}%
      </text>
      <text x={320} y={140} textAnchor="middle" fontSize={13} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        검은 나방의 비율
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 혈액 순환: 폐순환과 체순환을 도는 혈액 ───────────────────────────────────
const BEATS_PER_SECOND = 70 / 60
const HEART = 'M0 8 C-14 -2 -16 -14 -8 -18 C-3 -20 0 -16 0 -13 C0 -16 3 -20 8 -18 C16 -14 14 -2 0 8 Z'

function Circulation() {
  const { ref, t } = useLoop(12)
  const beat = (t * BEATS_PER_SECOND) % 1
  const pulse = Math.round((1 + 0.12 * Math.exp(-beat * 6)) * 1000) / 1000
  const beats = Math.floor(t * BEATS_PER_SECOND) + 1
  const loopDot = (cx: number, cy: number, rx: number, ry: number, start: number, s: number) => {
    const a = start + 2 * Math.PI * s
    return [round1(cx + rx * Math.cos(a)), round1(cy + ry * Math.sin(a))]
  }
  const caption = t < 6 ? '심장 → 폐 → 심장 → 온몸 → 심장' : '1분이면 온몸의 혈액이 한 바퀴'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <ellipse cx={140} cy={56} rx={84} ry={36} fill="none" stroke={WHITE} strokeOpacity={0.25} strokeWidth={8} />
      <ellipse cx={140} cy={150} rx={104} ry={46} fill="none" stroke={WHITE} strokeOpacity={0.25} strokeWidth={8} />
      <text x={140} y={52} textAnchor="middle" fontSize={14} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        폐
      </text>
      <text x={140} y={166} textAnchor="middle" fontSize={14} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
        온몸
      </text>
      {Array.from({ length: 10 }, (_, i) => {
        const s = (i / 10 + t * 0.22) % 1
        // 폐순환: 심장(아래쪽)에서 나갈 때는 산소가 적은 피, 돌아올 때는 산소가 많은 피
        const [x, y] = loopDot(140, 56, 84, 36, Math.PI / 2, s)
        return <circle key={`l${i}`} cx={x} cy={y} r={5} fill={s < 0.5 ? BLUE : RED} />
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const s = (i / 12 + t * 0.22) % 1
        const [x, y] = loopDot(140, 150, 104, 46, -Math.PI / 2, s)
        return <circle key={`b${i}`} cx={x} cy={y} r={5} fill={s < 0.5 ? RED : BLUE} />
      })}
      <g transform={`translate(140 104) scale(${Math.round(2.2 * pulse * 1000) / 1000})`}>
        <path d={HEART} fill="#ef4444" />
      </g>

      <text x={322} y={70} textAnchor="middle" fontSize={14} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
        박동 {beats}번
      </text>
      <text x={322} y={104} textAnchor="middle" fontSize={30} fontWeight={800} fill={YELLOW}>
        {(beats * 0.07).toFixed(2)} L
      </text>
      <text x={322} y={126} textAnchor="middle" fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
        한 번에 약 70 mL
      </text>
      <text x={322} y={164} textAnchor="middle" fontSize={15} fontWeight={800} fill={WHITE} opacity={ramp(t, 6, 6.6)}>
        1분이면 약 5 L
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 유전자 가위: 안내 RNA 가 짝이 맞는 자리를 찾아 자름 ─────────────────────────
const TARGET_DNA = 'ATGCCGTAGGATCCTA'
const TARGET_AT = 6
const GUIDE = 'ATCCTA' // TARGET_DNA 의 6~11번 'TAGGAT' 과 짝을 이루는 염기
const CUT_AFTER = 8 // 이 염기 뒤를 자름
const SPACING = 22.5

function Crispr() {
  const { ref, t } = useLoop(12)
  // 한 칸씩 옮겨 가며 맞는 자리를 찾음
  const scan = Math.min(TARGET_AT, Math.floor(ramp(t, 0.8, 5) * (TARGET_AT + 0.99)))
  const found = t >= 5
  const cut = smooth(ramp(t, 6.4, 7.6))
  const bx = (i: number) => 32 + i * SPACING + (i > CUT_AFTER ? cut * 14 : -cut * 14)
  const caption = t < 5 ? '안내 RNA 가 짝이 맞는 염기 서열을 찾는다' : t < 7.6 ? '찾았다! Cas9 이 그 자리를 자른다' : '잘린 자리를 고치며 유전자를 편집'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <text x={20} y={56} fontSize={12} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
        DNA
      </text>
      {TARGET_DNA.split('').map((base, i) => {
        const inTarget = found && i >= TARGET_AT && i < TARGET_AT + GUIDE.length
        return (
          <g key={i}>
            <rect x={bx(i) - 11.25} y={70} width={22.5} height={4} fill={WHITE} fillOpacity={0.5} />
            <text x={bx(i)} y={100} textAnchor="middle" fontSize={17} fontWeight={800} fill={inTarget ? YELLOW : WHITE} fillOpacity={inTarget ? 1 : 0.85}>
              {base}
            </text>
          </g>
        )
      })}
      {/* Cas9 단백질과 안내 RNA */}
      <g opacity={1 - ramp(t, 9.5, 10.5)}>
        <rect x={32 + scan * SPACING - 18} y={108} width={GUIDE.length * SPACING + 14} height={64} rx={24} fill={PURPLE} fillOpacity={0.3} stroke={PURPLE} strokeWidth={2} />
        {GUIDE.split('').map((base, k) => {
          const i = scan + k
          const match = PAIR[TARGET_DNA[i]] === base
          return (
            <text key={k} x={32 + i * SPACING} y={134} textAnchor="middle" fontSize={17} fontWeight={800} fill={found ? YELLOW : match ? WHITE : RED}>
              {base}
            </text>
          )
        })}
        <text x={32 + (scan + (GUIDE.length - 1) / 2) * SPACING} y={160} textAnchor="middle" fontSize={11} fontWeight={800} fill={WHITE} fillOpacity={0.85}>
          Cas9 + 안내 RNA
        </text>
      </g>
      <text x={32 + (CUT_AFTER + 0.5) * SPACING} y={52} textAnchor="middle" fontSize={20} opacity={ramp(t, 6, 6.4) * (1 - ramp(t, 9.5, 10))}>
        ✂️
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 백신: 1차·2차 면역 반응의 항체 그래프 ──────────────────────────────────
const bump = (x: number) => (x > 0 ? x * x * Math.exp(2 * (1 - x)) : 0)
const antibody = (day: number) => 0.2 * bump((day - 1) / 1.8) + bump((day - 7) / 0.9)
const EXPOSURES: [number, string, number][] = [
  [1, '1차 항원 침입', 0.5],
  [7, '2차 항원 침입', 5.6],
]

function Vaccine() {
  const { ref, t } = useLoop(12)
  const shown = 12 * ramp(t, 0.5, 9.5)
  const px = (day: number) => 52 + day * 27
  const py = (v: number) => 186 - v * 150
  const curve = Array.from({ length: 121 }, (_, i) => i / 10)
    .filter((day) => day <= shown)
    .map((day, i) => `${i === 0 ? 'M' : 'L'}${px(day).toFixed(1)} ${py(antibody(day)).toFixed(1)}`)
    .join(' ')
  const caption = t < 5.5 ? '처음 만난 항원: 느리고 약한 1차 반응' : '기억 세포 덕분에 빠르고 강한 2차 반응'

  return (
    <svg ref={ref} viewBox="0 0 400 240" className="h-full w-full">
      <line x1={52} y1={186} x2={382} y2={186} stroke={WHITE} strokeOpacity={0.5} />
      <line x1={52} y1={22} x2={52} y2={186} stroke={WHITE} strokeOpacity={0.5} />
      <text x={44} y={30} textAnchor="end" fontSize={11} fontWeight={700} fill={WHITE} fillOpacity={0.7}>
        항체
      </text>
      <text x={382} y={202} textAnchor="end" fontSize={11} fill={WHITE} fillOpacity={0.7}>
        시간 →
      </text>
      {EXPOSURES.map(([day, label, at]) => (
        <g key={label} opacity={ramp(t, at, at + 0.4)}>
          <path d={`M${px(day)} 198 L${px(day)} 189 M${px(day) - 5} 194 L${px(day)} 189 L${px(day) + 5} 194`} stroke={YELLOW} strokeWidth={2} fill="none" />
          <text x={px(day)} y={211} textAnchor="middle" fontSize={11} fontWeight={800} fill={YELLOW}>
            {label}
          </text>
        </g>
      ))}
      <path d={curve} fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <text x={px(2.8)} y={py(0.2) - 10} textAnchor="middle" fontSize={12} fontWeight={800} fill={BLUE} opacity={ramp(t, 3.2, 3.7)}>
        1차 반응
      </text>
      <text x={px(7.9) + 24} y={py(1) + 14} fontSize={13} fontWeight={800} fill={RED} opacity={ramp(t, 8, 8.5)}>
        2차 반응
      </text>
      <Caption>{caption}</Caption>
    </svg>
  )
}

// ── 노벨 생리의학상: 교과서 속 수상 업적 ───────────────────────────────────
const LAUREATES: [string, string, string][] = [
  ['1901', '베링', '디프테리아 혈청 요법'],
  ['1930', '란트슈타이너', 'ABO 혈액형 발견'],
  ['1945', '플레밍 · 체인 · 플로리', '페니실린'],
  ['1962', '왓슨 · 크릭 · 윌킨스', 'DNA 이중 나선 구조'],
  ['1983', '매클린톡', '움직이는 유전자'],
  ['2023', '커리코 · 와이스먼', 'mRNA 백신의 기반'],
  ['2024', '앰브로스 · 러브컨', '마이크로RNA 발견'],
  ['2025', '브렁코 · 램즈델 · 사카구치', '조절 T 세포'],
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
      <text x={92} y={108} textAnchor="middle" fontSize={17} fontWeight={800} fill="#713f12">
        생리
      </text>
      <text x={92} y={129} textAnchor="middle" fontSize={17} fontWeight={800} fill="#713f12">
        의학
      </text>

      <g opacity={appear}>
        <text x={272} y={82} textAnchor="middle" fontSize={50} fontWeight={800} fill={YELLOW}>
          {year}
        </text>
        <text x={272} y={118} textAnchor="middle" fontSize={who.length > 14 ? 12.5 : who.length > 10 ? 14 : 19} fontWeight={800} fill={WHITE}>
          {who}
        </text>
        <text x={272} y={146} textAnchor="middle" fontSize={15} fontWeight={700} fill={WHITE} fillOpacity={0.8}>
          {what}
        </text>
      </g>
      {LAUREATES.map((_, i) => (
        <circle key={i} cx={272 + (i - (LAUREATES.length - 1) / 2) * 14} cy={176} r={3.5} fill={WHITE} fillOpacity={i === index ? 1 : 0.3} />
      ))}
      <Caption>1901년부터 이어진 생명과학의 가장 큰 상</Caption>
    </svg>
  )
}

const VISUALS: Record<string, () => JSX.Element> = {
  'topic-dna': Dna,
  'topic-mendel': Mendel,
  'topic-cell': Mitosis,
  'topic-photosynthesis': Photosynthesis,
  'topic-enzyme': Enzyme,
  'topic-neuron': Neuron,
  'topic-antibiotic': Antibiotic,
  'topic-moth': Moth,
  'topic-circulation': Circulation,
  'topic-crispr': Crispr,
  'topic-vaccine': Vaccine,
  'topic-nobel': Nobel,
}

export const hasTopicVisual = (topicId: string) => topicId in VISUALS

export default function TopicVisual({ topicId }: { topicId: string }) {
  const Visual = VISUALS[topicId]
  return Visual ? <Visual /> : null
}
