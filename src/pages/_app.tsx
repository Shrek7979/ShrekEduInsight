import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import Script from 'next/script'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { GOATCOUNTER } from '@/lib/feed'

declare global {
  interface Window {
    goatcounter?: { count: (vars: { path: string }) => void; no_onload?: boolean }
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // 방문자 통계: 페이지를 열 때와, 사이트 안에서 다른 페이지(소개 등)로 옮길 때 한 번씩 셈
  useEffect(() => {
    if (!GOATCOUNTER) return
    const onRoute = (url: string) => window.goatcounter?.count({ path: url.split('?')[0] })
    router.events.on('routeChangeComplete', onRoute)
    return () => router.events.off('routeChangeComplete', onRoute)
  }, [router.events])

  return (
    <>
      <Component {...pageProps} />
      {GOATCOUNTER && (
        <Script data-goatcounter={`https://${GOATCOUNTER}.goatcounter.com/count`} src="https://gc.zgo.at/count.js" strategy="afterInteractive" />
      )}
    </>
  )
}
