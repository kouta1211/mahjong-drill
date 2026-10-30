import { Drill } from '@/components/drill/Drill';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8 md:max-w-2xl md:px-8 lg:max-w-5xl lg:py-12">
      <header className="text-center">
        <h1 className="font-display text-3xl tracking-wider lg:text-4xl">
          麻雀点数計算
        </h1>
        <p className="mt-1 text-sm text-muted">
          Mリーグルール準拠 ・ 早見表から点数申告まで
        </p>
      </header>
      <Drill />
    </main>
  );
}
