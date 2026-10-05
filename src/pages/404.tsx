import Link from 'next/link'
import SiteMeta from '@/components/SiteMeta'

// 없는 주소로 들어왔을 때
export default function NotFound() {
  return (
    <>
      <SiteMeta title="페이지를 찾을 수 없어요" path="/404/" />
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08090b] p-8 text-center text-white">
        <p className="text-5xl font-extrabold text-amber-300">404</p>
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없어요</h1>
        <p className="break-keep text-white/60">주소가 바뀌었거나 없어진 페이지입니다.</p>
        <Link href="/" className="flex min-h-[48px] items-center rounded-xl bg-white px-6 font-bold text-neutral-900">
          피드로 가기
        </Link>
      </div>
    </>
  )
}
