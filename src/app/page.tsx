import { Drill } from '@/components/drill/Drill';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-center text-2xl font-semibold">麻雀点数計算ドリル</h1>
      <Drill />
    </main>
  );
}
