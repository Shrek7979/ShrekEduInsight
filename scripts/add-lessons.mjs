// 카드마다 '수업 활용' 한두 문장을 Claude 로 만들어 subjects/<과목>/data/lessons.json 에 저장합니다.
// 실행: node scripts/add-lessons.mjs        (배포 워크플로가 수집 뒤에 실행)
//       node scripts/add-lessons.mjs math   → 고른 과목만
// ANTHROPIC_API_KEY 가 없으면 아무것도 하지 않음. 이미 만든 카드는 다시 만들지 않으므로 새 카드에만 비용이 듦
// 카드 id 로 따로 저장하므로 수집기가 카드를 새로 만들어도 수업 활용은 그대로 남음
import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { z } from 'zod'
import { isUnwanted } from '../src/lib/content-filter.mjs'

const MODEL = process.env.LESSON_MODEL || 'claude-opus-5-5'
const BATCH = 25 // 한 번에 보내는 카드 수
const MAX_PER_RUN = 300 // 한 번 실행에서 새로 만드는 최대 개수 (처음 몰아서 만들 때 비용·시간 제한)
const SUBJECT_NAMES = { math: '수학', phys: '물리학', chem: '화학', bio: '생명과학' }

if (!process.env.ANTHROPIC_API_KEY) {
  console.log('ANTHROPIC_API_KEY 가 없어 수업 활용 만들기를 건너뜁니다.')
  process.exit(0)
}

const client = new Anthropic()

const Lessons = z.object({
  lessons: z.array(z.object({ id: z.string(), lesson: z.string() })),
})

const systemPrompt = (subject) =>
  `당신은 한국 중·고등학교 ${SUBJECT_NAMES[subject]} 교사를 돕는 수업 설계 도우미입니다. ` +
  '교사가 이 뉴스·영상·SNS 게시물을 수업에서 어떻게 쓸 수 있는지 카드마다 한국어 1~2문장(90자 이내)으로 써 주세요. ' +
  '관련 개념이나 단원을 짚고, 도입 자료·토론 주제·탐구 활동·어림셈·자료 해석처럼 바로 해 볼 수 있는 활동을 구체적으로 제안합니다. ' +
  "글에 나온 내용만 근거로 삼고 사실을 지어내지 마세요. 문장은 '~해요' 체로 끝냅니다. " +
  '수업과 연결하기 어려운 글(행정·지역 소식, 단순 행사 안내 등)은 lesson 을 빈 문자열로 두세요. ' +
  '입력으로 받은 id 를 그대로 돌려주세요.'

async function generate(subject, items) {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // 안전 분류기가 거절하면 서버가 다른 모델로 다시 시도
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: betaZodOutputFormat(Lessons) },
    system: systemPrompt(subject),
    messages: [
      {
        role: 'user',
        content: JSON.stringify(
          items.map((item) => ({
            id: item.id,
            type: item.kind === 'video' ? '영상' : /^(Instagram|Facebook) /.test(item.source || '') ? 'SNS' : '기사',
            title: item.titleKo || item.title,
            summary: item.detailKo || item.detail || item.summaryKo || item.summary || '',
            source: item.source,
          }))
        ),
      },
    ],
  })
  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new Error(`결과를 읽지 못했습니다 (${response.stop_reason})`)
  }
  return response.parsed_output.lessons
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return fallback
  }
}

async function run(subject, budget) {
  const dir = resolve('subjects', subject, 'data')
  const cards = [
    ...(await readJson(resolve(dir, 'feed.json'), { items: [] })).items,
    ...(await readJson(resolve(dir, 'instagram.json'), { items: [] })).items,
    ...(await readJson(resolve(dir, 'facebook.json'), { items: [] })).items,
  ].filter((item) => !isUnwanted(item))
  const path = resolve(dir, 'lessons.json')
  const saved = (await readJson(path, { lessons: {} })).lessons || {}

  // 지금 실려 있는 카드 것만 남김 (파일이 계속 커지지 않게)
  const lessons = {}
  for (const item of cards) if (item.id in saved) lessons[item.id] = saved[item.id]
  const missing = cards.filter((item) => !(item.id in lessons))
  const targets = missing.slice(0, budget)

  let made = 0
  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH)
    try {
      const ids = new Set(batch.map((item) => item.id))
      for (const { id, lesson } of await generate(subject, batch)) {
        if (!ids.has(id)) continue
        lessons[id] = lesson.trim()
        made++
      }
    } catch (error) {
      console.warn(`[${subject}] ✗ ${batch.length}건 실패: ${error.message}`)
    }
  }

  const sorted = Object.fromEntries(Object.entries(lessons).sort(([a], [b]) => a.localeCompare(b)))
  const changed = JSON.stringify(sorted) !== JSON.stringify(saved)
  if (changed) await writeFile(path, JSON.stringify({ lessons: sorted }, null, 2) + '\n')
  console.log(`[${subject}] ✓ 새로 ${made}건 (전체 ${Object.keys(sorted).length}건, 아직 없는 카드 ${missing.length - made}건)`)
}

const picked = process.argv.slice(2)
const subjects = picked.length ? picked : Object.keys(SUBJECT_NAMES)
await Promise.all(subjects.map((subject) => run(subject, Math.ceil(MAX_PER_RUN / subjects.length))))
