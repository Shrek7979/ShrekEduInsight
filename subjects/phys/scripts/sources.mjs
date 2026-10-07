// 수집 대상 목록. 여기에 항목을 추가/삭제하면 다음 수집부터 반영됩니다.
// type: bing(빙 뉴스 검색) | rss(일반 RSS/Atom) | youtube(채널 최신) | youtube-top(여러 채널의 최근 영상 중 조회수 상위) | bluesky(계정 최근 글)
// category 를 적으면 키워드 분류 대신 그 카테고리로 고정

// qft=sortbydate="1": 관련도순이 아니라 최신순으로 받아 방금 나온 기사부터 수집
const bing = (q) =>
  `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&mkt=ko-KR&qft=${encodeURIComponent('sortbydate="1"')}`
const youtube = (channelId) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

export const SOURCES = [
  // 국내 뉴스 (빙 뉴스 검색: 기사 원문 링크 + 섬네일 제공. 구글 뉴스는 원문 링크를 숨겨 섬네일을 못 얻으므로 제외)
  { type: 'bing', lang: 'ko', url: bing('과학 교육'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('통합과학'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('물리 교사'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('물리 실험 수업'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('수능 과학탐구'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('물리학 연구팀'), limit: 8, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('노벨물리학상'), limit: 5, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('양자 연구'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('핵융합 KSTAR'), limit: 4, maxAgeDays: 7 },
  { type: 'bing', lang: 'ko', url: bing('천문연구원 우주'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('과학 올림피아드'), limit: 4, maxAgeDays: 3 },

  // 교육 전문지 전체 기사 피드 (제목에 '물리'·'과학 교육' 등이 들어간 기사만 통과)
  { type: 'rss', lang: 'ko', name: '에듀프레스', url: 'https://www.edupress.kr/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '베리타스알파', url: 'https://www.veritas-a.com/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '에듀인뉴스', url: 'https://www.eduinnews.co.kr/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '교수신문', url: 'https://www.kyosu.net/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '헬로디디', url: 'https://www.hellodd.com/rss/allArticle.xml', limit: 4, maxAgeDays: 5 },

  // 해외 물리 매체 (trusted: 물리 전문 매체라 키워드 필터를 건너뜀)
  { type: 'rss', lang: 'en', name: 'Physics World', trusted: true, url: 'https://physicsworld.com/feed/', limit: 5, maxAgeDays: 7 },
  // Phys.org 는 기사 화면·이미지가 봇 차단(Cloudflare)에 걸려 섬네일을 얻을 수 없어 제외
  { type: 'rss', lang: 'en', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/matter_energy/physics.xml', limit: 4, maxAgeDays: 14 },
  { type: 'rss', lang: 'en', name: 'Quanta Magazine', url: 'https://api.quantamagazine.org/feed/', limit: 2, maxAgeDays: 30 },
  { type: 'rss', lang: 'en', name: 'Science', url: 'https://www.science.org/rss/news_current.xml', require: /physic|quantum|particle|neutrino|astronom|cosmo|galax|black hole|gravit|laser|photon|superconduct|magnet|fusion|relativ|dark matter|telescope/i, limit: 2, maxAgeDays: 7 }, // Science(AAAS) 뉴스 — 제목에 과목 낱말이 있는 기사만
  // 고급 저널 (논문): 피드 전체가 물리라 낱말 거르기 없이
  { type: 'rss', lang: 'en', name: 'Physical Review Letters', trusted: true, category: '연구', url: 'https://feeds.aps.org/rss/recent/prl.xml', limit: 2, maxAgeDays: 7 },
  { type: 'rss', lang: 'en', name: 'Nature Physics', trusted: true, category: '연구', url: 'https://www.nature.com/nphys.rss', limit: 2, maxAgeDays: 14 },

  // SNS 인기 게시물: 물리 유튜브 채널들의 최근 영상 중 조회수가 많은 것만 싣습니다.
  // 국내 채널은 조회수 규모가 작아 해외 채널과 따로 뽑습니다.
  {
    type: 'youtube-top',
    name: '유튜브 인기 (국내)',
    lang: 'ko',
    category: '인기',
    limit: 6,
    maxAgeDays: 30,
    minViews: 1000, // 이 조회수 미만이면 싣지 않음
    channels: [
      ['과학쿠키', 'UCmgRYMK5d65PbjN8qkjAUBA', 'ko'],
      ['안될과학', 'UCMc4EmuDxnHPc6pgGW-QWvQ', 'ko'],
      ['범준에 물리다', 'UC1Yctn_P1sZjx1lMS9dcSSA', 'ko'],
      ['지식보관소', 'UC1Do3xw9OuUk7FQuPTmSVOw', 'ko'],
      ['세모과학', 'UCWe8t83GL8J-N3a4ZF6BG-Q', 'ko'],
      ['석군 seokkun', 'UCsOmBJ5jPTufS7sHea1HiTw', 'ko'],
      ['베리타시움 한국어', 'UCOgK3J7WTOl5f5Fd51kcoSg', 'ko'],
      ['김광명의 물리세계', 'UC9XCaZgXLhrICTfbNVLXkng', 'ko'],
    ],
  },
  {
    type: 'youtube-top',
    name: '유튜브 인기 (해외)',
    lang: 'en',
    category: '인기',
    limit: 8,
    maxAgeDays: 30,
    minViews: 10000,
    channels: [
      ['Veritasium', 'UCHnyfMqiRRG1u-2MsSQLbXA', 'en'],
      ['minutephysics', 'UCUHW94eEFW7hkUMVaZz4eDg', 'en'],
      ['PBS Space Time', 'UC7_gcs09iThXybpVgjHZ_7g', 'en'],
      ['Steve Mould', 'UCEIwxahdLz7bap-VDs9h35A', 'en'],
      ['The Action Lab', 'UC1VLQPn9cYSqx8plbk9RxxQ', 'en'],
      ['Physics Girl', 'UC7DdEm33SyaTDtWYGO2CwdA', 'en'],
      ['FloatHeadPhysics', 'UCGfFUc6eWxfbtjYeun6r9xg', 'en'],
      ['Physics Explained', 'UCIZ5ZOeiXYbmKTl_85ghNPw', 'en'],
      ['Dr. Becky', 'UCYNbYGl89UUowy8oXkipC-Q', 'en'],
    ],
  },

  // 블루스카이: 물리 매체·학회 계정의 최근 글 (공개 API 라 GitHub 서버에서도 1시간마다 수집됨)
  { type: 'bluesky', lang: 'en', name: 'Physics World', handle: 'physicsworld.bsky.social', category: '인기', limit: 3, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'APS Physics', handle: 'apsphysics.aps.org', category: '인기', limit: 3, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'Quanta Magazine', handle: 'quantamagazine.org', category: '인기', limit: 2, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'CERN', handle: 'cern.bsky.social', category: '인기', limit: 2, maxAgeDays: 14 },
  { type: 'bluesky', lang: 'en', name: 'Physics Today', handle: 'physicstoday.aip.org', category: '인기', limit: 2, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'Nature Physics', handle: 'natphys.nature.com', category: '인기', limit: 2, maxAgeDays: 7 },
]

export const youtubeFeed = youtube

// 인스타그램: 최근 게시물을 카드로 보여 줄 물리 계정 [계정, 언어]. scripts/collect-instagram.mjs 가 사용
export const INSTAGRAM_ACCOUNTS = [
  ['physicsgirl', 'en'],
  ['veritasium', 'en'],
  ['cern', 'en'],
  ['physicsworld', 'en'],
  ['minutephysics', 'en'],
  ['theactionlab', 'en'],
]

// 페이스북: 최신 게시물을 카드로 보여 줄 물리 페이지 [주소 이름, 표시 이름, 언어]. scripts/collect-facebook.mjs 가 사용
export const FACEBOOK_PAGES = [
  ['physicsworld', 'Physics World', 'en'],
  ['APSphysics', 'American Physical Society', 'en'],
  ['cern', 'CERN', 'en'],
  ['physicsgirl', 'Physics Girl', 'en'],
  ['minutephysics', 'minutephysics', 'en'],
]

// 국내 기사: 제목에 반드시 포함해야 할 것 / 걸러낼 것
export const KO_REQUIRE =
  /물리|노벨물리|노벨과학|양자|상대성|중력파|블랙홀|핵융합|입자|가속기|초전도|레이저|광자|전자기|망원경|천문|과학탐구|과탐|사탐런|통합과학|과학 ?교육|과학 ?교사|과학 ?수업|과학고|(과학|물리) ?올림피아드/
// '물리'가 들어가도 물리치료·물리적 충돌·정치 기사는 걸러냄
export const KO_EXCLUDE =
  /물리치료|물리적 ?(충돌|거리|폭력|위협|공격|보안|분리|한계)|물리력|물리보안|양자택일|양자 ?(회담|협상|대결|구도|간)|미세 ?입자|양자내성암호|비트코인|코인|가상자산|암호화폐|부음|부친상|모친상|별세|코스피|주가|특징주|목표가|증권|영업이익|실적|매출|수주|상장|포토뉴스|부고|인사\]/

// 해외 과학 매체는 물리와 무관한 기사가 섞여 있어 키워드로 한 번 더 거름
export const EN_REQUIRE =
  /physic|quantum|particle|photon|laser|optic|relativ|gravit|black hole|neutrino|electron|proton|\batom|magnet|superconduct|semiconductor|plasma|fusion|cosmolog|dark matter|dark energy|universe|galax|telescope|nobel/i

// 기계 번역 기사 등 품질이 낮아 제외할 출처
export const BLOCKED_SOURCES = ['IDNFinancials', 'Vietnam.vn', 'Histoire pour Tous', 'Coinfomania']

// 위에서부터 먼저 맞는 카테고리로 분류, 아무것도 안 맞으면 '교육'
export const KO_CATEGORIES = [
  ['입시', /수능|모의고사|모의평가|모평|입시|내신|대입|정시|수시|과탐|사탐런/],
  ['대회·행사', /올림피아드|경시|대회|축제|체험전|페스티벌|캠프|박람회/],
  ['우주·천문', /우주|천문|블랙홀|중력파|은하|망원경|행성|위성|누리호|달 ?탐사|화성/],
  ['양자·첨단', /양자|반도체|초전도|레이저|핵융합|가속기|입자|나노|광자/],
  ['연구', /노벨|연구|개발|논문|학회|규명|발견|실험|측정/],
]
