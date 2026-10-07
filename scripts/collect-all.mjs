// 네 과목을 한꺼번에 수집: 과목마다 subjects/<과목> 폴더에서 그 과목의 수집기를 실행 (동시에 돌려 시간을 줄임)
// 사용: node scripts/collect-all.mjs news   → 뉴스·영상·저널 (번역·섬네일 포함)
//       node scripts/collect-all.mjs sns    → 인스타그램·페이스북 게시물
//       node scripts/collect-all.mjs ig     → 인스타그램만 (PC 예약 작업용. 한꺼번에 요청하면 막히므로 과목을 하나씩 차례로)
//       node scripts/collect-all.mjs news math phys   → 고른 과목만
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SUBJECTS = ['math', 'phys', 'chem', 'bio']
const JOBS = {
  news: ['collect.mjs'],
  sns: ['collect-instagram.mjs', 'collect-facebook.mjs'],
  ig: ['collect-instagram.mjs'],
}

const [mode = 'news', ...picked] = process.argv.slice(2)
const scripts = JOBS[mode]
if (!scripts) {
  console.error(`알 수 없는 작업: ${mode} (news, sns, ig 중 하나)`)
  process.exit(1)
}
const subjects = picked.length ? picked : SUBJECTS

function run(subject, script) {
  const cwd = resolve('subjects', subject)
  const file = resolve(cwd, 'scripts', script)
  if (!existsSync(file)) return Promise.resolve({ subject, script, code: 0, skipped: true })
  return new Promise((done) => {
    const child = spawn(process.execPath, [file], { cwd, env: process.env })
    // 과목 이름을 줄마다 붙여서 섞여 나와도 알아보게 함
    const tag = (stream, out) =>
      stream.on('data', (chunk) => {
        for (const line of chunk.toString().split(/\r?\n/)) if (line.trim()) out.write(`[${subject}] ${line}\n`)
      })
    tag(child.stdout, process.stdout)
    tag(child.stderr, process.stderr)
    child.on('close', (code) => done({ subject, script, code }))
  })
}

// 과목끼리는 동시에(인스타그램만 차례로), 한 과목 안의 스크립트는 차례로
const runSubject = async (subject) => {
  const out = []
  for (const script of scripts) out.push(await run(subject, script))
  return out
}
const results = []
if (mode === 'ig') for (const subject of subjects) results.push(...(await runSubject(subject)))
else results.push(...(await Promise.all(subjects.map(runSubject))).flat())

console.log('\n── 결과')
for (const r of results) console.log(`${r.code === 0 ? '✓' : '✗'} ${r.subject} ${r.script}${r.skipped ? ' (없음)' : r.code ? ` (종료 코드 ${r.code})` : ''}`)
// 한 과목이 실패해도 나머지 결과는 저장되므로, 모두 실패했을 때만 실패로 알림
process.exit(results.every((r) => r.code !== 0) ? 1 : 0)
