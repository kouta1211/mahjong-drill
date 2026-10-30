import { Drill } from '@/components/drill/Drill';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 md:max-w-2xl md:px-8 lg:max-w-5xl lg:py-12">
      <h1 className="text-center text-2xl font-semibold lg:text-3xl">
        麻雀点数計算ドリル
      </h1>
      <Drill />
    </main>
  );
}
