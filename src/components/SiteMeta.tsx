import Head from 'next/head'
import { useRouter } from 'next/router'
import { DESCRIPTION, SITE_NAME, SITE_URL, TAGLINE } from '@/lib/feed'

// 미리보기 그림을 바꾸면 숫자를 올림 (카카오톡 등이 예전 그림을 기억하지 않도록)
const OG_IMAGE = `${SITE_URL}/og.jpg?v=3`

// 모든 페이지 공통 머리말: 제목, 검색·공유 미리보기, 아이콘 (아이콘 주소는 basePath 를 붙여야 GitHub Pages 에서 보임)
export default function SiteMeta({ title, path = '/', description = DESCRIPTION }: { title?: string; path?: string; description?: string }) {
  const { basePath } = useRouter()
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${TAGLINE}`
  const url = `${SITE_URL}${path}`
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#08090b" />
      <link rel="canonical" href={url} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
      {/* 카톡·슬랙·페북 등에 링크를 올렸을 때 보이는 미리보기 */}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:image:secure_url" content={OG_IMAGE} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${SITE_NAME} — 수학·물리·화학·생명과학 STEM 융합 교육 인사이트`} />
      <meta property="og:url" content={url} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />
      <link rel="manifest" href={`${basePath}/manifest.json`} />
      <link rel="icon" href={`${basePath}/favicon.ico`} sizes="any" />
      <link rel="icon" href={`${basePath}/icon-180.png`} type="image/png" />
      <link rel="apple-touch-icon" href={`${basePath}/icon-180.png`} />
      {/* 검색엔진이 사이트 이름을 알아보도록 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/`, description: DESCRIPTION, inLanguage: 'ko' }),
        }}
      />
    </Head>
  )
}
