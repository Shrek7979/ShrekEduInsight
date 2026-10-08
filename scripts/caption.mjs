// SNS 글(인스타그램·페이스북·블루스카이)을 카드의 제목·설명으로 나누는 도구. 네 과목 수집기가 함께 씀
// 번역은 제목·설명을 따로 하므로, 단어 중간에서 자르거나 낱말을 빼먹으면 번역이 깨짐 → 문장 단위로 자르고 해시태그도 낱말로 살림

// 'Dr.', 'Henri B.', 'e.g.' 같은 약어의 마침표는 문장 끝으로 보지 않음
const SENTENCE_END = /(?<!\b(?:Dr|Mr|Mrs|Ms|Prof|St|Jr|Sr|vs|al|Fig|No|Vol|Inc|Ltd|Co|e\.g|i\.e|U\.S|[A-Z]))[.!?。](?=\s|$)/

// 끝에 몰려 있는 해시태그 묶음은 지우고, 문장 속 해시태그는 낱말로 바꿈 (#NobelPrize → Nobel Prize)
export function cleanHashtags(text) {
  return text
    .replace(/(?:\s*#[^\s#]+)+\s*$/u, '')
    .replace(/#([^\s#]+)/gu, (_, word) => word.replace(/([a-z])([A-Z])/g, '$1 $2'))
}

// 첫 문장을 제목으로, 나머지를 설명으로. 첫 문장이 너무 길면 단어 경계에서 자르고 '…' 를 붙임
export function splitCaption(text, max = 140) {
  for (let from = 0; from < text.length; ) {
    const match = SENTENCE_END.exec(text.slice(from))
    if (!match) break
    const end = from + match.index + 1
    if (end > max) break
    if (end >= 8) return { title: text.slice(0, end), rest: text.slice(end).trim() }
    from = end
  }
  if (text.length <= max) return { title: text, rest: '' }
  const cut = text.slice(0, max).replace(/\s+\S*$/, '')
  return { title: `${cut}…`, rest: text.slice(cut.length).trim() }
}

// 예전 방식으로 단어 중간에서 잘린 카드인지 (제목이 '…' 로 끝나고 설명이 소문자로 이어짐) → 다시 읽어 고침
export const isBrokenSplit = (item) => /…$/.test(item.title || '') && /^[a-z]/.test(item.summary || '')
