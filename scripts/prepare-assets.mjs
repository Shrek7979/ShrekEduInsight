// 과목 폴더의 섬네일·SNS 그림을 사이트에서 보이는 자리(public/s/<과목>)로 복사. 빌드·개발 서버 시작 전에 자동 실행
import { cpSync, existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

for (const subject of ['math', 'phys', 'chem', 'bio']) {
  const out = resolve('public/s', subject)
  rmSync(out, { recursive: true, force: true })
  for (const dir of ['thumbs', 'social']) {
    const from = resolve('subjects', subject, 'public', dir)
    if (existsSync(from)) cpSync(from, resolve(out, dir), { recursive: true })
  }
}
console.log('섬네일 복사 → public/s/<과목>')
