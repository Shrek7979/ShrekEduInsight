// 광고·홍보성 글과 개인 소식을 걸러 내는 규칙 (한곳에서 관리)
// 과목별 수집기(subjects/*/scripts/*.mjs)와 사이트(src/lib/sources.ts)가 함께 씀 → 저장 전에도, 화면에 싣기 전에도 한 번 더 거름

// 개인 소식: 부고, 임명·위촉, 취임·퇴임, 인사 발령, 기부·발전기금, 기업 인재 영입·대표 선임, 개인 수상, 사연 기사 등
// '선임연구원' 같은 직급은 남김
export const PERSONAL_NEWS =
  /부고|별세|타계|영면|빈소|발인|장례|추도식|추모식|조문|부음|訃|임명|위촉|임용장|수여식|취임|이임식|퇴임|승진|인사\s?발령|인사이동|전보\s?발령|\[인사\]|\[동정\]|내정|화촉|결혼식|선임(?!연구|기자|병|원)|기부|발전기금|장학기금|장학금 ?(전달|기탁)|후원금|인재 ?영입|각자 ?대표|대표 ?선임|신임 ?대표|(박사|석사|석박사|석박통합)과정생.{0,60}(수상|선정)|우수(학생)?(연구자|논문|발표)상|포스터상|공로상|감사패|공예작가|희망 이야기\]|obituar|in memoriam|passed away|\b(dies|died|dead) at \d|funeral|\bappointed\b|\bnamed (new |as )?(president|director|dean|chair|head|editor|ceo)\b|\bretire(s|ment)\b|steps down|\bleft us\b/i

// 광고·홍보성 글: 광고 표시, 할인·이벤트, 출시·출간·MOU 같은 기업·상품 홍보, 학원·컨설팅·학습지,
// 자격증·평생교육 과정 모집, 주식 테마, 단체장 동정, 학회·저널의 행사 등록·초록 모집·회원 안내 등
export const PROMO_NEWS =
  /\[(광고|AD|PR|홍보|협찬|스폰서|기획광고|애드버토리얼)\]|\(광고\)|광고|협찬|애드버토리얼|프로모션|특가|할인 ?(행사|이벤트|판매|혜택)|\d+% ?할인|(숙박료|숙박 ?요금|요금|입장료) ?할인|사은품|증정 ?이벤트|이벤트 ?(진행|개최|실시)|쿠폰|선착순|판매 ?(개시|시작)|신제품|출시|론칭|런칭|시장 ?(공략|진출)|출간|출판기념회|신간|업무 ?협약|\bMOU\b|사업 ?확대|세계 ?1위 ?도전|(참가자|수강생|회원|봉사자|홍보대사|체험단) ?모집|무료 ?체험|입시 ?설명회|입시 ?컨설팅|컨설팅\]|(학원|교습소|에듀).{0,20}(대표|원장|개원|오픈)|(대표|원장).{0,15}(학원|교습소)|구몬|눈높이|밀크T|엘리하이|윤선생|토크 ?콘서트|정보과학교육원|평생교육원|학점은행|사회복지사|자격증 ?(과정|취득|반)|(기업|사업자|앵커사업|TIPS|팁스) ?선정|불기둥|상한가|테마주|등록 ?(마감|종료)|예약하세요|초대합니다|예능|출격|수험생.{0,20}(팔꿈치|허리|목|척추|관절)|(팔꿈치|허리|척추|관절|거북목).{0,20}(붓|통증|아프)|(구청장|시장|군수|도지사|국회의원|교육감).{0,30}(축하|축사|방문|격려)|sponsored|partner content|paid post|advertorial|promo code|\bdiscount|\bgiveaway|\bcoupon|buy now|limited[- ]time offer|\bregist(er|ration)\b|\bbook (now|your)\b|call for (abstracts|papers|submissions)|submit (an|your) (abstract|paper|work|research)|\bwebinar\b|\btickets?\b|come see|\bpatrons?\b|patreon|\bambassador\b|\bvolunteer\b|\binvitation\b|you.?re invited|\belections?\b|\bballot\b|hot off the press|white ?paper|^introducing\b|\bnew issue\b|is (now )?online\b|calling all|meet us at|accreditation|^TBA\b|now streaming|\bjoin us\b|kick-?off|start(s|ing) in \d+ minutes|going solo|heading to solo|ready to explore|meet the experts|one month until|best papers|presented by|@rolex|if you.?re a librarian|looking for a home for|we welcome (research|studies|submissions|papers)|prelims corner|department awards|training opportunities|discover trading|where the next[- ]generation of collaboration/i

// 설명(요약)에만 드러나는 광고: 협찬·제작 지원 표시, 기업 보도자료(대표 이름·종목 코드), 행사 등록 안내
export const PROMO_SUMMARY =
  /프로모션\s?\(PR\)|\(PR\)이 포함|지원을 받아 제작|유료 ?광고|광고를 포함|협찬|sponsored by|paid partnership|presented by|@rolex|\(대표(이사)? [가-힣]{2,4}\)|대표이사 [가-힣]{2,4}|\(\d{6}\)|\d{4} JP\)|전문 ?기업 |스트리밍 중|now streaming|submit an abstract|book your place|register (now|by|today)|early[- ]bird|\bwebinar\b|\bkeynotes?\b|\bjoin us\b|meet us at|book now/i

// 카드 설명에서 지울 홍보 문구 (영상 설명란의 굿즈·멤버십·세일·강사 소개·계정 홍보). 글 자체는 남김
const PROMO_LINE =
  /세일|굿즈|항공점퍼|텀블러|머치|merch|멤버십에 가입|멤버십 가입|채널 ?가입|구독(과|하고|해| ?부탁)|instagram id|인스타그램 id|@\w+ ?에서 시청|(시대인재|대성마이맥|메가스터디|이투스|강남대성|러셀).{0,10}강사|출신 .{0,30}강사$|문의 ?:|협업 ?문의|비즈니스 ?문의/i

// 개인 블로그 (note.com 같은 개인 글 모음)는 싣지 않음
const BLOCKED_SOURCES = /^note$/i

const text = (...parts) => parts.filter(Boolean).join(' ')

// 싣지 않을 글이면 그 이유('개인 소식' | '광고·홍보'), 실어도 되면 null
export function unwantedReason(item) {
  if (BLOCKED_SOURCES.test(item.source || '')) return '개인 소식'
  const title = text(item.title, item.titleKo)
  if (PERSONAL_NEWS.test(title)) return '개인 소식'
  if (PROMO_NEWS.test(title)) return '광고·홍보'
  if (PROMO_SUMMARY.test(text(item.summary, item.summaryKo, item.detail, item.detailKo))) return '광고·홍보'
  return null
}

export const isUnwanted = (item) => unwantedReason(item) !== null

// 설명에 홍보 문구만 있으면 비움 (제목·링크 등은 그대로)
/** @template T @param {T} item @returns {T} */
export function stripPromo(item) {
  const next = { ...item }
  for (const key of ['summary', 'summaryKo', 'detail', 'detailKo']) {
    if (next[key] && PROMO_LINE.test(next[key])) next[key] = ''
  }
  return next
}
