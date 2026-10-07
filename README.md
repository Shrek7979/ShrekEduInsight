# Shrek Edu Insight

**오늘의 수학&과학, 수업이 되는 뉴스** — 수학·물리·화학·생명과학 교사를 위한 교육 뉴스 피드.

- 사이트: https://shrek7979.github.io/ShrekEduInsight/
- 예전 과목 사이트(Shrek Math News, Jang Phys News, Song Chem News, Jangs Bio News)는 이 사이트로 통합되었고, 예전 주소로 들어오면 해당 과목 화면(`?s=math` 등)으로 자동 이동합니다.

## 구조

```
subjects/
  math/  phys/  chem/  bio/      과목마다 하나씩
    scripts/   수집기 (뉴스·유튜브·저널 RSS, 인스타그램·페이스북, 섬네일, 번역)
    data/      수집 결과 feed.json · instagram.json · facebook.json · topics.json
    public/    SNS 그림(social/), 섬네일(thumbs/ — 저장소에는 올리지 않음)
scripts/
  collect-all.mjs     네 과목 수집을 한꺼번에 (news | sns | ig)
  prepare-assets.mjs  빌드 전에 subjects/*/public 을 public/s/<과목> 으로 복사
  sns-update.cmd      PC 예약 작업 (1시간마다: 인스타그램 + 필요하면 뉴스 → GitHub 에 올림)
src/                  사이트 화면 (Next.js)
```

## 어떻게 돌아가나요

- GitHub Actions(`.github/workflows/publish.yml`)가 약 1시간마다 네 과목을 동시에 수집하고 사이트를 배포합니다.
- GitHub 예약 실행은 자주 밀리므로, PC 의 Windows 예약 작업 **"ShrekEduInsight SNS Update"** 가 1시간마다 인스타그램(서버에서는 막힘)과 뉴스를 모아 올립니다. 작업 폴더는 건드리지 않고 `.cache/bot-repo` 복사본에서만 git 을 씁니다.
- 사이트를 열면 브라우저가 이 저장소의 최신 `subjects/*/data/*.json` 을 읽어 바로 새 소식을 보여 줍니다.
- 부고·임명 같은 개인 소식, 광고·홍보성 기사는 수집 단계와 화면 단계에서 모두 거릅니다.

```bash
npm run dev            # http://localhost:3040
npm run collect        # 네 과목 뉴스 수집
npm run collect:sns    # 인스타그램·페이스북
```
