'use client';

import {
  animate,
  motion,
  MotionGlobalConfig,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';
import { useEffect } from 'react';

/** 数え上げにかける秒数 */
const DURATION = 0.8;

/**
 * 0 から value まで数え上げて見せる。React の state を通さず MotionValue で更新する。
 * 動きを減らす設定のとき・テストのときは、最初から value を出す。
 * 読み上げには使わないこと（途中の値が読まれる）。呼ぶ側で aria-hidden にし、最終の値を別に書く。
 */
export function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const still = reduce === true || MotionGlobalConfig.skipAnimations === true;
  const count = useMotionValue(still ? value : 0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (still) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, {
      duration: DURATION,
      ease: 'easeOut',
    });
    return () => controls.stop();
  }, [count, value, still]);

  return <motion.span>{rounded}</motion.span>;
}
