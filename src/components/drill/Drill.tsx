'use client';

import { useState } from 'react';
import {
  createLv1Rounds,
  createLv2Rounds,
  type Lv1Round,
  type Lv2Round,
} from '@/features/drill/levels';
import { DEFAULT_SETTINGS, type Rng } from '@/features/drill/types';
import { DrillSession } from './DrillSession';
import { lv1View } from './lv1View';
import { lv2View } from './lv2View';
import { SetupForm } from './SetupForm';

type Props = {
  /** テストで出題を固定するために差し替える */
  rng?: Rng;
};

type Session =
  | { id: number; level: 1; rounds: Lv1Round[] }
  | { id: number; level: 2; rounds: Lv2Round[] };

export function Drill({ rng = Math.random }: Props) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // 乱数を使うので、問題は描画中ではなくボタンのイベントの中で作る
  const start = () => {
    try {
      const id = (session?.id ?? 0) + 1;
      setSession(
        settings.level === 1
          ? { id, level: 1, rounds: createLv1Rounds(settings, rng) }
          : { id, level: 2, rounds: createLv2Rounds(settings, rng) }
      );
      setStartError(null);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : '問題を作れませんでした');
    }
  };
  const exit = () => setSession(null);

  if (session === null) {
    return (
      <>
        <SetupForm settings={settings} onChange={setSettings} onStart={start} />
        {startError && (
          <p role="alert" className="mt-3 text-sm text-rose-600">
            {startError}
          </p>
        )}
      </>
    );
  }

  return session.level === 1 ? (
    <DrillSession
      key={session.id}
      rounds={session.rounds}
      view={lv1View}
      settings={settings}
      onExit={exit}
    />
  ) : (
    <DrillSession
      key={session.id}
      rounds={session.rounds}
      view={lv2View}
      settings={settings}
      onExit={exit}
    />
  );
}
