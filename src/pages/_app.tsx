import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { recordVisit } from '@/lib/stats'

export default function App({ Component, pageProps }: AppProps) {
  // 방문 통계: 사이트를 열 때 한 번 (자세한 규칙은 src/lib/stats.ts)
  useEffect(() => recordVisit(), [])
  return <Component {...pageProps} />
}
