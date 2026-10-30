'use client';

import { MotionConfig } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
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
import { Calculator } from '@/components/calculator/Calculator';
import { StatsView } from '@/components/history/StatsView';
import { saveRecord } from '@/features/history/historyStore';
import { DrillSession, type FinishedAnswer } from './DrillSession';
import { lv1View } from './lv1View';
import { lv2View } from './lv2View';
import { lv3View } from './lv3View';
import { lv4View } from './lv4View';
import { SetupForm } from './SetupForm';
import { ERROR_TEXT } from '@/components/ui/styles';

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

/**
 * 設定以外の画面（出題・成績・計算機）に入ったら、履歴を1つ積む。
 * ブラウザの「戻る」でアプリの外へ出ず、設定画面に戻れるように。
 * URL は変えない（再読み込みで、問題の無い出題画面に入らないように）
 */
const SCREEN_KEY = 'mahjongDrillScreen';

function pushScreenEntry() {
  window.history.pushState({ [SCREEN_KEY]: true }, '');
}

/** アプリの中のボタンで設定に戻るときは、積んだ履歴も戻す（戻るを2回押さないと出られない、を防ぐ） */
function popScreenEntry() {
  const state: unknown = window.history.state;
  if (typeof state === 'object' && state !== null && SCREEN_KEY in state) {
    window.history.back();
  }
}

/** OS の「視差効果を減らす」がオンなら、アニメーションを止める */
const Motion = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">{children}</MotionConfig>
);

export function Drill(props: Props) {
  return (
    <Motion>
      <DrillContent {...props} />
    </Motion>
  );
}

function DrillContent({ rng = Math.random }: Props) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [session, setSession] = useState<Session | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [screen, setScreen] = useState<'setup' | 'stats' | 'calculator'>(
    'setup'
  );

  // ブラウザの「戻る」で設定画面に戻す
  useEffect(() => {
    const onPopState = () => {
      setSession(null);
      setScreen('setup');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // 乱数を使うので、問題は描画中ではなくボタンのイベントの中で作る
  const start = () => {
    try {
      const id = (session?.id ?? 0) + 1;
      setSession(createSession(settings, rng, id));
      setStartError(null);
      pushScreenEntry();
    } catch (e) {
      setStartError(e instanceof Error ? e.message : '問題を作れませんでした');
    }
  };
  const exit = () => {
    setSession(null);
    popScreenEntry();
  };

  const open = (next: 'stats' | 'calculator') => {
    setScreen(next);
    pushScreenEntry();
  };
  const back = () => {
    setScreen('setup');
    popScreenEntry();
  };
  if (screen === 'stats') return <StatsView onBack={back} />;
  if (screen === 'calculator') return <Calculator onBack={back} />;

  if (session === null) {
    return (
      <>
        <SetupForm
          settings={settings}
          onChange={setSettings}
          onStart={start}
          onShowStats={() => open('stats')}
          onShowCalculator={() => open('calculator')}
        />
        {startError && (
          <p role="alert" className={`mt-3 ${ERROR_TEXT}`}>
            {startError}
          </p>
        )}
      </>
    );
  }

  // 1回分を終えたら、端末内に成績を保存する（保存できなくてもドリルは続けられる）
  const level = session.level;
  const onFinish = (answers: FinishedAnswer[]) => {
    saveRecord({
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      finishedAt: new Date().toISOString(),
      level,
      answers,
    });
  };
  const common = { settings, onExit: exit, onFinish };
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
