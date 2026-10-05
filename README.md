# Shrek Edu Insight

**오늘의 수학과학, 수업이 되는 뉴스** — 수학·물리·화학·생명과학 뉴스 피드를 하나로 모은 교육 피드.

- 사이트: https://shrek7979.github.io/ShrekEduInsight/
- 과목 사이트: [수학](https://shrek7979.github.io/ShrekMathNews/) · [물리](https://shrek7979.github.io/JangPhysNews/) · [화학](https://shrek7979.github.io/SongChemNews/) · [생명과학](https://shrek7979.github.io/JangsBioNews/)

## 어떻게 돌아가나요

- 뉴스 수집은 네 과목 사이트가 각자 1시간마다 합니다. 이 사이트는 따로 수집하지 않아요.
- 페이지를 열면 브라우저가 네 저장소의 `data/feed.json`, `instagram.json`, `facebook.json`, `topics.json` 을 바로 읽어 한 피드로 합칩니다 (`src/lib/sources.ts`). 그래서 이 사이트를 다시 배포하지 않아도 내용은 늘 최신입니다.
- 열어 둔 채로 있으면 10분마다, 다른 앱에 갔다 돌아오면 바로 새 소식을 확인합니다. 카드를 넘겨 보는 중이면 위쪽에 "새 소식 n건 보기" 버튼이 뜹니다.
- 같은 기사·영상이 여러 과목에 있으면 하나만 보여 줍니다.
- 과목을 추가하려면 `src/lib/feed.ts` 의 `SUBJECTS` 에 저장소를 넣고, 주제 카드 그림은 `src/components/feed/visuals/<과목>/` 에 둡니다.

```bash
npm run dev    # http://localhost:3040
```
