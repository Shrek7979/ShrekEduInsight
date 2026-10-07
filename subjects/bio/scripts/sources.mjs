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
  // '생명과학 교사'·'생물 다양성'·'통합과학' 은 화재·기업 홍보 기사만 나와서 뺌
  { type: 'bing', lang: 'ko', url: bing('과학 교육'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('과학 교사'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('과학전람회'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('수능 과학탐구'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('생명과학 연구팀'), limit: 8, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('세포 연구팀 규명'), limit: 6, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('유전자 치료'), limit: 5, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('노벨생리의학상'), limit: 5, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('멸종위기종'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('신종 발견'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('국립생물자원관'), limit: 4, maxAgeDays: 3 },
  { type: 'bing', lang: 'ko', url: bing('미생물 연구'), limit: 4, maxAgeDays: 3 },

  // 교육 전문지 전체 기사 피드 (제목에 생명과학·'과학 교육' 등이 들어간 기사만 통과)
  { type: 'rss', lang: 'ko', name: '에듀프레스', url: 'https://www.edupress.kr/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '베리타스알파', url: 'https://www.veritas-a.com/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '에듀인뉴스', url: 'https://www.eduinnews.co.kr/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '교수신문', url: 'https://www.kyosu.net/rss/allArticle.xml', limit: 3, maxAgeDays: 5 },
  { type: 'rss', lang: 'ko', name: '헬로디디', url: 'https://www.hellodd.com/rss/allArticle.xml', limit: 4, maxAgeDays: 5 },

  // 해외 생명과학 매체 (trusted: 생명과학 전문 지면이라 키워드 필터를 건너뜀)
  // The Scientist·eLife·Knowable·Science·Cell 은 기사 화면이 봇 차단에 걸려 섬네일을 얻을 수 없어 제외
  { type: 'rss', lang: 'en', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/plants_animals/biology.xml', limit: 4, maxAgeDays: 14 },
  { type: 'rss', lang: 'en', name: 'ScienceDaily', url: 'https://www.sciencedaily.com/rss/plants_animals.xml', limit: 3, maxAgeDays: 14 },
  { type: 'rss', lang: 'en', name: 'Science News', trusted: true, url: 'https://www.sciencenews.org/topic/life/feed', limit: 3, maxAgeDays: 14 },
  { type: 'rss', lang: 'en', name: 'Quanta Magazine', trusted: true, url: 'https://www.quantamagazine.org/biology/feed/', limit: 2, maxAgeDays: 30 },
  { type: 'rss', lang: 'en', name: 'Nature', url: 'https://www.nature.com/nature.rss', limit: 3, maxAgeDays: 7 },
  { type: 'rss', lang: 'en', name: 'Science', url: 'https://www.science.org/rss/news_current.xml', require: /biolog|\bcells?\b|gene|genom|\bdna\b|rna|protein|brain|neuro|species|evolution|virus|bacteri|microb|ecolog|plant|animal|disease|cancer|vaccin|immun|fossil|dinosaur/i, limit: 2, maxAgeDays: 7 }, // Science(AAAS) 뉴스 — 제목에 과목 낱말이 있는 기사만
  // 고급 저널 (논문): 피드 전체가 생명과학이라 낱말 거르기 없이
  { type: 'rss', lang: 'en', name: 'Cell', trusted: true, category: '연구', url: 'https://www.cell.com/cell/current.rss', limit: 2, maxAgeDays: 30 },

  // SNS 인기 게시물: 생명과학 유튜브 채널들의 최근 영상 중 조회수가 많은 것만 싣습니다.
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
      ['수상한생선 Life Science', 'UCJJ_n7RI2ALoo5wdX2qzmYA', 'ko'],
      ['과학드림', 'UCIk1-yPCTnFuzfgu4gyfWqw', 'ko'],
      ['김응빈의 응생물학', 'UC7nAIf5iFw4pf8rWkTRrRxA', 'ko'],
      ['TV생물도감', 'UCgsgpELbaTiGjCHIjHVF8uQ', 'ko'],
      ['새덕후 Korean Birder', 'UCsbVGDDMTToaOwbzEK0_6Vg', 'ko'],
      ['에그박사', 'UCyhmwp12LECf7lvw7vddVPA', 'ko'],
      ['국립생태원', 'UCbl0zikxXmKC_RsEFPbCR4Q', 'ko'],
      ['국립생물자원관', 'UC4nZ0RgT2D7sqcHjOclTJCQ', 'ko'],
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
      ['Amoeba Sisters', 'UCb2GCoLSBXjmI_Qj1vk-44g', 'en'],
      ['Deep Look', 'UC-3SbfTPJsL8fJAPKiVqBLg', 'en'],
      ['PBS Eons', 'UCzR-rom72PHN9Zg7RML9EbA', 'en'],
      ['Animalogic', 'UCwg6_F2hDHYrqbNSGjmar4w', 'en'],
      ['Ze Frank', 'UCVpankR4HtoAVtYnFDUieYA', 'en'],
      ['Lindsay Nikole', 'UCrc2iv2-G1FZ3VscM3zu2jg', 'en'],
      ["Clint's Reptiles", 'UCH18915fTE6yZzKrqdea8RQ', 'en'],
      ['MinuteEarth', 'UCeiYXex_fwgYDonaTcSIk6w', 'en'],
      ['HHMI BioInteractive', 'UCdofq4hHbT3ZDzgYUqsDd1A', 'en'],
    ],
  },

  // 블루스카이: 생명과학 학술지·매체 계정의 최근 글 (공개 API 라 GitHub 서버에서도 1시간마다 수집됨)
  { type: 'bluesky', lang: 'en', name: 'eLife', handle: 'elife.bsky.social', category: '인기', limit: 3, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'PLOS Biology', handle: 'plosbiology.org', category: '인기', limit: 2, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'Cell Press', handle: 'cellpress.bsky.social', category: '인기', limit: 3, maxAgeDays: 7 },
  { type: 'bluesky', lang: 'en', name: 'Current Biology', handle: 'currentbiology.bsky.social', category: '인기', limit: 2, maxAgeDays: 14 },
  { type: 'bluesky', lang: 'en', name: 'Science News', handle: 'sciencenews.bsky.social', category: '인기', limit: 3, maxAgeDays: 7 },

  // 네이버 블로그 (trusted: 생물 전문 기관이라 키워드 필터를 건너뜀)
  { type: 'rss', lang: 'ko', name: '네이버 블로그 국립생물자원관', trusted: true, category: '인기', url: 'https://rss.blog.naver.com/nibr_bio.xml', limit: 3, maxAgeDays: 14 },
  { type: 'rss', lang: 'ko', name: '네이버 블로그 국립생태원', trusted: true, category: '인기', url: 'https://rss.blog.naver.com/nie_korea.xml', limit: 3, maxAgeDays: 14 },
]

export const youtubeFeed = youtube

// 인스타그램: 최근 게시물을 카드로 보여 줄 생명과학 계정 [계정, 언어]. scripts/collect-instagram.mjs 가 사용
export const INSTAGRAM_ACCOUNTS = [
  ['amoebasistersofficial', 'en'],
  ['cellpress', 'en'],
  ['elifesciences', 'en'],
  ['biointeractive', 'en'],
  ['clintsreptiles', 'en'],
  ['natgeoanimals', 'en'],
  ['nie_korea', 'ko'],
]

// 페이스북: 최신 게시물을 카드로 보여 줄 생명과학 페이지 [주소 이름, 표시 이름, 언어]. scripts/collect-facebook.mjs 가 사용
export const FACEBOOK_PAGES = [
  ['AmoebaSisters', 'The Amoeba Sisters', 'en'],
  ['cellpress', 'Cell Press', 'en'],
  ['elifesciences', 'eLife', 'en'],
  ['biointeractive', 'HHMI BioInteractive', 'en'],
  ['asbmb', 'ASBMB', 'en'],
  ['societyforneuroscience', 'Society for Neuroscience', 'en'],
]

// 국내 기사: 제목에 반드시 포함해야 할 것 / 걸러낼 것
// '진화' 는 'AI의 진화' 같은 기사까지 들어와서 넣지 않음 (공룡·화석·조류 등으로 진화 기사는 걸림)
export const KO_REQUIRE =
  /생명과학|생물|생명공학|생명연|유전[자체학병]|DNA|RNA|세포|단백질|효소|미생물|세균|박테리아|바이러스|백신|감염병|면역|항체|멸종|생태[원학]|생태계 ?(보전|교란|복원)|외래종|교란종|신종|야생|곤충|동물|식물|조류|어류|양서|파충류|공룡|화석|노벨생리|생리의학상|뇌과학|신경(세포|과학|망)|뉴런|줄기세포|게놈|광합성|호르몬|장내|마이크로바이옴|노화|치매|알츠하이머|과학탐구|과탐|사탐런|과학 ?교육|과학 ?교사|과학 ?수업|과학고|과학전람회|(과학|생물|생명과학) ?올림피아드/
// '생명과학'·'바이오'로 검색하면 기업·주식·보험 기사가 많이 섞여 회사 이름과 증시 용어를 걸러냄
// (주의: '[가-힣]+주 ' 같은 넓은 패턴은 전남광주·상주까지 막아 버림)
export const KO_EXCLUDE =
  /코오롱생명과학|엔지켐생명과학|YS생명과학|생명과학도구|툴립앤|관련주|건강관리주|바이오주|제약주|주가|특징주|목표가|증권|영업이익|실적|매출|수주|상장|코스닥|코스피|임상 ?[1-3]상|기술수출|기술이전|라이선스|투자 유치|셀트리온|삼성바이오|SK바이오|녹십자|지씨셀|대웅|차바이오|리가켐|에이비온|동아ST|HK이노엔|LIG|S-OIL|에쓰오일|동아오츠카|아모레|화장품|건기식|건강기능식품|안티에이징|클리닉|개원|생명보험|교보생명|농협생명|한화생명|삼성생명|보험|화재|소방|포토뉴스|부고|인사\]|수학|평화상|문학상|경제학상|학교폭력|헌혈|보이스피싱|신종자본|ESG/

// 해외 과학 매체는 생명과학과 무관한 기사가 섞여 있어 키워드로 한 번 더 거름
export const EN_REQUIRE =
  /biolog|\bcells?\b|cellular|\bgenes?\b|genetic|genom|\bDNA|\bRNA|protein|enzyme|evolution|evolv|species|animal|\bplants?\b|bacteri|microb|virus|viral|immun|neuro|\bbrain|fossil|dinosaur|ecolog|ecosystem|biodivers|extinct|wildlife|\bfish|\bbirds?\b|insect|mammal|reptile|amphibian|\bfrogs?\b|whale|shark|penguin|\bbees?\b|spider|fung|\btrees?\b|forest|crispr|stem cell|vaccin|organism|embryo|hormone|\bgut\b|microbiome|mitochondri|photosynth|predator|parasit|nobel|physiolog|\bmice\b|\bmoths?\b|butterfl|retina|antibiotic/i

// 기계 번역 기사 등 품질이 낮아 제외할 출처
export const BLOCKED_SOURCES = ['IDNFinancials', 'Vietnam.vn', 'Histoire pour Tous', 'note']

// 위에서부터 먼저 맞는 카테고리로 분류, 아무것도 안 맞으면 '교육'
export const KO_CATEGORIES = [
  ['입시', /수능|모의고사|모의평가|모평|입시|내신|대입|정시|수시|과탐|사탐런/],
  ['대회·행사', /올림피아드|경시|대회|전람회|축제|체험|페스티벌|캠프|박람회|전시/],
  ['생태·환경', /멸종|생태|생물다양성|야생|외래종|교란종|서식|철새|기후|보전|동물원|신종/],
  ['의학·바이오', /면역|백신|감염|바이러스|질환|항암|암 ?(세포|치료|환자)|치매|노화|호르몬|장내|항생제|유전|DNA|RNA|게놈|유전체|줄기세포|크리스퍼|CRISPR|유전자 ?편집|생명공학/],
  ['연구', /노벨|연구|개발|논문|학회|규명|발견|세포|단백질/],
]
