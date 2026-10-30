'use client';

import { useState } from 'react';
import {
  createLv1Rounds,
  createLv2Rounds,
  createLv3Rounds,
  createLv4Rounds,
  type Lv1Round,
  type Lv2Round,
  type Lv3Round,
  type Lv4Round,
} from '@/features/drill/levels';
import {
  DEFAULT_SETTINGS,
  type DrillSettings,
  type Rng,
} from '@/features/drill/types';
import { DrillSession } from './DrillSession';
import { lv1View } from './lv1View';
import { lv2View } from './lv2View';
import { lv3View } from './lv3View';
import { lv4View } from './lv4View';
import { SetupForm } from './SetupForm';

type Props = {
  /** テストで出題を固定するために差し替える */
  rng?: Rng;
};

function createSession(settings: DrillSettings, rng: Rng, id: number): Session {
  switch (settings.level) {
    case 1:
      return { id, level: 1, rounds: createLv1Rounds(settings, rng) };
    case 2:
      return { id, level: 2, rounds: createLv2Rounds(settings, rng) };
    case 3:
      return { id, level: 3, rounds: createLv3Rounds(settings, rng) };
    case 4:
      return { id, level: 4, rounds: createLv4Rounds(settings, rng) };
  }
}

type Session =
  | { id: number; level: 1; rounds: Lv1Round[] }
  | { id: number; level: 2; rounds: Lv2Round[] }
  | { id: number; level: 3; rounds: Lv3Round[] }
  | { id: number; level: 4; rounds: Lv4Round[] };

export function Drill({ rng = Math.random }: Props) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // 乱数を使うので、問題は描画中ではなくボタンのイベントの中で作る
  const start = () => {
    try {
      const id = (session?.id ?? 0) + 1;
      setSession(createSession(settings, rng, id));
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

  const common = { settings, onExit: exit };
  switch (session.level) {
    case 1:
      return (
        <DrillSession
          key={session.id}
          rounds={session.rounds}
          view={lv1View}
          {...common}
        />
      );
    case 2:
      return (
        <DrillSession
          key={session.id}
          rounds={session.rounds}
          view={lv2View}
          {...common}
        />
      );
    case 3:
      return (
        <DrillSession
          key={session.id}
          rounds={session.rounds}
          view={lv3View}
          {...common}
        />
      );
    case 4:
      return (
        <DrillSession
          key={session.id}
          rounds={session.rounds}
          view={lv4View}
          {...common}
        />
      );
  }
}
