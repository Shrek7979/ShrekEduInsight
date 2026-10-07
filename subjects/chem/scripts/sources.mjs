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
  { type: 'bing', lang: 'ko', url: bing('화학 교사'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('화학 실험 수업'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('수능 과학탐구'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('화학 연구팀 개발'), limit: 8, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('노벨화학상'), limit: 5, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('촉매 신소재 개발'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('과학 올림피아드'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('화학물질 안전'), limit: 4, maxAgeDays: 3 },

  // 교육 전문지 전체 기사 피드 (제목에 '화학'·'과학 교육' 등이 들어간 기사만 통과)
  { type: 'rss', lang: 'ko', name: '에듀프레스', url: 'https://www.edupress.kr/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '베리타스알파', url: 'https://www.veritas-a.com/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '에듀인뉴스', url: 'https://www.eduinnews.co.kr/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '교수신문', url: 'https://www.kyosu.net/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '헬로디디', url: 'https://www.hellodd.com/rss/allArticle.xml', limit: 4, maxAgeDays: 5 },

  // 해외 화학 매체 (trusted: 화학 전문 매체라 키워드 필터를 건너뜀)
  { type: 'rss', lang: 'en', name: 'C&EN', trusted: true, url: 'https://cen.acs.org/feeds/rss/latestnews.xml', limit: 4, maxAgeDays: 7 },
  // Phys.org 는 기사 화면·이미지가 봇 차단(Cloudflare)에 걸려 섬네일을 얻을 수 없어 제외
  { type: 'rss', lang: 'en', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/matter_energy/chemistry.xml', limit: 4, maxAgeDays: 14 },
  { type: 'rss', lang: 'en', name: 'Compound Interest', trusted: true, url: 'https://www.compoundchem.com/feed/', limit: 2, maxAgeDays: 30 },
  { type: 'rss', lang: 'en', name: 'Science', url: 'https://www.science.org/rss/news_current.xml', require: /chemi|molecul|catalys|reaction|compound|polymer|battery|element|crystal|material|synthes|enzyme|plastic/i, limit: 2, maxAgeDays: 7 }, // Science(AAAS) 뉴스 — 제목에 과목 낱말이 있는 기사만
  // 고급 저널 (논문): 피드 전체가 화학이라 낱말 거르기 없이. JACS(ACS)는 사이트가 자동 접속을 막아 대신 Angewandte·Chem
  { type: 'rss', lang: 'en', name: 'Nature Chemistry', trusted: true, category: '연구', url: 'https://www.nature.com/nchem.rss', limit: 2, maxAgeDays: 21 },
  { type: 'rss', lang: 'en', name: 'Angewandte Chemie', trusted: true, category: '연구', url: 'https://onlinelibrary.wiley.com/feed/15213773/most-recent', limit: 2, maxAgeDays: 7 },
  { type: 'rss', lang: 'en', name: 'Chem (Cell Press)', trusted: true, category: '연구', url: 'https://www.cell.com/chem/current.rss', limit: 2, maxAgeDays: 30 },

  // SNS 인기 게시물: 화학 유튜브 채널들의 최근 영상 중 조회수가 많은 것만 싣습니다.
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
      ['화학하악', 'UCCScEriE--bvE5R5qRhasaw', 'ko'],
      ['한국화학연구원 KRICT', 'UChdvij3a4Sn8neSYhkRZ1vg', 'ko'],
      ['대한화학회', 'UCM4NiS9_5pU-JRXrvoMlsFw', 'ko'],
      ['티노화학', 'UClVE9AYJH2cvVOmGKmMdu6w', 'ko'],
      ['탑사이언스', 'UCY98cuZMjrLQKwyRT1mRa0Q', 'ko'],
      ['송쌤', 'UCs3QUdrwABgfS0_NbNFLutg', 'ko'],
    ],
  },
  {
    type: 'youtube-top',
    name: '유튜브 인기 (해외)',
    lang: 'en',
    category: '인기',
    limit: 8,
    maxAgeDays: 45, // 해외 화학 채널은 영상이 드물게 올라와 기간을 넓게 잡음
    minViews: 10000,
    channels: [
      ['NileRed', 'UCFhXFikryT4aFcLkLw2LBLA', 'en'],
      ['NileBlue', 'UC1D3yD4wlPMico0dss264XA', 'en'],
      ['Periodic Videos', 'UCtESv1e7ntJaLJYKIO1FoYw', 'en'],
      ['Reactions', 'UCdJ9oJ2GUF8Vmb-G63ldGWg', 'en'],
      ['Explosions&Fire', 'UCVovvq34gd0ps5cVYNZrc7A', 'en'],
      ['ChemicalForce', 'UCqONNjBkukcc2yXbmHL8niQ', 'en'],
      ['NurdRage', 'UCIgKGGJkt1MrNmhq3vRibYA', 'en'],
    ],
  },

  // 블루스카이: 화학 매체·학회 계정의 최근 글 (공개 API 라 GitHub 서버에서도 1시간마다 수집됨)
  { type: 'bluesky', lang: 'en', name: 'Compound Interest', handle: 'compoundchem.com', category: '인기', limit: 3, maxAgeDays: 21 },
  { type: 'bluesky', lang: 'en', name: 'C&EN', handle: 'cenmag.bsky.social', category: '인기', limit: 3, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'Chemistry World', handle: 'chemistryworld.com', category: '인기', limit: 3, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'American Chemical Society', handle: 'acs.org', category: '인기', limit: 2, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'Nature Chemistry', handle: 'natchem.nature.com', category: '인기', limit: 2, maxAgeDays: 7 },

  // 네이버 블로그 (trusted: 화학 전문 기관이라 키워드 필터를 건너뜀)
  { type: 'rss', lang: 'ko', name: '네이버 블로그 한국화학연구원', trusted: true, category: '인기', url: 'https://rss.blog.naver.com/krictblog.xml', limit: 3, maxAgeDays: 14 },
]

export const youtubeFeed = youtube

// 인스타그램: 최근 게시물을 카드로 보여 줄 화학 계정 [계정, 언어]. scripts/collect-instagram.mjs 가 사용
export const INSTAGRAM_ACCOUNTS = [
  ['compoundchem', 'en'],
  ['amerchemsociety', 'en'],
  ['nile.red', 'en'],
  ['roysocchem', 'en'],
  ['periodicvideos', 'en'],
  ['acsreactions', 'en'],
]

// 페이스북: 최신 게시물을 카드로 보여 줄 화학 페이지 [주소 이름, 표시 이름, 언어]. scripts/collect-facebook.mjs 가 사용
export const FACEBOOK_PAGES = [
  ['AmericanChemicalSociety', 'American Chemical Society', 'en'],
  ['compoundchem', 'Compound Interest', 'en'],
  ['periodicvideos', 'Periodic Videos', 'en'],
  ['RoyalSocietyofChemistry', 'Royal Society of Chemistry', 'en'],
  ['ACSReactions', 'Reactions', 'en'],
]

// 국내 기사: 제목에 반드시 포함해야 할 것 / 걸러낼 것
export const KO_REQUIRE = /화학|노벨화학|노벨과학|원소|분자|촉매|신소재|주기율표|과학탐구|과탐|사탐런|통합과학|과학 ?교육|과학 ?교사|과학 ?수업|과학고|(과학|화학) ?올림피아드/
// '화학'으로 검색하면 기업·주식 기사가 대부분이라 회사 이름과 증시 용어를 걸러냄
export const KO_EXCLUDE =
  /LG화학|롯데|한화|금호석유|석유화학|코스피|담합|구조대|수학|화학주|화학업|주가|특징주|목표가|증권|영업이익|실적|매출|수주|상장|화학적 거세|포토뉴스|부고|인사\]/

// 해외 과학 매체는 화학과 무관한 기사가 섞여 있어 키워드로 한 번 더 거름
export const EN_REQUIRE =
  /chemi|molecul|catalys|polymer|reaction|synthes|\belement|\batom|compound|batter|crystal|\bacid|carbon|hydrogen|enzyme|nobel|periodic|solvent|\bion/i

// 기계 번역 기사 등 품질이 낮아 제외할 출처
export const BLOCKED_SOURCES = ['IDNFinancials', 'Vietnam.vn', 'Histoire pour Tous']

// 위에서부터 먼저 맞는 카테고리로 분류, 아무것도 안 맞으면 '교육'
export const KO_CATEGORIES = [
  ['입시', /수능|모의고사|모의평가|모평|입시|내신|대입|정시|수시|과탐|사탐런/],
  ['대회·행사', /올림피아드|경시|대회|축제|체험전|페스티벌|캠프|박람회/],
  ['환경·안전', /사고|누출|유출|유해|안전|미세플라스틱|오염|폭발|화재|독성|규제/],
  ['소재·에너지', /배터리|전지|수소|신소재|반도체|촉매|태양|플라스틱|소재|탄소|나노/],
  ['연구', /노벨|연구|개발|논문|학회|규명|발견|합성/],
]
